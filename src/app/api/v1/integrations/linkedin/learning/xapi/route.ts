// UniverCert · GET /api/v1/integrations/linkedin/learning/xapi?credentialId=... (S64)
// Retorna xAPI (Tin Can) statement compatível com LinkedIn Learning Hub,
// Cornerstone, Docebo, TalentLMS, Moodle (LRS), SAP SuccessFactors.
// Spec: https://github.com/adlnet/xAPI-Spec

import { eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { credentials, recipients, workspaces } from '@/db/schema';

export const runtime = 'edge';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const credentialId = url.searchParams.get('credentialId');
  if (!credentialId) return Response.json({ error: 'credentialId obrigatorio' }, { status: 400 });

  const db = getDb();
  const [cred] = await db.select().from(credentials).where(eq(credentials.id, credentialId)).limit(1);
  if (!cred) return Response.json({ error: 'not_found' }, { status: 404 });

  const [rcp] = await db.select().from(recipients).where(eq(recipients.id, cred.recipientId)).limit(1);
  const [ws] = await db.select().from(workspaces).where(eq(workspaces.id, cred.workspaceId)).limit(1);

  const baseUrl = new URL(req.url).origin;
  const issuedISO = new Date((cred.issuedAt ?? Math.floor(Date.now() / 1000)) * 1000).toISOString();

  // xAPI 1.0.3 statement
  const statement = {
    id: cred.id, // mesmo id do cred
    actor: {
      objectType: 'Agent',
      name: rcp?.name ?? 'Aluno',
      mbox: rcp?.email ? `mailto:${rcp.email}` : undefined,
      account: rcp?.email ? undefined : { homePage: baseUrl, name: cred.recipientId },
    },
    verb: {
      id: 'http://adlnet.gov/expapi/verbs/completed',
      display: { 'en-US': 'completed', 'pt-BR': 'concluiu' },
    },
    object: {
      id: `${baseUrl}/v/${cred.id}`,
      objectType: 'Activity',
      definition: {
        name: { 'en-US': cred.courseName, 'pt-BR': cred.courseName },
        description: { 'pt-BR': `Certificado emitido por ${ws?.name ?? 'UniverCert'}` },
        type: 'http://adlnet.gov/expapi/activities/course',
        ...(cred.courseHours ? { extensions: { 'http://id.tincanapi.com/extension/duration-hours': cred.courseHours } } : {}),
      },
    },
    result: {
      completion: true,
      success: cred.status === 'issued',
      duration: cred.courseHours ? `PT${cred.courseHours}H` : undefined,
    },
    timestamp: issuedISO,
    context: {
      platform: 'UniverCert',
      language: 'pt-BR',
      contextActivities: {
        grouping: [{ id: `${baseUrl}/escola/${ws?.slug}`, definition: { name: { 'pt-BR': ws?.name ?? '' } } }],
        category: [{ id: 'https://w3id.org/xapi/cmi5/context/categories/cmi5' }],
      },
      extensions: {
        'https://univercert.com.br/xapi/credential-id': cred.id,
        'https://univercert.com.br/xapi/verify-url': `${baseUrl}/v/${cred.id}`,
        'https://univercert.com.br/xapi/badge-url': `${baseUrl}/api/v1/credentials/${cred.id}/badge`,
      },
    },
    authority: {
      objectType: 'Agent',
      name: ws?.name ?? 'UniverCert Issuer',
      account: { homePage: baseUrl, name: ws?.slug ?? 'unknown' },
    },
  };

  return Response.json(statement, {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'x-experience-api-version': '1.0.3',
      'access-control-allow-origin': '*',
      'cache-control': 'public, max-age=600',
    },
  });
}
