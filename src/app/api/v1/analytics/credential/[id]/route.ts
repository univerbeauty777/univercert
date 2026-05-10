// UniverCert · GET /api/v1/analytics/credential/[id] (S32)
// Per-cert: shares por canal, verifications timeline, geo (estimado por user-agent)

import { eq, and, desc, count } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { credentials, shareEvents, verifyLogs } from '@/db/schema';
import { requireRole, RbacError } from '@/lib/rbac';

export const runtime = 'edge';

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  let sess;
  try {
    sess = await requireRole('viewer');
  } catch (e) {
    if (e instanceof RbacError) return Response.json({ ok: false, error: e.code }, { status: 401 });
    throw e;
  }
  const db = getDb();

  const [cred] = await db.select().from(credentials).where(eq(credentials.id, id)).limit(1);
  if (!cred) return Response.json({ ok: false, error: 'cert nao encontrado' }, { status: 404 });
  if (cred.workspaceId !== sess.workspace.id) {
    return Response.json({ ok: false, error: 'cert pertence a outro workspace' }, { status: 403 });
  }

  const [sharesByCh, sharesTimeline, verifyTimeline, totalShares, totalVerify] = await Promise.all([
    db.select({ channel: shareEvents.channel, total: count() })
      .from(shareEvents).where(eq(shareEvents.credentialId, id))
      .groupBy(shareEvents.channel).orderBy(desc(count())),

    db.select({ ts: shareEvents.occurredAt, channel: shareEvents.channel, ua: shareEvents.userAgent, ref: shareEvents.referer })
      .from(shareEvents).where(eq(shareEvents.credentialId, id))
      .orderBy(desc(shareEvents.occurredAt)).limit(50),

    db.select({ ts: verifyLogs.occurredAt, ua: verifyLogs.userAgent })
      .from(verifyLogs).where(eq(verifyLogs.credentialId, id))
      .orderBy(desc(verifyLogs.occurredAt)).limit(50),

    db.select({ value: count() }).from(shareEvents).where(eq(shareEvents.credentialId, id)),
    db.select({ value: count() }).from(verifyLogs).where(eq(verifyLogs.credentialId, id)),
  ]);

  return Response.json({
    ok: true,
    credential: { id: cred.id, courseName: cred.courseName, issuedAt: cred.issuedAt, status: cred.status },
    totals: {
      shares: totalShares[0]?.value ?? 0,
      verifications: totalVerify[0]?.value ?? 0,
    },
    sharesByChannel: sharesByCh,
    recentShares: sharesTimeline,
    recentVerifications: verifyTimeline,
  });
}
