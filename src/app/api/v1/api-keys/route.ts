// UniverCert · /api/v1/api-keys (S39)
// GET = lista; POST = cria; DELETE handled in [id]/route.ts

import { eq, desc } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { apiKeys } from '@/db/schema';
import { requireRole, RbacError } from '@/lib/rbac';
import { hasFeature } from '@/lib/plan-limits';
import { createApiKey, type ApiKeyScope } from '@/lib/api-key';

export const runtime = 'edge';

export async function GET() {
  let sess;
  try { sess = await requireRole('admin'); }
  catch (e) {
    if (e instanceof RbacError) return Response.json({ ok: false, error: e.code }, { status: 401 });
    throw e;
  }
  const db = getDb();
  const rows = await db.select({
    id: apiKeys.id, name: apiKeys.name, prefix: apiKeys.prefix, scope: apiKeys.scope,
    lastUsedAt: apiKeys.lastUsedAt, requestCount: apiKeys.requestCount,
    expiresAt: apiKeys.expiresAt, revokedAt: apiKeys.revokedAt, createdAt: apiKeys.createdAt,
  }).from(apiKeys).where(eq(apiKeys.workspaceId, sess.workspace.id)).orderBy(desc(apiKeys.createdAt));
  return Response.json({ ok: true, keys: rows });
}

export async function POST(req: Request) {
  let sess;
  try { sess = await requireRole('admin'); }
  catch (e) {
    if (e instanceof RbacError) return Response.json({ ok: false, error: e.code }, { status: 401 });
    throw e;
  }

  if (!(await hasFeature(sess.workspace.id, 'apiKeys'))) {
    return Response.json({
      ok: false,
      error: 'feature_not_in_plan',
      message: 'API keys disponivel a partir do plano Pro. Faca upgrade em /billing.',
      upgradeUrl: '/billing',
    }, { status: 402 });
  }

  const body = await req.json().catch(() => ({})) as {
    name?: string;
    scope?: ApiKeyScope;
    env?: 'live' | 'test';
    expiresInDays?: number;
  };

  if (!body.name?.trim()) return Response.json({ ok: false, error: 'name obrigatorio' }, { status: 400 });
  const scope = (body.scope ?? 'read') as ApiKeyScope;
  if (!['read', 'write', 'admin'].includes(scope)) return Response.json({ ok: false, error: 'scope invalido' }, { status: 400 });

  const expiresAt = body.expiresInDays && body.expiresInDays > 0
    ? Math.floor(Date.now() / 1000) + body.expiresInDays * 86400
    : undefined;

  try {
    const result = await createApiKey({
      workspaceId: sess.workspace.id,
      userId: sess.user.id,
      name: body.name.trim().slice(0, 80),
      scope,
      env: body.env ?? 'live',
      expiresAt,
    });
    return Response.json({
      ok: true,
      id: result.id,
      key: result.key,
      prefix: result.prefix,
      warning: 'Esta chave NAO sera mostrada novamente. Salve em local seguro AGORA.',
    });
  } catch (e) {
    return Response.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}
