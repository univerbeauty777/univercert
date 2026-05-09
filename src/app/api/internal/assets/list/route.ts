// UniverCert · GET /api/internal/assets/list?kind=&limit= (S22c)

import { eq, and, desc } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { assets } from '@/db/schema';
import { requireRole, RbacError } from '@/lib/rbac';

export const runtime = 'edge';

export async function GET(request: Request) {
  try {
    const sess = await requireRole('viewer');
    const url = new URL(request.url);
    const kind = url.searchParams.get('kind');
    const limit = Math.min(200, parseInt(url.searchParams.get('limit') ?? '100', 10));

    const db = getDb();
    const where = kind
      ? and(eq(assets.workspaceId, sess.workspace.id), eq(assets.kind, kind))
      : eq(assets.workspaceId, sess.workspace.id);

    const list = await db
      .select()
      .from(assets)
      .where(where)
      .orderBy(desc(assets.createdAt))
      .limit(limit);

    return Response.json({
      ok: true,
      assets: list.map((a) => ({
        id: a.id,
        key: a.r2Key,
        url: `/api/v1/assets/${encodeURIComponent(a.r2Key)}`,
        kind: a.kind,
        contentType: a.contentType,
        size: a.sizeBytes,
        name: a.originalName,
        createdAt: a.createdAt,
      })),
    });
  } catch (e) {
    if (e instanceof RbacError) return Response.json({ ok: false, error: 'sem permissao' }, { status: 403 });
    return Response.json({ ok: false, error: (e as Error)?.message }, { status: 500 });
  }
}
