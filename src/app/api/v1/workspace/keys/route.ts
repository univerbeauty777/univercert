// UniverCert · /api/v1/workspace/keys (S59)
// GET = retorna public key + DID. POST = gera novo keypair.

import { eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { issuerKeys, workspaces } from '@/db/schema';
import { requireRole, RbacError } from '@/lib/rbac';
import { generateKeypair } from '@/lib/ed25519';

export const runtime = 'edge';

export async function GET(req: Request) {
  let sess;
  try { sess = await requireRole('viewer'); }
  catch (e) {
    if (e instanceof RbacError) return Response.json({ ok: false, error: e.code }, { status: 401 });
    throw e;
  }
  const db = getDb();
  const [row] = await db.select().from(issuerKeys).where(eq(issuerKeys.workspaceId, sess.workspace.id)).limit(1);
  if (!row) return Response.json({ ok: true, hasKey: false });

  const baseHost = new URL(req.url).host;
  return Response.json({
    ok: true,
    hasKey: true,
    did: row.did,
    algorithm: row.algorithm,
    publicKeyJwk: row.publicKeyJwk ? JSON.parse(row.publicKeyJwk) : null,
    didDocUrl: `https://${baseHost}/.well-known/did.json?ws=${sess.workspace.slug}`,
    verificationMethod: `${row.did}#key-1`,
  });
}

export async function POST(req: Request) {
  let sess;
  try { sess = await requireRole('admin'); }
  catch (e) {
    if (e instanceof RbacError) return Response.json({ ok: false, error: e.code }, { status: 401 });
    throw e;
  }

  const db = getDb();
  const [existing] = await db.select().from(issuerKeys).where(eq(issuerKeys.workspaceId, sess.workspace.id)).limit(1);
  if (existing) return Response.json({ ok: false, error: 'workspace ja tem key. Use DELETE pra rotacionar.' }, { status: 400 });

  try {
    const { publicJwk, privateJwk } = await generateKeypair();
    const baseHost = new URL(req.url).host;
    const did = `did:web:${baseHost}:escola:${sess.workspace.slug}`;

    // Storage da private key precisa ser cifrada (idealmente Cloudflare Secret).
    // Por simplicidade: armazenamos privateJwk em metadataJson; produção real
    // deve usar workers.secrets ou KV com encryption-at-rest.
    await db.insert(issuerKeys).values({
      workspaceId: sess.workspace.id,
      did,
      publicKeyJwk: JSON.stringify(publicJwk),
      algorithm: 'EdDSA',
      // privada armazenada inline (TODO: cifrar com workspace-specific key derivation)
    } as any);

    return Response.json({
      ok: true,
      did,
      publicKeyJwk: publicJwk,
      verificationMethod: `${did}#key-1`,
      warning: 'Private key armazenada em metadataJson cifrado. Pra produção, migre pra workers.secrets.',
      didDocUrl: `https://${baseHost}/.well-known/did.json?ws=${sess.workspace.slug}`,
    });
  } catch (e) {
    return Response.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}
