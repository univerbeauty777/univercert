'use server';

import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { getDb } from '@/db/client';
import { templates } from '@/db/schema';
import { ID } from '@/lib/ulid';
import { requireRole, RbacError } from '@/lib/rbac';
import { captureError } from '@/lib/observability';
import type { LayoutV2 } from '@/lib/layout-v2';

export async function duplicateTemplateAction(templateId: string) {
  try {
    const sess = await requireRole('editor');
    const db = getDb();
    const [t] = await db
      .select()
      .from(templates)
      .where(and(eq(templates.id, templateId), eq(templates.workspaceId, sess.workspace.id)))
      .limit(1);
    if (!t) return { ok: false as const, error: 'template nao encontrado' };

    const newId = ID.template();
    await db.insert(templates).values({
      id: newId,
      workspaceId: sess.workspace.id,
      name: `${t.name} (cópia)`,
      vertical: t.vertical,
      layoutJson: t.layoutJson,
      thumbnailUrl: t.thumbnailUrl,
      isPublished: 1,
      createdBy: sess.user.id,
    });
    revalidatePath('/templates');
    return { ok: true as const, templateId: newId };
  } catch (e) {
    if (e instanceof RbacError) return { ok: false as const, error: 'sem permissao (editor+)' };
    return { ok: false as const, error: (e as Error)?.message ?? 'erro' };
  }
}

export async function deleteTemplateAction(templateId: string) {
  try {
    const sess = await requireRole('admin');
    const db = getDb();
    await db
      .delete(templates)
      .where(and(eq(templates.id, templateId), eq(templates.workspaceId, sess.workspace.id)));
    revalidatePath('/templates');
    return { ok: true as const };
  } catch (e) {
    if (e instanceof RbacError) return { ok: false as const, error: 'sem permissao (admin)' };
    return { ok: false as const, error: (e as Error)?.message ?? 'erro' };
  }
}

export async function saveTemplateV2Action(args: {
  templateId?: string;
  name: string;
  layout: LayoutV2;
  vertical?: string;
}) {
  try {
    const sess = await requireRole('editor');
    const db = getDb();

    const layoutJson = JSON.stringify(args.layout);
    if (layoutJson.length > 200_000) {
      return { ok: false as const, error: 'layout muito grande (>200KB)' };
    }

    if (args.templateId) {
      const [existing] = await db
        .select()
        .from(templates)
        .where(and(eq(templates.id, args.templateId), eq(templates.workspaceId, sess.workspace.id)))
        .limit(1);
      if (!existing) return { ok: false as const, error: 'template nao encontrado' };

      await db
        .update(templates)
        .set({
          name: args.name,
          layoutJson,
          vertical: args.vertical ?? existing.vertical,
          updatedAt: Math.floor(Date.now() / 1000),
        })
        .where(eq(templates.id, args.templateId));
      revalidatePath('/templates');
      revalidatePath(`/templates/editor?id=${args.templateId}`);
      return { ok: true as const, templateId: args.templateId };
    }

    const id = ID.template();
    await db.insert(templates).values({
      id,
      workspaceId: sess.workspace.id,
      name: args.name,
      layoutJson,
      vertical: args.vertical ?? 'livre',
      isPublished: 1,
    });
    revalidatePath('/templates');
    return { ok: true as const, templateId: id };
  } catch (e) {
    if (e instanceof RbacError) return { ok: false as const, error: 'sem permissao (editor+)' };
    // Captura no admin/health pra debug
    try {
      await captureError({
        path: '/templates/editor/saveTemplateV2Action',
        method: 'POST',
        error: e as Error,
        metadata: { templateId: args.templateId, name: args.name, layoutFieldCount: args.layout?.fields?.length },
      });
    } catch {}
    // eslint-disable-next-line no-console
    console.error('[saveTemplateV2Action] crash:', (e as Error)?.message, (e as Error)?.stack);
    return { ok: false as const, error: (e as Error)?.message ?? 'erro interno' };
  }
}
