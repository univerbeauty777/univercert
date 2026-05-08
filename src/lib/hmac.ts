// UniverCert · helpers HMAC SHA-256 para webhooks (entrada e saída)
// Edge-compatible (Web Crypto API)

export async function computeHmacSha256(payload: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(payload));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function verifyHmacSha256(
  payload: string,
  signature: string,
  secret: string,
): Promise<boolean> {
  if (!signature) return false;
  const computed = await computeHmacSha256(payload, secret);
  // strip prefix "sha256=" se existir
  const sig = signature.replace(/^sha256=/, '').toLowerCase();
  return timingSafeEqual(computed, sig);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let res = 0;
  for (let i = 0; i < a.length; i++) {
    res |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return res === 0;
}
