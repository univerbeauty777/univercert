// UniverCert · /api/v1/webhooks/endpoints (S40)

import { eq, desc } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { webhookEndpoints } from '@/db/schema';
import { ID } from '@/lib/ulid';
import { requireRole, RbacError } from '@/lib/rbac';
import { generateWebhookSecret, SUPPORTED_EVENTS } from '@/lib/webhook-dispatcher';

export const runtime = 'edge';

export async function GET() {
  let sess;
  try { sess = await requireRole('admin'); }
  catch (e) {
    if (e instanceof RbacError) return Response.json({ ok: false, error: e.code }, { status: 401 });
    throw e;
  }
  const db = getDb();
  const rows = await db.select().from(webhookEndpoints).where(eq(webhookEndpoints.workspaceId, sess.workspace.id)).orderBy(desc(webhookEndpoints.createdAt));
  return Response.json({
    ok: true,
    endpoints: rows.map((r) => ({
      id: r.id, name: r.name, url: r.url,
      events: JSON.parse(r.eventsJson),
      status: r.status, totalDeliveries: r.totalDeliveries, totalFailures: r.totalFailures,
      lastSuccessAt: r.lastSuccessAt, lastFailureAt: r.lastFailureAt, lastFailureReason: r.lastFailureReason,
      createdAt: r.createdAt,
      // secret nunca retornado em GET (só na criação)
    })),
    supportedEvents: SUPPORTED_EVENTS,
  });
}

export async function POST(req: Request) {
  let sess;
  try { sess = await requireRole('admin'); }
  catch (e) {
    if (e instanceof RbacError) return Response.json({ ok: false, error: e.code }, { status: 401 });
    throw e;
  }

  const body = await req.json().catch(() => ({})) as { name?: string; url?: string; events?: string[] };
  if (!body.name?.trim()) return Response.json({ ok: false, error: 'name obrigatorio' }, { status: 400 });
  if (!body.url?.startsWith('https://')) return Response.json({ ok: false, error: 'url deve comecar com https://' }, { status: 400 });
  if (!Array.isArray(body.events) || body.events.length === 0) return Response.json({ ok: false, error: 'events[] obrigatorio' }, { status: 400 });

  const validEvents = body.events.filter((e) => SUPPORTED_EVENTS.includes(e as any) || e === '*');
  if (validEvents.length === 0) return Response.json({ ok: false, error: 'nenhum event valido', supported: SUPPORTED_EVENTS }, { status: 400 });

  const id = ID.webhookEndpoint();
  const secret = generateWebhookSecret();
  const db = getDb();
  await db.insert(webhookEndpoints).values({
    id,
    workspaceId: sess.workspace.id,
    createdByUserId: sess.user.id,
    name: body.name.trim().slice(0, 80),
    url: body.url.trim().slice(0, 500),
    secret,
    eventsJson: JSON.stringify(validEvents),
    status: 'active',
  });

  return Response.json({
    ok: true,
    id, secret,                   // mostra UMA vez
    warning: 'Salve esse secret. NAO sera mostrado novamente.',
    signing_docs: 'Cada request POST chega com header x-univercert-signature = HMAC_SHA256(payload, secret) em hex',
  });
}
