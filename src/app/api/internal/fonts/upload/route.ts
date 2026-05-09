// UniverCert · POST /api/internal/fonts/upload (S22b)
// Sobe TTF/OTF/WOFF/WOFF2 pra R2 e retorna URL pra @font-face.

import { uploadAsset } from '@/lib/r2-assets';
import { requireRole, RbacError } from '@/lib/rbac';

export const runtime = 'edge';

const FONT_MIME = new Set([
  'font/ttf',
  'font/otf',
  'font/woff',
  'font/woff2',
  'application/font-woff',
  'application/font-woff2',
  'application/x-font-ttf',
  'application/x-font-otf',
  'application/octet-stream',  // upload sem mime
]);

const FONT_EXT_RE = /\.(ttf|otf|woff2?|eot)$/i;

export async function POST(request: Request) {
  try {
    const sess = await requireRole('editor');
    const form = await request.formData();
    const file = form.get('file') as File | null;
    const family = ((form.get('family') as string | null) ?? '').trim();
    if (!file) return Response.json({ ok: false, error: 'file ausente' }, { status: 400 });
    if (!family) return Response.json({ ok: false, error: 'family ausente' }, { status: 400 });

    if (!FONT_MIME.has(file.type) && !FONT_EXT_RE.test(file.name)) {
      return Response.json({ ok: false, error: 'tipo nao suportado · use TTF/OTF/WOFF/WOFF2' }, { status: 400 });
    }
    if (file.size > 5 * 1024 * 1024) {
      return Response.json({ ok: false, error: 'fonte muito grande (>5MB)' }, { status: 413 });
    }

    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'woff2';
    const ct = ext === 'woff2' ? 'font/woff2' : ext === 'woff' ? 'font/woff' : ext === 'ttf' ? 'font/ttf' : 'font/otf';

    // Reutiliza uploadAsset mas sobrescreve content type (lib aceita PDF/img — fonts viram 'misc')
    // Strat: upload via r2 binding direto pra evitar restricao MIME do uploadAsset
    const { getRequestContext } = await import('@cloudflare/next-on-pages');
    const { env } = getRequestContext();
    const bucket = (env as any).R2_ASSETS as R2Bucket;
    const id = globalThis.crypto.randomUUID().replaceAll('-', '').toUpperCase();
    const safeName = family.replace(/[^a-zA-Z0-9_-]/g, '');
    const key = `workspaces/${sess.workspace.id}/fonts/${safeName}-${id}.${ext}`;
    const buf = await file.arrayBuffer();
    await bucket.put(key, buf, {
      httpMetadata: { contentType: ct },
      customMetadata: { workspaceId: sess.workspace.id, family, kind: 'font' },
    });

    return Response.json({
      ok: true,
      key,
      url: `/api/v1/assets/${encodeURIComponent(key)}`,
      family,
      ext,
    });
  } catch (e) {
    if (e instanceof RbacError) return Response.json({ ok: false, error: 'sem permissao (editor+)' }, { status: 403 });
    return Response.json({ ok: false, error: (e as Error)?.message ?? 'erro interno' }, { status: 500 });
  }
}
