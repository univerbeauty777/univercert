// UniverCert · GET /api/v1/credentials/[id]/vc (S29)
// Exporta cert no formato W3C Verifiable Credential 2.0
// https://www.w3.org/TR/vc-data-model-2.0/

import { eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { credentials, recipients, workspaces } from '@/db/schema';

export const runtime = 'edge';

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const db = getDb();
  const [cred] = await db.select().from(credentials).where(eq(credentials.id, id)).limit(1);
  if (!cred) return Response.json({ error: 'not_found' }, { status: 404 });

  const [rcp] = await db.select().from(recipients).where(eq(recipients.id, cred.recipientId)).limit(1);
  const [ws] = await db.select().from(workspaces).where(eq(workspaces.id, cred.workspaceId)).limit(1);

  const baseUrl = new URL(req.url).origin;
  const issuedISO = new Date((cred.issuedAt ?? Math.floor(Date.now() / 1000)) * 1000).toISOString();
  const issuerDid = `did:web:${new URL(baseUrl).host}:escola:${ws?.slug ?? 'unknown'}`;

  const vc = {
    '@context': [
      'https://www.w3.org/ns/credentials/v2',
      'https://w3id.org/security/data-integrity/v2',
    ],
    id: `${baseUrl}/api/v1/credentials/${cred.id}/vc`,
    type: ['VerifiableCredential', 'EducationalCredential'],
    issuer: { id: issuerDid, name: ws?.name ?? 'UniverCert Issuer' },
    validFrom: issuedISO,
    credentialSubject: {
      id: rcp?.email ? `mailto:${rcp.email}` : `urn:uuid:${cred.recipientId}`,
      type: ['Person', 'EducationalCredentialSubject'],
      name: rcp?.name,
      hasCredential: {
        type: ['EducationalOccupationalCredential'],
        name: cred.courseName,
        ...(cred.courseHours ? { educationalLevel: `${cred.courseHours}h` } : {}),
        recognizedBy: { type: 'Organization', name: ws?.name },
      },
    },
  };

  return Response.json(vc, {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'access-control-allow-origin': '*',
      'cache-control': 'public, max-age=300',
    },
  });
}
