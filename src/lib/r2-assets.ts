// UniverCert · R2 asset upload + URL helpers (S21)
//
// Estrutura de keys no R2:
//   workspaces/{workspaceId}/templates/{templateId}/{kind}-{ulid}.{ext}
//   workspaces/{workspaceId}/uploads/{ulid}.{ext}    (uploads soltos antes de bind a template)
//
// URLs publicas: servidas via /api/v1/assets/[key] (rota proxy, sem expor R2 url direto).

import { getRequestContext } from '@cloudflare/next-on-pages';

const MAX_BYTES = 8 * 1024 * 1024;        // 8MB por arquivo
const ALLOWED_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/svg+xml',
  'image/webp',
  'application/pdf',
]);

export type AssetKind = 'background' | 'logo' | 'signature' | 'seal' | 'misc';

export type UploadResult =
  | { ok: true; key: string; size: number; contentType: string; url: string }
  | { ok: false; error: string };

function getBucket(): R2Bucket {
  const { env } = getRequestContext();
  return (env as any).R2_ASSETS as R2Bucket;
}

function newId(): string {
  return globalThis.crypto.randomUUID().replaceAll('-', '').toUpperCase();
}

function extOf(contentType: string): string {
  switch (contentType) {
    case 'image/png': return 'png';
    case 'image/jpeg': case 'image/jpg': return 'jpg';
    case 'image/svg+xml': return 'svg';
    case 'image/webp': return 'webp';
    case 'application/pdf': return 'pdf';
    default: return 'bin';
  }
}

/**
 * Upload binario pra R2.
 * Valida tamanho + content-type. Retorna a chave permanente + URL proxy.
 */
export async function uploadAsset(args: {
  workspaceId: string;
  templateId?: string;
  kind: AssetKind;
  contentType: string;
  data: ArrayBuffer | ReadableStream;
  filename?: string;
  size?: number;
}): Promise<UploadResult> {
  if (!ALLOWED_TYPES.has(args.contentType)) {
    return { ok: false, error: `tipo nao permitido: ${args.contentType}` };
  }
  if (args.size != null && args.size > MAX_BYTES) {
    return { ok: false, error: `arquivo muito grande (max 8MB)` };
  }
  if (args.data instanceof ArrayBuffer && args.data.byteLength > MAX_BYTES) {
    return { ok: false, error: `arquivo muito grande (max 8MB)` };
  }

  const id = newId();
  const ext = extOf(args.contentType);
  const path = args.templateId
    ? `workspaces/${args.workspaceId}/templates/${args.templateId}/${args.kind}-${id}.${ext}`
    : `workspaces/${args.workspaceId}/uploads/${args.kind}-${id}.${ext}`;

  const bucket = getBucket();
  try {
    const obj = await bucket.put(path, args.data as any, {
      httpMetadata: { contentType: args.contentType },
      customMetadata: {
        kind: args.kind,
        workspaceId: args.workspaceId,
        templateId: args.templateId ?? '',
        originalName: args.filename ?? '',
      },
    });
    if (!obj) return { ok: false, error: 'r2_put_returned_null' };
    return {
      ok: true,
      key: path,
      size: obj.size,
      contentType: args.contentType,
      url: assetUrl(path),
    };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

/** Le um asset (pra rota proxy) */
export async function readAsset(key: string): Promise<R2ObjectBody | null> {
  const bucket = getBucket();
  return bucket.get(key);
}

/** Deleta asset do R2 */
export async function deleteAsset(key: string): Promise<boolean> {
  const bucket = getBucket();
  try {
    await bucket.delete(key);
    return true;
  } catch {
    return false;
  }
}

/** URL publica via rota proxy (cache 1 dia). NAO expoe R2 url direto. */
export function assetUrl(key: string): string {
  return `/api/v1/assets/${encodeURIComponent(key)}`;
}

export function isWorkspaceAsset(key: string, workspaceId: string): boolean {
  return key.startsWith(`workspaces/${workspaceId}/`);
}
