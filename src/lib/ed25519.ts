// UniverCert · Ed25519 signing pra Open Badges 3.0 / W3C VC (S59)
// Cloudflare Workers crypto.subtle suporta Ed25519 nativo via @cloudflare/workers-types.
// https://developers.cloudflare.com/workers/runtime-apis/web-crypto/#supported-algorithms

const ED25519 = { name: 'Ed25519' } as any;

/** Gera novo keypair Ed25519. Retorna em base64 pra storage. */
export async function generateKeypair(): Promise<{ publicJwk: any; privateJwk: any; publicKeyB64: string }> {
  const pair = await crypto.subtle.generateKey(ED25519, true, ['sign', 'verify']) as CryptoKeyPair;
  const publicJwk = await crypto.subtle.exportKey('jwk', pair.publicKey);
  const privateJwk = await crypto.subtle.exportKey('jwk', pair.privateKey);
  // Public key in raw bytes pra DID/multibase
  const rawPub = await crypto.subtle.exportKey('raw', pair.publicKey);
  const publicKeyB64 = b64encode(new Uint8Array(rawPub));
  return { publicJwk, privateJwk, publicKeyB64 };
}

/** Importa private JWK + assina mensagem */
export async function signMessage(privateJwk: any, message: string | Uint8Array): Promise<string> {
  const key = await crypto.subtle.importKey('jwk', privateJwk, ED25519, false, ['sign']);
  const data = typeof message === 'string' ? new TextEncoder().encode(message) : message;
  const sig = await crypto.subtle.sign(ED25519, key, data);
  return b64UrlEncode(new Uint8Array(sig));
}

/** Verifica signature com public JWK */
export async function verifyMessage(publicJwk: any, signatureB64Url: string, message: string | Uint8Array): Promise<boolean> {
  try {
    const key = await crypto.subtle.importKey('jwk', publicJwk, ED25519, false, ['verify']);
    const data = typeof message === 'string' ? new TextEncoder().encode(message) : message;
    const sig = b64UrlDecode(signatureB64Url);
    return await crypto.subtle.verify(ED25519, key, sig, data);
  } catch {
    return false;
  }
}

/** DataIntegrityProof pra Open Badges 3.0 (eddsa-2022 ou eddsa-rdfc-2022) */
export async function buildDataIntegrityProof(args: {
  privateJwk: any;
  verificationMethod: string;  // 'did:web:univercert.net:escola:slug#key-1'
  proofPurpose?: string;
  document: object;
}): Promise<object> {
  const created = new Date().toISOString();
  const proofConfig = {
    type: 'DataIntegrityProof',
    cryptosuite: 'eddsa-rdfc-2022',
    created,
    verificationMethod: args.verificationMethod,
    proofPurpose: args.proofPurpose ?? 'assertionMethod',
  };

  // Canonicaliza documento (JSON sorted keys) — versão simples sem N-Quads
  const docCanon = JSON.stringify(args.document, Object.keys(args.document).sort());
  const proofCanon = JSON.stringify(proofConfig, Object.keys(proofConfig).sort());

  // Hash docHash || proofHash
  const enc = new TextEncoder();
  const docHash = await crypto.subtle.digest('SHA-256', enc.encode(docCanon));
  const proofHash = await crypto.subtle.digest('SHA-256', enc.encode(proofCanon));
  const combined = new Uint8Array(64);
  combined.set(new Uint8Array(proofHash), 0);
  combined.set(new Uint8Array(docHash), 32);

  const sig = await signMessage(args.privateJwk, combined);

  return { ...proofConfig, proofValue: 'z' + sig };  // 'z' prefix = base64url multibase
}

function b64encode(bytes: Uint8Array): string {
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s);
}
function b64UrlEncode(bytes: Uint8Array): string {
  return b64encode(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function b64UrlDecode(s: string): Uint8Array {
  const pad = '='.repeat((4 - (s.length % 4)) % 4);
  const norm = (s + pad).replace(/-/g, '+').replace(/_/g, '/');
  return Uint8Array.from(atob(norm), (c) => c.charCodeAt(0));
}
