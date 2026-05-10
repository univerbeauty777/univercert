// UniverCert · POST /api/v1/email/domains/[id]/verify (S61)

import { eq, and } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { workspaceEmailDomains } from '@/db/schema';
import { requireRole, RbacError } from '@/lib/rbac';
import { verifyResendDomain, getResendDomain } from '@/lib/resend-domains';

export const runtime = 'edge';

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  let sess;
  try { sess = await requireRole('admin'); }
  catch (e) {
    if (e instanceof RbacError) return Response.json({ ok: false, error: e.code }, { status: 401 });
    throw e;
  }

  const db = getDb();
  const [row] = await db.select().from(workspaceEmailDomains)
    .where(and(eq(workspaceEmailDomains.id, id), eq(workspaceEmailDomains.workspaceId, sess.workspace.id)))
    .limit(1);
  if (!row || !row.resendDomainId) return Response.json({ ok: false, error: 'not_found' }, { status: 404 });

  try {
    await verifyResendDomain(row.resendDomainId).catch(() => {});  // dispara verify
    const fresh = await getResendDomain(row.resendDomainId);
    const isVerified = fresh.status === 'verified';

    await db.update(workspaceEmailDomains).set({
      status: isVerified ? 'verified' : (fresh.status === 'failure' ? 'failed' : 'verifying'),
      recordsJson: JSON.stringify(fresh.records),
      lastCheckAt: Math.floor(Date.now() / 1000),
      verifiedAt: isVerified ? Math.floor(Date.now() / 1000) : row.verifiedAt,
      updatedAt: Math.floor(Date.now() / 1000),
    }).where(eq(workspaceEmailDomains.id, id));

    return Response.json({
      ok: true,
      status: isVerified ? 'verified' : fresh.status,
      records: fresh.records,
      message: isVerified ? 'Domínio verificado! Já pode mandar emails.' : 'Verificação em andamento — pode levar até 24h.',
    });
  } catch (e) {
    return Response.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}
