// UniverCert · Outgoing webhook dispatcher (S40)
// Edge-compatible. HMAC SHA-256 signature + exponential retry.

import { eq, and, sql } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { webhookEndpoints, webhookDeliveries } from '@/db/schema';
import { ID } from '@/lib/ulid';

export type WebhookEvent =
  | 'cert.issued'
  | 'cert.revoked'
  | 'request.submitted'
  | 'request.approved'
  | 'request.rejected'
  | 'request.needs_revision'
  | 'recipient.created'
  | 'workspace.member.invited';

export type WebhookPayload = {
  event: WebhookEvent;
  id: string;                  // event id (univercert)
  occurred_at: number;          // unix
  workspace_id: string;
  data: Record<string, any>;
};

const RETRY_DELAYS_SEC = [60, 300, 1800, 7200, 21600]; // 1m, 5m, 30m, 2h, 6h
const MAX_ATTEMPTS = 5;
const TIMEOUT_MS = 8000;

/** Gera signature HMAC SHA-256 do payload com secret */
async function signPayload(payload: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sigBuf = await crypto.subtle.sign('HMAC', key, enc.encode(payload));
  return Array.from(new Uint8Array(sigBuf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Dispara webhook event pra todos os endpoints subscritos no workspace.
 * Retorna lista de delivery IDs criados (1 por endpoint).
 * Cada delivery é tentada imediatamente; failures vão pra retry queue.
 */
export async function dispatchWebhook(workspaceId: string, payload: WebhookPayload): Promise<string[]> {
  const db = getDb();
  const endpoints = await db.select().from(webhookEndpoints)
    .where(and(eq(webhookEndpoints.workspaceId, workspaceId), eq(webhookEndpoints.status, 'active')))
    .limit(20);

  const subscribed = endpoints.filter((ep) => {
    try {
      const events = JSON.parse(ep.eventsJson) as string[];
      return events.includes(payload.event) || events.includes('*');
    } catch { return false; }
  });

  if (subscribed.length === 0) return [];

  const deliveryIds: string[] = [];
  const payloadStr = JSON.stringify(payload);

  // Cria delivery records + tenta entregar imediatamente (fire and forget)
  await Promise.all(subscribed.map(async (ep) => {
    const dId = ID.webhookDelivery();
    deliveryIds.push(dId);

    await db.insert(webhookDeliveries).values({
      id: dId,
      endpointId: ep.id,
      workspaceId,
      eventType: payload.event,
      eventId: payload.id,
      payloadJson: payloadStr,
      attemptCount: 0,
      maxAttempts: MAX_ATTEMPTS,
    });

    // Tenta entrega imediata — não bloqueia caller
    deliverOnce(dId, ep.url, ep.secret, payloadStr).catch(() => {});
  }));

  return deliveryIds;
}

/** Entrega uma delivery (cria/incrementa attempt). Se falhar, agenda retry. */
export async function deliverOnce(deliveryId: string, url: string, secret: string, payloadStr: string): Promise<{ ok: boolean; status?: number; error?: string }> {
  const db = getDb();
  const startedAt = Date.now();
  const sig = await signPayload(payloadStr, secret);
  const tsNow = Math.floor(Date.now() / 1000);

  let respStatus = 0;
  let respBody = '';
  let success = false;
  let errorMsg: string | null = null;

  try {
    const ctrl = new AbortController();
    const timeoutId = setTimeout(() => ctrl.abort(), TIMEOUT_MS);

    const r = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-univercert-signature': sig,
        'x-univercert-timestamp': String(tsNow),
        'user-agent': 'UniverCert-Webhooks/1.0',
      },
      body: payloadStr,
      signal: ctrl.signal,
    });
    clearTimeout(timeoutId);

    respStatus = r.status;
    respBody = (await r.text().catch(() => '')).slice(0, 500);
    success = r.status >= 200 && r.status < 300;
  } catch (e) {
    errorMsg = (e as Error).message?.slice(0, 200) ?? 'unknown';
  }

  const duration = Date.now() - startedAt;

  // Update delivery record
  const [delivery] = await db.select().from(webhookDeliveries).where(eq(webhookDeliveries.id, deliveryId)).limit(1);
  if (!delivery) return { ok: success, status: respStatus, error: errorMsg ?? undefined };

  const newAttempts = delivery.attemptCount + 1;
  const nextRetryAt = !success && newAttempts < delivery.maxAttempts
    ? tsNow + (RETRY_DELAYS_SEC[newAttempts - 1] ?? RETRY_DELAYS_SEC[RETRY_DELAYS_SEC.length - 1])
    : null;

  await db.update(webhookDeliveries).set({
    responseStatus: respStatus || null,
    responseBody: errorMsg ? `ERR: ${errorMsg}` : respBody,
    attemptCount: newAttempts,
    nextRetryAt,
    deliveredAt: success ? tsNow : null,
    durationMs: duration,
  }).where(eq(webhookDeliveries.id, deliveryId));

  // Update endpoint stats
  await db.update(webhookEndpoints).set({
    totalDeliveries: sql`${webhookEndpoints.totalDeliveries} + 1`,
    totalFailures: success ? sql`${webhookEndpoints.totalFailures}` : sql`${webhookEndpoints.totalFailures} + 1`,
    lastSuccessAt: success ? tsNow : webhookEndpoints.lastSuccessAt,
    lastFailureAt: success ? webhookEndpoints.lastFailureAt : tsNow,
    lastFailureReason: success ? null : (errorMsg ?? `HTTP ${respStatus}`),
    status: !success && newAttempts >= delivery.maxAttempts ? 'failing' : webhookEndpoints.status,
  } as any).where(eq(webhookEndpoints.id, delivery.endpointId)).catch(() => {});

  return { ok: success, status: respStatus, error: errorMsg ?? undefined };
}

/** Gera secret HMAC random (32 bytes hex) */
export function generateWebhookSecret(): string {
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return 'whsec_' + Array.from(arr).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export const SUPPORTED_EVENTS: WebhookEvent[] = [
  'cert.issued',
  'cert.revoked',
  'request.submitted',
  'request.approved',
  'request.rejected',
  'request.needs_revision',
  'recipient.created',
  'workspace.member.invited',
];
