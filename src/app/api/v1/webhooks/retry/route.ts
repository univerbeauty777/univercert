// UniverCert · POST /api/v1/webhooks/retry (S40)
// Cron-friendly: pega deliveries pending (next_retry_at <= now) e re-tenta entrega.
// Roda via Cloudflare Cron Trigger ou external scheduler.

import { eq, and, lte, lt, isNull, or } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { webhookDeliveries, webhookEndpoints } from '@/db/schema';
import { deliverOnce } from '@/lib/webhook-dispatcher';

export const runtime = 'edge';

const MAX_BATCH = 20;

export async function POST(req: Request) {
  // Auth via shared secret (CRON_SECRET env var) ou Bearer
  const authHeader = req.headers.get('authorization') ?? '';
  // @ts-expect-error - env binding
  const env = (req as any).cf ? (await import('@cloudflare/next-on-pages')).getRequestContext().env : {};
  const cronSecret = (env as any).CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return Response.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  const db = getDb();
  const now = Math.floor(Date.now() / 1000);

  // Pega pending deliveries
  const pending = await db.select({
    id: webhookDeliveries.id,
    endpointId: webhookDeliveries.endpointId,
    payloadJson: webhookDeliveries.payloadJson,
  })
    .from(webhookDeliveries)
    .where(
      and(
        isNull(webhookDeliveries.deliveredAt),
        lt(webhookDeliveries.attemptCount, webhookDeliveries.maxAttempts),
        or(isNull(webhookDeliveries.nextRetryAt), lte(webhookDeliveries.nextRetryAt, now)),
      ),
    )
    .limit(MAX_BATCH);

  if (pending.length === 0) return Response.json({ ok: true, processed: 0 });

  // Pega endpoints (1 query batch)
  const endpointIds = [...new Set(pending.map((p) => p.endpointId))];
  const endpoints = await Promise.all(endpointIds.map((id) =>
    db.select().from(webhookEndpoints).where(eq(webhookEndpoints.id, id)).limit(1).then((r) => r[0]),
  ));
  const endpointMap = new Map(endpoints.filter(Boolean).map((e) => [e!.id, e!]));

  let success = 0, failed = 0;
  await Promise.all(pending.map(async (p) => {
    const ep = endpointMap.get(p.endpointId);
    if (!ep || ep.status !== 'active') { failed++; return; }
    const r = await deliverOnce(p.id, ep.url, ep.secret, p.payloadJson).catch(() => ({ ok: false }));
    if (r.ok) success++; else failed++;
  }));

  return Response.json({ ok: true, processed: pending.length, success, failed });
}

export const GET = POST; // permite trigger manual via GET com auth
