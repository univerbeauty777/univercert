// UniverCert · helpers para emissão de credentials
// Sprint 1: aprovação cria credential real com hash SHA-256 + ULID
// S78c (17/Mai/2026): auto-render do PDF/PNG pra R2 logo após criar credential.
// Resolve "cert sem PDF" + corta custo de Browser Rendering futuro (1 render por cert).

import { eq } from 'drizzle-orm';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { getDb } from '@/db/client';
import { certificateRequests, credentials, recipients, workspaces, brandKits } from '@/db/schema';
import { ID } from './ulid';

/**
 * Renderiza HTML do cert → PDF (Browser Rendering) → salva no R2 → atualiza pdfR2Key.
 * Idempotente: se cert já tem pdfR2Key, não re-renderiza.
 * Best-effort: erros são logados mas NÃO bloqueiam (cert continua válido sem PDF).
 */
export async function renderAndPersistCertificate(credentialId: string): Promise<{ ok: boolean; pdfKey?: string; error?: string }> {
  const db = getDb();
  try {
    const [row] = await db
      .select({ c: credentials, r: recipients, w: workspaces, b: brandKits })
      .from(credentials)
      .leftJoin(recipients, eq(recipients.id, credentials.recipientId))
      .leftJoin(workspaces, eq(workspaces.id, credentials.workspaceId))
      .leftJoin(brandKits, eq(brandKits.workspaceId, credentials.workspaceId))
      .where(eq(credentials.id, credentialId))
      .limit(1);
    if (!row || !row.c) return { ok: false, error: 'CREDENTIAL_NOT_FOUND' };
    if (row.c.pdfR2Key) return { ok: true, pdfKey: row.c.pdfR2Key };

    const { renderCertificateHtml } = await import('./cert-template');
    const { renderPdfFromHtml } = await import('./render-pdf');

    const html = renderCertificateHtml({
      recipientName: row.r?.name || 'Aluno',
      cpf: row.r?.cpf || null,
      courseName: row.c.courseName,
      courseHours: row.c.courseHours ?? null,
      issuedAt: row.c.issuedAt,
      credentialId: row.c.id,
      hashSha256: row.c.hashSha256,
      verifyUrl: `https://univercert.net/v/${row.c.id}`,
      workspaceName: row.w?.name || 'UniverCert',
      primaryColor: row.b?.primaryColor || '#1B2D5E',
      accentColor: row.b?.secondaryColor || '#D4A937',
      variant: 'classic',
    });

    const pdfBytes = await renderPdfFromHtml(html);
    const pdfKey = `workspaces/${row.c.workspaceId}/credentials/${row.c.id}.pdf`;
    const { env } = getRequestContext();
    const bucket = (env as any).R2_ASSETS as R2Bucket;
    await bucket.put(pdfKey, pdfBytes, { httpMetadata: { contentType: 'application/pdf' } });

    await db.update(credentials).set({ pdfR2Key: pdfKey }).where(eq(credentials.id, credentialId));
    return { ok: true, pdfKey };
  } catch (e) {
    console.error('[renderAndPersistCertificate] falhou:', (e as Error)?.message);
    return { ok: false, error: (e as Error)?.message || 'unknown' };
  }
}

/**
 * Calcula hash SHA-256 do conteúdo do certificado (canônico).
 * Roda em edge (Web Crypto API).
 */
export async function computeCertHash(payload: {
  workspaceId: string;
  recipientId: string;
  recipientName: string;
  cpf: string | null;
  courseName: string;
  courseHours: number | null;
  issuedAt: number;
}): Promise<string> {
  const canonical = JSON.stringify({
    w: payload.workspaceId,
    r: payload.recipientId,
    n: payload.recipientName,
    c: payload.cpf,
    course: payload.courseName,
    h: payload.courseHours,
    t: payload.issuedAt,
  });
  const data = new TextEncoder().encode(canonical);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Emite credential a partir de uma request aprovada.
 * Idempotente: se já houver credential pra esse request, retorna a existente.
 */
export async function issueCredentialFromRequest(requestId: string, reviewerId: string | null) {
  const db = getDb();

  const [req] = await db
    .select()
    .from(certificateRequests)
    .where(eq(certificateRequests.id, requestId))
    .limit(1);
  if (!req) throw new Error('REQUEST_NOT_FOUND');
  if (req.status === 'emitted') {
    const [existing] = await db
      .select()
      .from(credentials)
      .where(eq(credentials.requestId, requestId))
      .limit(1);
    if (existing) return { credential: existing, alreadyEmitted: true as const };
  }
  if (!req.recipientId) throw new Error('REQUEST_HAS_NO_RECIPIENT');

  const [recipient] = await db.select().from(recipients).where(eq(recipients.id, req.recipientId)).limit(1);
  if (!recipient) throw new Error('RECIPIENT_NOT_FOUND');

  const issuedAt = Math.floor(Date.now() / 1000);
  const credentialId = ID.credential();

  const hash = await computeCertHash({
    workspaceId: req.workspaceId,
    recipientId: recipient.id,
    recipientName: recipient.name,
    cpf: recipient.cpf,
    courseName: req.courseName ?? '(sem nome)',
    courseHours: req.courseHours,
    issuedAt,
  });

  const [created] = await db
    .insert(credentials)
    .values({
      id: credentialId,
      workspaceId: req.workspaceId,
      requestId: req.id,
      templateId: req.templateId,
      recipientId: recipient.id,
      hashSha256: hash,
      courseName: req.courseName ?? '(sem nome)',
      courseHours: req.courseHours,
      issuedAt,
    })
    .returning();

  await db
    .update(certificateRequests)
    .set({
      status: 'emitted',
      reviewerId,
      reviewedAt: issuedAt,
    })
    .where(eq(certificateRequests.id, req.id));

  // S78c: auto-render do PDF logo após criar (best-effort, não bloqueia)
  void renderAndPersistCertificate(created.id).catch((e) =>
    console.error('[issueCredentialFromRequest] auto-render failed:', e?.message)
  );

  return { credential: created, alreadyEmitted: false as const };
}

/**
 * Rejeita request com motivo.
 */
export async function rejectRequest(requestId: string, reason: string, reviewerId: string | null) {
  const db = getDb();
  const now = Math.floor(Date.now() / 1000);

  const [updated] = await db
    .update(certificateRequests)
    .set({
      status: 'rejected',
      reviewerId,
      reviewedAt: now,
      rejectionReason: reason,
    })
    .where(eq(certificateRequests.id, requestId))
    .returning();

  if (!updated) throw new Error('REQUEST_NOT_FOUND');
  return updated;
}

/**
 * Revoga uma credential já emitida (não deleta — marca como revoked).
 */
export async function revokeCredential(credentialId: string, reason: string) {
  const db = getDb();
  const now = Math.floor(Date.now() / 1000);
  const [updated] = await db
    .update(credentials)
    .set({ revokedAt: now, revokeReason: reason })
    .where(eq(credentials.id, credentialId))
    .returning();
  if (!updated) throw new Error('CREDENTIAL_NOT_FOUND');
  return updated;
}
