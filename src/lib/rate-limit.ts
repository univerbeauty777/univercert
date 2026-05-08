// UniverCert · Rate limit edge-compatible via Cloudflare KV
// Uso:
//   const ok = await rateLimit({ key: `req:${ip}`, max: 10, windowSec: 60 });
//   if (!ok) return new Response('rate limited', { status: 429 });

import { getRequestContext } from '@cloudflare/next-on-pages';

type RateLimitOpts = {
  key: string;
  max: number;
  windowSec: number;
};

type RateLimitResult = {
  ok: boolean;
  remaining: number;
  resetAt: number;
};

export async function rateLimit({ key, max, windowSec }: RateLimitOpts): Promise<RateLimitResult> {
  let kv: KVNamespace | undefined;
  try {
    const env = (getRequestContext().env as unknown) as { KV?: KVNamespace };
    kv = env?.KV;
  } catch {
    // Fora do contexto Cloudflare (build/dev) — bypass
  }

  if (!kv) {
    return { ok: true, remaining: max, resetAt: Date.now() + windowSec * 1000 };
  }

  const now = Math.floor(Date.now() / 1000);
  const fullKey = `rl:${key}:${Math.floor(now / windowSec)}`;

  const current = await kv.get(fullKey);
  const count = current ? parseInt(current, 10) : 0;

  if (count >= max) {
    return {
      ok: false,
      remaining: 0,
      resetAt: (Math.floor(now / windowSec) + 1) * windowSec * 1000,
    };
  }

  await kv.put(fullKey, String(count + 1), {
    expirationTtl: windowSec + 5,
  });

  return {
    ok: true,
    remaining: max - count - 1,
    resetAt: (Math.floor(now / windowSec) + 1) * windowSec * 1000,
  };
}

// Helper para extrair IP do request
export function getClientIp(req: Request): string {
  return (
    req.headers.get('cf-connecting-ip') ??
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  );
}
