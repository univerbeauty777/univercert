'use server';

// UniverCert · save custom template (Sprint 14)

import { eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { templates, workspaces } from '@/db/schema';
import { ID } from '@/lib/ulid';

type Args = {
  name: string;
  layoutJson: string;
  vertical?: string;
};

export async function saveCustomTemplateAction(
  args: Args,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  if (!args.name?.trim()) return { ok: false, error: 'Nome obrigatório' };
  if (args.name.length > 80) return { ok: false, error: 'Nome muito longo (max 80)' };

  // valida JSON
  try {
    const parsed = JSON.parse(args.layoutJson);
    if (typeof parsed !== 'object' || parsed.v !== 1 || !Array.isArray(parsed.elements)) {
      return { ok: false, error: 'Layout inválido' };
    }
    if (parsed.elements.length > 80) {
      return { ok: false, error: 'Máximo de 80 elementos por template' };
    }
  } catch {
    return { ok: false, error: 'JSON do layout inválido' };
  }

  const db = getDb();
  const workspaceSlug = 'univerhair';

  try {
    const [ws] = await db.select().from(workspaces).where(eq(workspaces.slug, workspaceSlug)).limit(1);
    if (!ws) return { ok: false, error: 'Workspace não encontrado' };

    const id = ID.template();
    await db.insert(templates).values({
      id,
      workspaceId: ws.id,
      name: args.name.trim(),
      vertical: args.vertical ?? 'livre',
      layoutJson: args.layoutJson,
      isPublished: 1,
    });

    return { ok: true, id };
  } catch (e) {
    console.error('saveCustomTemplate', e);
    return { ok: false, error: (e as Error).message };
  }
}
