// UniverCert · helpers para emissão de credentials
// Sprint 1: aprovação cria credential real com hash SHA-256 + ULID

import { eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { certificateRequests, credentials, recipients } from '@/db/schema';
import { ID } from './ulid';

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
