// UniverCert · /api/v1/affiliate (S44)
// GET = stats do meu affiliate; POST = ativa/cria affiliate

import { eq, desc } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { affiliates, referrals } from '@/db/schema';
import { requireRole, RbacError } from '@/lib/rbac';
import { createAffiliate } from '@/lib/affiliate';

export const runtime = 'edge';

export async function GET() {
  let sess;
  try { sess = await requireRole('admin'); }
  catch (e) {
    if (e instanceof RbacError) return Response.json({ ok: false, error: e.code }, { status: 401 });
    throw e;
  }

  const db = getDb();
  const [aff] = await db.select().from(affiliates).where(eq(affiliates.workspaceId, sess.workspace.id)).limit(1);
  if (!aff) return Response.json({ ok: true, affiliate: null });

  const refs = await db.select({
    id: referrals.id, status: referrals.status, source: referrals.source,
    firstPaymentAt: referrals.firstPaymentAt,
    totalPaidByReferredBrlCents: referrals.totalPaidByReferredBrlCents,
    commissionEarnedBrlCents: referrals.commissionEarnedBrlCents,
    createdAt: referrals.createdAt,
  }).from(referrals).where(eq(referrals.affiliateId, aff.id)).orderBy(desc(referrals.createdAt)).limit(50);

  return Response.json({
    ok: true,
    affiliate: {
      id: aff.id, code: aff.code, tier: aff.tier, commissionPct: aff.commissionPct,
      status: aff.status, totalSignups: aff.totalSignups, totalPayingReferred: aff.totalPayingReferred,
      totalCommissionBrlCents: aff.totalCommissionBrlCents, totalPaidBrlCents: aff.totalPaidBrlCents,
    },
    referrals: refs,
    trackUrl: `https://univercert.net/api/v1/affiliate/track?ref=${aff.code}&redirect=/`,
  });
}

export async function POST(req: Request) {
  let sess;
  try { sess = await requireRole('admin'); }
  catch (e) {
    if (e instanceof RbacError) return Response.json({ ok: false, error: e.code }, { status: 401 });
    throw e;
  }

  const body = await req.json().catch(() => ({})) as { code?: string };
  const code = body.code?.trim();
  if (!code || code.length < 3) return Response.json({ ok: false, error: 'code minimo 3 chars' }, { status: 400 });

  const db = getDb();
  const [existing] = await db.select().from(affiliates).where(eq(affiliates.workspaceId, sess.workspace.id)).limit(1);
  if (existing) return Response.json({ ok: false, error: 'workspace ja tem affiliate' }, { status: 400 });

  try {
    const r = await createAffiliate({ workspaceId: sess.workspace.id, code });
    return Response.json({ ok: true, ...r });
  } catch (e) {
    return Response.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}
