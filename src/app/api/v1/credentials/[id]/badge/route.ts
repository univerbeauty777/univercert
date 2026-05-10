// UniverCert · GET /api/v1/credentials/[id]/badge (S29)
// Exporta cert no formato Open Badges 3.0 (1EdTech standard).
// https://www.imsglobal.org/spec/ob/v3p0
//
// Compatibilidade: LinkedIn Learning, Credly, Accredible, Badgr, Open Badges Network.

import { eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { credentials, recipients, workspaces, workspaceBrand } from '@/db/schema';

export const runtime = 'edge';

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const db = getDb();

  const [cred] = await db.select().from(credentials).where(eq(credentials.id, id)).limit(1);
  if (!cred) return Response.json({ error: 'not_found' }, { status: 404 });

  const [rcp] = await db.select().from(recipients).where(eq(recipients.id, cred.recipientId)).limit(1);
  const [ws] = await db.select().from(workspaces).where(eq(workspaces.id, cred.workspaceId)).limit(1);
  const [brand] = await db.select().from(workspaceBrand).where(eq(workspaceBrand.workspaceId, cred.workspaceId)).limit(1);

  const baseUrl = new URL(_req.url).origin;
  const issuerName = brand?.displayName ?? ws?.name ?? 'UniverCert Issuer';
  const issuerUrl = `${baseUrl}/escola/${ws?.slug ?? 'unknown'}`;
  const issuerId = `${baseUrl}/api/v1/issuers/${ws?.slug ?? 'unknown'}`;
  const credentialUrl = `${baseUrl}/c/${cred.id}`;
  const recipientName = rcp?.name ?? 'Aluno';
  const recipientEmail = rcp?.email ?? null;
  const issuedISO = new Date((cred.issuedAt ?? Math.floor(Date.now() / 1000)) * 1000).toISOString();

  // Open Badges 3.0 / Verifiable Credential com proof opcional (assinatura nao incluida nesse MVP)
  const badge = {
    '@context': [
      'https://www.w3.org/2018/credentials/v1',
      'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
    ],
    id: `${baseUrl}/api/v1/credentials/${cred.id}/badge`,
    type: ['VerifiableCredential', 'OpenBadgeCredential'],
    issuer: {
      id: issuerId,
      type: ['Profile'],
      name: issuerName,
      url: issuerUrl,
      ...(brand?.logoUrl ? { image: { id: brand.logoUrl, type: 'Image' } } : {}),
    },
    name: cred.courseName ?? 'Certificate',
    description: `Certificado de ${cred.courseName} emitido por ${issuerName}`,
    issuanceDate: issuedISO,
    credentialSubject: {
      id: recipientEmail ? `mailto:${recipientEmail}` : `urn:uuid:${cred.recipientId}`,
      type: ['AchievementSubject'],
      name: recipientName,
      ...(recipientEmail ? { email: recipientEmail } : {}),
      achievement: {
        id: `${baseUrl}/api/v1/credentials/${cred.id}/achievement`,
        type: ['Achievement'],
        name: cred.courseName,
        description: `${cred.courseName}${cred.courseHours ? ` (${cred.courseHours}h)` : ''}`,
        criteria: { narrative: `Concluiu ${cred.courseName} pela ${issuerName}` },
        ...(cred.courseHours ? { creditsAvailable: cred.courseHours } : {}),
      },
    },
    credentialStatus: {
      id: `${baseUrl}/api/v1/credentials/${cred.id}/status`,
      type: 'StatusList2021Entry',
      statusListIndex: '0',
      statusListCredential: `${baseUrl}/api/v1/issuers/${ws?.slug ?? 'unknown'}/status`,
    },
  };

  return Response.json(badge, {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'access-control-allow-origin': '*',
      'cache-control': 'public, max-age=300',
    },
  });
}
