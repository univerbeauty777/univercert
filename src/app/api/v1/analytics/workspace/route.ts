// UniverCert · GET /api/v1/analytics/workspace?range=7d|30d|90d (S32)
// Dashboard agregado: shares por canal, verifications, top certs, funnel conversion

import { eq, and, gte, count, desc, sql } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { credentials, shareEvents, verifyLogs, certificateRequests } from '@/db/schema';
import { requireRole, RbacError } from '@/lib/rbac';

export const runtime = 'edge';

const RANGES: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90, '365d': 365 };

export async function GET(req: Request) {
  let sess;
  try {
    sess = await requireRole('viewer');
  } catch (e) {
    if (e instanceof RbacError) return Response.json({ ok: false, error: e.code }, { status: 401 });
    throw e;
  }
  const wsId = sess.workspace.id;
  const url = new URL(req.url);
  const range = url.searchParams.get('range') ?? '30d';
  const days = RANGES[range] ?? 30;
  const sinceTs = Math.floor(Date.now() / 1000) - days * 86400;
  const db = getDb();

  // Em paralelo
  const [
    sharesByChannel,
    sharesTotal,
    verifyCount,
    issuedInRange,
    pendingReqs,
    topShared,
  ] = await Promise.all([
    db.select({
      channel: shareEvents.channel,
      total: count(),
    }).from(shareEvents)
      .where(and(eq(shareEvents.workspaceId, wsId), gte(shareEvents.occurredAt, sinceTs)))
      .groupBy(shareEvents.channel),

    db.select({ value: count() }).from(shareEvents)
      .where(and(eq(shareEvents.workspaceId, wsId), gte(shareEvents.occurredAt, sinceTs))),

    db.select({ value: count() }).from(verifyLogs)
      .where(and(eq(verifyLogs.workspaceId, wsId), gte(verifyLogs.occurredAt, sinceTs))),

    db.select({ value: count() }).from(credentials)
      .where(and(eq(credentials.workspaceId, wsId), eq(credentials.status, 'issued'), gte(credentials.issuedAt, sinceTs))),

    db.select({ value: count() }).from(certificateRequests)
      .where(and(eq(certificateRequests.workspaceId, wsId), eq(certificateRequests.status, 'pending'))),

    db.select({
      credentialId: shareEvents.credentialId,
      shares: count(),
    }).from(shareEvents)
      .where(and(eq(shareEvents.workspaceId, wsId), gte(shareEvents.occurredAt, sinceTs)))
      .groupBy(shareEvents.credentialId)
      .orderBy(desc(count()))
      .limit(10),
  ]);

  // Busca metadata dos top certs
  const topIds = topShared.map((t) => t.credentialId);
  let topCertsDetails: any[] = [];
  if (topIds.length > 0) {
    const detailsList = await db.select({
      id: credentials.id, courseName: credentials.courseName, issuedAt: credentials.issuedAt,
    }).from(credentials).where(eq(credentials.workspaceId, wsId));
    const map = new Map(detailsList.map((d) => [d.id, d]));
    topCertsDetails = topShared.map((t) => ({
      ...map.get(t.credentialId),
      shares: t.shares,
    })).filter((t) => t.id);
  }

  return Response.json({
    ok: true,
    range,
    days,
    workspace: { id: sess.workspace.id, name: sess.workspace.name, slug: sess.workspace.slug },
    metrics: {
      sharesTotal: sharesTotal[0]?.value ?? 0,
      verifyCount: verifyCount[0]?.value ?? 0,
      issuedInRange: issuedInRange[0]?.value ?? 0,
      pendingReqs: pendingReqs[0]?.value ?? 0,
    },
    sharesByChannel: sharesByChannel.map((s) => ({ channel: s.channel, count: s.total })),
    topCerts: topCertsDetails,
  });
}
