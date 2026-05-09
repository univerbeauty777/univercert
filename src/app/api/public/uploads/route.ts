// UniverCert · POST /api/public/uploads — upload publico (S22)
// Usado pelo form publico /solicitar/[ws]/[courseSlug] pra anexar fotos/videos.
// Sem auth (qualquer um pode subir) MAS:
//   - rate-limit por IP via KV (10/min)
//   - validacao MIME (so imagem/PDF)
//   - 10MB max
//   - tagged com workspace pra cleanup futuro

import { eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { workspaces } from '@/db/schema';
import { uploadAsset } from '@/lib/r2-assets';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

export const runtime = 'edge';

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rl = await rateLimit({ key: `pub_upload:${ip}`, max: 10, windowSec: 60 });
  if (!rl.ok) {
    return Response.json({ ok: false, error: 'rate_limited · aguarde 1min' }, { status: 429 });
  }

  const form = await request.formData();
  const file = form.get('file') as File | null;
  const wsSlug = (form.get('ws') as string | null)?.toLowerCase().trim();

  if (!file || typeof file === 'string') {
    return Response.json({ ok: false, error: 'file ausente' }, { status: 400 });
  }
  if (!wsSlug) {
    return Response.json({ ok: false, error: 'ws ausente' }, { status: 400 });
  }
  if (file.size > 10 * 1024 * 1024) {
    return Response.json({ ok: false, error: 'maximo 10MB' }, { status: 413 });
  }

  const db = getDb();
  const [ws] = await db.select().from(workspaces).where(eq(workspaces.slug, wsSlug)).limit(1);
  if (!ws) return Response.json({ ok: false, error: 'workspace nao encontrado' }, { status: 404 });

  const arrayBuffer = await file.arrayBuffer();
  const result = await uploadAsset({
    workspaceId: ws.id,
    kind: 'misc',
    contentType: file.type || 'application/octet-stream',
    data: arrayBuffer,
    filename: file.name,
    size: arrayBuffer.byteLength,
  });

  if (!result.ok) {
    return Response.json({ ok: false, error: result.error }, { status: 400 });
  }
  return Response.json({ ok: true, key: result.key, url: result.url });
}
