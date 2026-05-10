// UniverCert · POST /api/v1/marketplace/submit (S43)
// Editor submete template do workspace pra entrar no marketplace (review manual)

import { eq, and } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { templates, templateMarketplace } from '@/db/schema';
import { ID } from '@/lib/ulid';
import { requireRole, RbacError } from '@/lib/rbac';

export const runtime = 'edge';

export async function POST(req: Request) {
  let sess;
  try { sess = await requireRole('editor'); }
  catch (e) {
    if (e instanceof RbacError) return Response.json({ ok: false, error: e.code }, { status: 401 });
    throw e;
  }

  const body = await req.json().catch(() => ({})) as {
    templateId?: string;
    name?: string;
    description?: string;
    category?: string;
    language?: 'pt' | 'en' | 'es';
    previewUrl?: string;
  };

  if (!body.templateId) return Response.json({ ok: false, error: 'templateId obrigatorio' }, { status: 400 });

  const db = getDb();
  const [tpl] = await db.select().from(templates)
    .where(and(eq(templates.id, body.templateId), eq(templates.workspaceId, sess.workspace.id)))
    .limit(1);
  if (!tpl) return Response.json({ ok: false, error: 'template nao encontrado nesse workspace' }, { status: 404 });

  const id = ID.marketplace();
  await db.insert(templateMarketplace).values({
    id,
    sourceTemplateId: tpl.id,
    sourceWorkspaceId: sess.workspace.id,
    authorUserId: sess.user.id,
    name: body.name?.trim().slice(0, 80) ?? tpl.name,
    description: body.description?.slice(0, 500) ?? null,
    category: body.category ?? 'general',
    language: body.language ?? 'pt',
    layoutJson: tpl.layoutJson,
    previewUrl: body.previewUrl ?? null,
    status: 'pending',
  });

  return Response.json({
    ok: true,
    id,
    message: 'Submetido pra review. Aprovacao manual em até 48h.',
  });
}
