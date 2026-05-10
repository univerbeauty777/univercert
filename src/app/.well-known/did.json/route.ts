// UniverCert · /.well-known/did.json?ws=slug (S59)
// W3C DID document — qualquer wallet/verifier consegue resolver did:web e verificar signature.

import { eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { workspaces, issuerKeys } from '@/db/schema';

export const runtime = 'edge';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const wsSlug = url.searchParams.get('ws');
  if (!wsSlug) {
    // DID raiz do UniverCert (sem workspace)
    return Response.json({
      '@context': ['https://www.w3.org/ns/did/v1'],
      id: `did:web:${url.host}`,
      service: [
        { id: '#issuer-resolver', type: 'IssuerResolver', serviceEndpoint: `https://${url.host}/.well-known/did.json` },
      ],
    });
  }

  const db = getDb();
  const [ws] = await db.select().from(workspaces).where(eq(workspaces.slug, wsSlug)).limit(1);
  if (!ws) return Response.json({ error: 'workspace_not_found' }, { status: 404 });

  const [key] = await db.select().from(issuerKeys).where(eq(issuerKeys.workspaceId, ws.id)).limit(1);
  if (!key || !key.publicKeyJwk) return Response.json({ error: 'no_key' }, { status: 404 });

  const did = `did:web:${url.host}:escola:${wsSlug}`;
  let pubJwk: any = null;
  try { pubJwk = JSON.parse(key.publicKeyJwk); } catch {}

  return Response.json({
    '@context': ['https://www.w3.org/ns/did/v1', 'https://w3id.org/security/multikey/v1'],
    id: did,
    verificationMethod: [{
      id: `${did}#key-1`,
      type: 'JsonWebKey',
      controller: did,
      publicKeyJwk: pubJwk,
    }],
    authentication: [`${did}#key-1`],
    assertionMethod: [`${did}#key-1`],
    service: [
      { id: '#issuer-page', type: 'IssuerProfile', serviceEndpoint: `https://${url.host}/escola/${wsSlug}` },
      { id: '#verify-api', type: 'VerificationEndpoint', serviceEndpoint: `https://${url.host}/api/v1/credentials` },
    ],
  }, {
    headers: { 'access-control-allow-origin': '*', 'cache-control': 'public, max-age=300' },
  });
}
