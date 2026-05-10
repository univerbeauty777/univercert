// UniverCert · DELETE /api/v1/api-keys/[id] (S39)

import { requireRole, RbacError } from '@/lib/rbac';
import { revokeApiKey } from '@/lib/api-key';

export const runtime = 'edge';

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  let sess;
  try { sess = await requireRole('admin'); }
  catch (e) {
    if (e instanceof RbacError) return Response.json({ ok: false, error: e.code }, { status: 401 });
    throw e;
  }

  const body = await req.json().catch(() => ({})) as { reason?: string };
  await revokeApiKey(id, sess.workspace.id, body.reason ?? 'manual revoke');
  return Response.json({ ok: true, revokedAt: Math.floor(Date.now() / 1000) });
}
