// UniverCert · POST /api/v1/credentials/regenerate-missing
// S78c — processa em lote TODOS os certs do workspace com pdfR2Key=null.
// Admin only. Processa sequencial (1 por vez) pra não estourar Browser Rendering quota.

import { eq, and, isNull } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { credentials } from '@/db/schema';
import { getCurrentSession } from '@/lib/rbac';
import { renderAndPersistCertificate } from '@/lib/credentials';

export const runtime = 'edge';

export async function POST() {
  const sess = await getCurrentSession();
  if (!sess) return Response.json({ ok: false, error: 'UNAUTHENTICATED' }, { status: 401 });
  if (sess.member.role !== 'admin') {
    return Response.json({ ok: false, error: 'FORBIDDEN' }, { status: 403 });
  }

  const db = getDb();
  const missing = await db
    .select({ id: credentials.id })
    .from(credentials)
    .where(and(eq(credentials.workspaceId, sess.workspace.id), isNull(credentials.pdfR2Key)))
    .limit(50);

  const results: Array<{ id: string; ok: boolean; error?: string }> = [];
  for (const row of missing) {
    const r = await renderAndPersistCertificate(row.id);
    results.push({ id: row.id, ok: r.ok, error: r.error });
  }

  const ok = results.filter((r) => r.ok).length;
  const failed = results.length - ok;
  return Response.json({ ok: true, processed: results.length, succeeded: ok, failed, results });
}
