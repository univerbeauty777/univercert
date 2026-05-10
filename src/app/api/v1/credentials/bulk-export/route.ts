// UniverCert · POST /api/v1/credentials/bulk-export (S32)
// Recebe ids[] -> retorna manifest com URLs PDF + metadata pra client baixar em batch
// (gerar ZIP no edge consumiria muito CPU/memoria; melhor o client streamar com client-side zip)

import { eq, and, inArray } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { credentials, recipients } from '@/db/schema';
import { requireRole, RbacError } from '@/lib/rbac';

export const runtime = 'edge';

const MAX_IDS = 500;

export async function POST(req: Request) {
  let sess;
  try {
    sess = await requireRole('viewer');
  } catch (e) {
    if (e instanceof RbacError) return Response.json({ ok: false, error: e.code }, { status: 401 });
    throw e;
  }

  const body = await req.json().catch(() => ({})) as { ids?: string[]; format?: 'manifest' | 'csv' };
  const ids = (body.ids ?? []).filter((s) => typeof s === 'string').slice(0, MAX_IDS);
  if (ids.length === 0) return Response.json({ ok: false, error: 'ids[] vazio' }, { status: 400 });

  const db = getDb();
  const baseUrl = new URL(req.url).origin;

  const rows = await db
    .select({
      id: credentials.id, courseName: credentials.courseName, status: credentials.status,
      issuedAt: credentials.issuedAt, hashSha256: credentials.hashSha256,
      recipientName: recipients.name, recipientEmail: recipients.email,
    })
    .from(credentials)
    .leftJoin(recipients, eq(recipients.id, credentials.recipientId))
    .where(and(eq(credentials.workspaceId, sess.workspace.id), inArray(credentials.id, ids)));

  const items = rows.map((r) => ({
    id: r.id,
    courseName: r.courseName,
    recipientName: r.recipientName,
    recipientEmail: r.recipientEmail,
    status: r.status,
    issuedAt: r.issuedAt,
    issuedISO: r.issuedAt ? new Date(r.issuedAt * 1000).toISOString() : null,
    hash: r.hashSha256,
    pdfUrl: `${baseUrl}/api/v1/credentials/${r.id}/pdf`,
    verifyUrl: `${baseUrl}/v/${r.id}`,
    badgeUrl: `${baseUrl}/api/v1/credentials/${r.id}/badge`,
    vcUrl: `${baseUrl}/api/v1/credentials/${r.id}/vc`,
    fileName: `cert-${(r.recipientName ?? 'aluno').replace(/[^a-zA-Z0-9]/g, '_')}-${r.id.slice(-8)}.pdf`,
  }));

  if (body.format === 'csv') {
    const headers = ['id', 'courseName', 'recipientName', 'recipientEmail', 'status', 'issuedISO', 'hash', 'verifyUrl'];
    const csv = [
      headers.join(','),
      ...items.map((i) => headers.map((h) => `"${String((i as any)[h] ?? '').replace(/"/g, '""')}"`).join(',')),
    ].join('\n');
    return new Response(csv, {
      headers: {
        'content-type': 'text/csv; charset=utf-8',
        'content-disposition': `attachment; filename="certs-export-${Date.now()}.csv"`,
      },
    });
  }

  return Response.json({
    ok: true,
    count: items.length,
    requested: ids.length,
    notFound: ids.length - items.length,
    items,
    instructions: 'Baixe cada item.pdfUrl em sequencia ou use jszip no client p/ ZIP.',
  });
}
