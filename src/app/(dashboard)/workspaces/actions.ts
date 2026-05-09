'use server';

import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { getDb } from '@/db/client';
import { workspaces, workspaceMembers } from '@/db/schema';
import { ID } from '@/lib/ulid';
import { getSession } from '@/lib/auth';
import { setCurrentWorkspaceCookie } from '@/lib/current-workspace';
import { listMyWorkspaces } from '@/lib/rbac';

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

export async function switchWorkspaceAction(workspaceId: string) {
  try {
    const h = await headers();
    const session = await getSession(h);
    if (!session?.user?.id) return { ok: false as const, error: 'nao autenticado' };

    const db = getDb();
    const [m] = await db
      .select()
      .from(workspaceMembers)
      .where(and(eq(workspaceMembers.userId, session.user.id), eq(workspaceMembers.workspaceId, workspaceId)))
      .limit(1);
    if (!m) return { ok: false as const, error: 'voce nao tem acesso a esse workspace' };

    await setCurrentWorkspaceCookie(workspaceId);
    revalidatePath('/', 'layout');
    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: (e as Error)?.message ?? 'erro' };
  }
}

export async function createWorkspaceAction(args: { name: string; slug?: string }) {
  try {
    const h = await headers();
    const session = await getSession(h);
    if (!session?.user?.id) return { ok: false as const, error: 'nao autenticado' };

    if (!args.name?.trim()) return { ok: false as const, error: 'nome obrigatorio' };
    const slug = (args.slug && slugify(args.slug)) || slugify(args.name);
    if (!slug) return { ok: false as const, error: 'slug invalido' };

    const db = getDb();
    const [existing] = await db.select().from(workspaces).where(eq(workspaces.slug, slug)).limit(1);
    if (existing) return { ok: false as const, error: 'slug ja em uso · escolha outro' };

    const wsId = ID.workspace();
    await db.insert(workspaces).values({
      id: wsId,
      slug,
      name: args.name.trim(),
      plan: 'free',
      status: 'active',
    });

    await db.insert(workspaceMembers).values({
      id: ID.workspaceMember(),
      workspaceId: wsId,
      userId: session.user.id,
      role: 'admin',
    });

    await setCurrentWorkspaceCookie(wsId);
    revalidatePath('/', 'layout');
    return { ok: true as const, workspaceId: wsId, slug };
  } catch (e) {
    return { ok: false as const, error: (e as Error)?.message ?? 'erro' };
  }
}

export async function listWorkspacesAction() {
  const list = await listMyWorkspaces();
  return { ok: true as const, workspaces: list };
}
