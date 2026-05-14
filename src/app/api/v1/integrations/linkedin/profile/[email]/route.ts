// UniverCert · GET /api/v1/integrations/linkedin/profile/[email] (S64)
// Retorna estrutura compativel com LinkedIn 'Education & Certifications' import
// Empresas usam pra sincronizar certs dos colaboradores em massa.

import { eq, and, desc, inArray } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { credentials, recipients, workspaces } from '@/db/schema';

export const runtime = 'edge';

export async function GET(req: Request, ctx: { params: Promise<{ email: string }> }) {
  const { email } = await ctx.params;
  const decoded = decodeURIComponent(email).toLowerCase();
  if (!/^[^@]+@[^@]+\.[^@]+$/.test(decoded)) {
    return Response.json({ error: 'invalid_email' }, { status: 400 });
  }

  const db = getDb();
  const rcps = await db.select().from(recipients).where(eq(recipients.email, decoded)).limit(20);
  if (rcps.length === 0) return Response.json({ ok: true, email: decoded, certifications: [] });

  const rcpIds = rcps.map((r) => r.id);
  const rcpIdSet = new Set(rcpIds);
  const certs = await db.select({
    id: credentials.id, courseName: credentials.courseName, status: credentials.status,
    issuedAt: credentials.issuedAt, courseHours: credentials.courseHours, workspaceId: credentials.workspaceId,
    recipientId: credentials.recipientId,
  }).from(credentials)
    .where(and(eq(credentials.status, 'issued'), inArray(credentials.recipientId, rcpIds)))
    .orderBy(desc(credentials.issuedAt))
    .limit(50);

  const filtered = certs.filter((c) => c.recipientId && rcpIdSet.has(c.recipientId));
  const wsIds = [...new Set(filtered.map((c) => c.workspaceId))];
  const wsRows = wsIds.length > 0
    ? await db.select().from(workspaces).where(inArray(workspaces.id, wsIds))
    : [];
  const wsMap = new Map(wsRows.map((w) => [w.id, w]));
  const baseUrl = new URL(req.url).origin;

  return Response.json({
    ok: true,
    email: decoded,
    name: rcps[0]?.name,
    certifications: filtered.map((c) => {
      const ws = wsMap.get(c.workspaceId);
      const issued = c.issuedAt ? new Date(c.issuedAt * 1000) : null;
      return {
        name: c.courseName,
        authority: ws?.name ?? 'UniverCert',
        url: `${baseUrl}/v/${c.id}`,
        license_number: c.id,
        issue_date: issued ? `${issued.getUTCFullYear()}-${String(issued.getUTCMonth() + 1).padStart(2, '0')}` : null,
        hours: c.courseHours,
      };
    }),
  }, {
    headers: { 'access-control-allow-origin': '*', 'cache-control': 'public, max-age=300' },
  });
}
