// UniverCert · POST /api/v1/credentials/[id]/regenerate-pdf
// S78c — força re-render do PDF de um cert existente (admin/editor only).
// Usado pra reprocessar certs antigos que ficaram sem PDF (pdfR2Key=null).

import { eq, and } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { credentials } from '@/db/schema';
import { getCurrentSession } from '@/lib/rbac';
import { renderAndPersistCertificate } from '@/lib/credentials';

export const runtime = 'edge';

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sess = await getCurrentSession();
  if (!sess) return Response.json({ ok: false, error: 'UNAUTHENTICATED' }, { status: 401 });
  if (!['admin', 'editor'].includes(sess.member.role)) {
    return Response.json({ ok: false, error: 'FORBIDDEN' }, { status: 403 });
  }

  const db = getDb();
  const [cred] = await db
    .select()
    .from(credentials)
    .where(and(eq(credentials.id, id), eq(credentials.workspaceId, sess.workspace.id)))
    .limit(1);
  if (!cred) return Response.json({ ok: false, error: 'NOT_FOUND' }, { status: 404 });

  // Força regen mesmo se já tem pdfR2Key (limpa primeiro)
  if (cred.pdfR2Key) {
    await db.update(credentials).set({ pdfR2Key: null }).where(eq(credentials.id, id));
  }
  const result = await renderAndPersistCertificate(id);
  return Response.json(result, { status: result.ok ? 200 : 500 });
}
