// UniverCert · DELETE/PATCH /api/v1/webhooks/endpoints/[id] (S40)

import { eq, and } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { webhookEndpoints } from '@/db/schema';
import { requireRole, RbacError } from '@/lib/rbac';

export const runtime = 'edge';

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  let sess;
  try { sess = await requireRole('admin'); }
  catch (e) {
    if (e instanceof RbacError) return Response.json({ ok: false, error: e.code }, { status: 401 });
    throw e;
  }
  const db = getDb();
  await db.delete(webhookEndpoints).where(and(eq(webhookEndpoints.id, id), eq(webhookEndpoints.workspaceId, sess.workspace.id)));
  return Response.json({ ok: true });
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  let sess;
  try { sess = await requireRole('admin'); }
  catch (e) {
    if (e instanceof RbacError) return Response.json({ ok: false, error: e.code }, { status: 401 });
    throw e;
  }
  const body = await req.json().catch(() => ({})) as { status?: string; events?: string[]; name?: string };
  const update: any = { updatedAt: Math.floor(Date.now() / 1000) };
  if (body.status === 'active' || body.status === 'disabled') update.status = body.status;
  if (Array.isArray(body.events)) update.eventsJson = JSON.stringify(body.events);
  if (body.name) update.name = body.name.slice(0, 80);
  const db = getDb();
  await db.update(webhookEndpoints).set(update).where(and(eq(webhookEndpoints.id, id), eq(webhookEndpoints.workspaceId, sess.workspace.id)));
  return Response.json({ ok: true });
}
