// UniverCert · GET /api/v1/search?q=... (S30)
// Search global multi-entity: alunos, certs, templates, requests, courses

import { eq, and, like, desc, or } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { recipients, credentials, templates, certificateRequests } from '@/db/schema';
import { requireRole, RbacError } from '@/lib/rbac';

export const runtime = 'edge';

export async function GET(req: Request) {
  let sess;
  try {
    sess = await requireRole('viewer');
  } catch (e) {
    if (e instanceof RbacError) return Response.json({ ok: false, error: e.code }, { status: 401 });
    throw e;
  }

  const url = new URL(req.url);
  const q = (url.searchParams.get('q') ?? '').trim();
  if (!q || q.length < 2) {
    return Response.json({ ok: true, q, results: [] });
  }
  const wsId = sess.workspace.id;
  const wild = `%${q}%`;
  const limit = 5;
  const db = getDb();

  // Em paralelo
  const [recs, creds, tmpls, reqs] = await Promise.all([
    db.select({ id: recipients.id, name: recipients.name, email: recipients.email, cpf: recipients.cpf })
      .from(recipients)
      .where(and(eq(recipients.workspaceId, wsId), or(like(recipients.name, wild), like(recipients.email, wild), like(recipients.cpf, wild))))
      .limit(limit),
    db.select({ id: credentials.id, courseName: credentials.courseName, status: credentials.status })
      .from(credentials)
      .where(and(eq(credentials.workspaceId, wsId), or(like(credentials.courseName, wild), like(credentials.id, wild))))
      .orderBy(desc(credentials.issuedAt))
      .limit(limit),
    db.select({ id: templates.id, name: templates.name })
      .from(templates)
      .where(and(eq(templates.workspaceId, wsId), like(templates.name, wild)))
      .limit(limit),
    db.select({ id: certificateRequests.id, courseName: certificateRequests.courseName, status: certificateRequests.status })
      .from(certificateRequests)
      .where(and(eq(certificateRequests.workspaceId, wsId), or(like(certificateRequests.courseName, wild), like(certificateRequests.id, wild))))
      .orderBy(desc(certificateRequests.createdAt))
      .limit(limit),
  ]);

  const results = [
    ...recs.map((r) => ({ kind: 'recipient', id: r.id, label: r.name ?? r.email ?? r.id, sub: r.email ?? r.cpf ?? '', href: `/recipients?q=${encodeURIComponent(r.email ?? r.id)}` })),
    ...creds.map((c) => ({ kind: 'credential', id: c.id, label: c.courseName, sub: `${c.status} · ${c.id.slice(0, 16)}…`, href: `/v/${c.id}` })),
    ...tmpls.map((t) => ({ kind: 'template', id: t.id, label: t.name, sub: 'template', href: `/templates/editor?id=${t.id}` })),
    ...reqs.map((r) => ({ kind: 'request', id: r.id, label: r.courseName, sub: `pedido · ${r.status}`, href: `/queue?id=${r.id}` })),
  ];

  return Response.json({ ok: true, q, results, counts: { recipients: recs.length, credentials: creds.length, templates: tmpls.length, requests: reqs.length } });
}
