// UniverCert · GET /api/v1/audit/export?from=&to=&format=csv|json (S42)
// Exporta audit log do workspace pra compliance/SOC 2 prep.

import { eq, and, gte, lte, desc } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { auditLogs, users } from '@/db/schema';
import { requireRole, RbacError } from '@/lib/rbac';
import { hasFeature } from '@/lib/plan-limits';

export const runtime = 'edge';

const MAX_ROWS = 10000;

export async function GET(req: Request) {
  let sess;
  try { sess = await requireRole('admin'); }
  catch (e) {
    if (e instanceof RbacError) return Response.json({ ok: false, error: e.code }, { status: 401 });
    throw e;
  }

  if (!(await hasFeature(sess.workspace.id, 'auditExport'))) {
    return Response.json({
      ok: false,
      error: 'feature_not_in_plan',
      message: 'Audit export disponivel a partir do plano Pro. Upgrade em /billing.',
      upgradeUrl: '/billing',
    }, { status: 402 });
  }

  const url = new URL(req.url);
  const fromParam = url.searchParams.get('from');                  // YYYY-MM-DD
  const toParam = url.searchParams.get('to');                      // YYYY-MM-DD
  const format = (url.searchParams.get('format') ?? 'json').toLowerCase();

  // Default range: last 90 days
  const now = Math.floor(Date.now() / 1000);
  const fromTs = fromParam ? Math.floor(new Date(fromParam + 'T00:00:00Z').getTime() / 1000) : now - 90 * 86400;
  const toTs = toParam ? Math.floor(new Date(toParam + 'T23:59:59Z').getTime() / 1000) : now;

  if (isNaN(fromTs) || isNaN(toTs)) {
    return Response.json({ ok: false, error: 'datas invalidas (use YYYY-MM-DD)' }, { status: 400 });
  }

  const db = getDb();
  const rows = await db.select({
    id: auditLogs.id,
    action: auditLogs.action,
    entityType: auditLogs.entityType,
    entityId: auditLogs.entityId,
    userId: auditLogs.userId,
    userEmail: users.email,
    userName: users.name,
    ip: auditLogs.ip,
    metadataJson: auditLogs.metadataJson,
    createdAt: auditLogs.createdAt,
  })
    .from(auditLogs)
    .leftJoin(users, eq(users.id, auditLogs.userId))
    .where(and(
      eq(auditLogs.workspaceId, sess.workspace.id),
      gte(auditLogs.createdAt, fromTs),
      lte(auditLogs.createdAt, toTs),
    ))
    .orderBy(desc(auditLogs.createdAt))
    .limit(MAX_ROWS);

  const filenameDate = new Date().toISOString().slice(0, 10);

  if (format === 'csv') {
    const headers = ['id', 'createdAt', 'createdAtISO', 'action', 'entityType', 'entityId', 'userId', 'userEmail', 'userName', 'ip', 'metadata'];
    const csv = [
      headers.join(','),
      ...rows.map((r) => [
        r.id,
        r.createdAt,
        new Date(r.createdAt * 1000).toISOString(),
        r.action,
        r.entityType ?? '',
        r.entityId ?? '',
        r.userId ?? '',
        r.userEmail ?? '',
        r.userName ?? '',
        r.ip ?? '',
        r.metadataJson ?? '',
      ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    return new Response(csv, {
      headers: {
        'content-type': 'text/csv; charset=utf-8',
        'content-disposition': `attachment; filename="audit-${sess.workspace.slug}-${filenameDate}.csv"`,
      },
    });
  }

  // JSON default
  return Response.json({
    ok: true,
    workspace: { id: sess.workspace.id, slug: sess.workspace.slug, name: sess.workspace.name },
    range: { from: new Date(fromTs * 1000).toISOString(), to: new Date(toTs * 1000).toISOString() },
    count: rows.length,
    truncated: rows.length === MAX_ROWS,
    logs: rows.map((r) => ({
      ...r,
      createdAtISO: new Date(r.createdAt * 1000).toISOString(),
      metadata: r.metadataJson ? (() => { try { return JSON.parse(r.metadataJson); } catch { return null; } })() : null,
    })),
  }, {
    headers: {
      'content-disposition': format === 'download' ? `attachment; filename="audit-${sess.workspace.slug}-${filenameDate}.json"` : 'inline',
    },
  });
}
