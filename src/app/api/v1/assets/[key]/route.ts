// UniverCert · GET /api/v1/assets/[key]
// Proxy publico pra ler assets do R2 (background, logo, signatures, seals).
// Cache 1 dia. Sem auth (asset URL eh "secret enough" via ULID).

import { readAsset } from '@/lib/r2-assets';

export const runtime = 'edge';

export async function GET(
  _request: Request,
  ctx: { params: Promise<{ key: string }> },
) {
  const { key } = await ctx.params;
  const decoded = decodeURIComponent(key);

  // Sanitize: nao permite path traversal nem keys fora do schema esperado
  if (decoded.includes('..') || !decoded.startsWith('workspaces/')) {
    return new Response('Invalid key', { status: 400 });
  }

  const obj = await readAsset(decoded);
  if (!obj) return new Response('Not found', { status: 404 });

  const headers = new Headers();
  headers.set('Content-Type', obj.httpMetadata?.contentType ?? 'application/octet-stream');
  headers.set('Cache-Control', 'public, max-age=86400, immutable');
  headers.set('ETag', `"${obj.etag}"`);

  return new Response(obj.body, { headers });
}
