// UniverCert · POST /api/internal/assets/upload
// Upload de imagem/pdf pro R2. Usado pelo template editor V2.
//
// Body: multipart/form-data
//   file: File
//   kind: 'background' | 'logo' | 'signature' | 'seal' | 'misc' (default: misc)
//   templateId?: string  (se nao passar, vai pra workspaces/<wsid>/uploads/)

import { uploadAsset, type AssetKind } from '@/lib/r2-assets';
import { requireRole, RbacError } from '@/lib/rbac';
import { captureAndRespond } from '@/lib/observability';
import { getDb } from '@/db/client';
import { assets } from '@/db/schema';
import { ID } from '@/lib/ulid';

export const runtime = 'edge';

export async function POST(request: Request) {
  try {
    const sess = await requireRole('editor');
    const form = await request.formData();
    const file = form.get('file') as File | null;
    const kind = (form.get('kind') as string | null) ?? 'misc';
    const templateId = (form.get('templateId') as string | null) ?? undefined;

    if (!file || typeof file === 'string') {
      return Response.json({ ok: false, error: 'file ausente' }, { status: 400 });
    }
    const validKinds = ['background', 'logo', 'signature', 'seal', 'misc'];
    if (!validKinds.includes(kind)) {
      return Response.json({ ok: false, error: 'kind invalido' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const result = await uploadAsset({
      workspaceId: sess.workspace.id,
      templateId,
      kind: kind as AssetKind,
      contentType: file.type || 'application/octet-stream',
      data: arrayBuffer,
      filename: file.name,
      size: arrayBuffer.byteLength,
    });

    if (!result.ok) {
      return Response.json({ ok: false, error: result.error }, { status: 400 });
    }

    // Registra no DB pra biblioteca
    try {
      const db = getDb();
      await db.insert(assets).values({
        id: ID.template().replace('tpl_', 'ast_'),
        workspaceId: sess.workspace.id,
        r2Key: result.key,
        kind,
        contentType: result.contentType,
        sizeBytes: result.size,
        originalName: file.name,
        templateId: templateId ?? null,
        uploadedBy: sess.user.id,
      });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('[assets register] failed:', (e as Error).message);
    }

    return Response.json({
      ok: true,
      key: result.key,
      url: result.url,
      size: result.size,
      contentType: result.contentType,
    });
  } catch (e) {
    if (e instanceof RbacError) {
      return Response.json({ ok: false, error: 'sem permissao (editor+)' }, { status: 403 });
    }
    return captureAndRespond(request, e);
  }
}
