// UniverCert · RBAC helpers (Sprint 15 / S23) — server-only (usa next/headers)
// Constantes & tipos client-safe vão em ./rbac-types.ts

import { headers } from 'next/headers';
import { eq, and, desc } from 'drizzle-orm';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { getDb } from '@/db/client';
import { workspaceMembers, workspaces, users } from '@/db/schema';
import { getSession } from '@/lib/auth';
import { ROLE_LEVEL, hasPermission, type Role } from '@/lib/rbac-types';
import { getCurrentWorkspaceCookie } from '@/lib/current-workspace';
import { ID } from '@/lib/ulid';

// Re-exports pra compat (server code segue importando de @/lib/rbac)
export { ROLE_LABELS, ROLE_DESCRIPTIONS, hasPermission, type Role } from '@/lib/rbac-types';

export type CurrentSession = {
  user: { id: string; email: string; name: string | null };
  workspace: { id: string; slug: string; name: string };
  member: { role: Role };
};

function slugifyWs(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'workspace';
}

/** E-mail do dono legado (UniverHair) — religado ao workspace existente em vez de criar um novo. */
function getLegacyOwner(): { email: string; slug: string } {
  let email = 'diegoxp12@me.com';
  let slug = 'univerhair';
  try {
    const { env } = getRequestContext();
    email = ((env as any).LEGACY_OWNER_EMAIL || email).toLowerCase();
    slug = (env as any).LEGACY_WORKSPACE_SLUG || slug;
  } catch {
    /* fora de request context — usa defaults */
  }
  return { email, slug };
}

type DbClient = ReturnType<typeof getDb>;

/**
 * Provisiona um workspace pro usuário que ainda não tem nenhum.
 * Idempotente e race-safe (onConflictDoNothing nas chaves únicas: workspaces.slug
 * e workspace_members(workspace_id,user_id)). Retorna o workspace + role do user.
 */
async function provisionWorkspaceForUser(
  db: DbClient,
  user: { id: string; email: string; name: string | null },
): Promise<{ id: string; slug: string; name: string; role: Role } | null> {
  const now = Math.floor(Date.now() / 1000);
  const legacy = getLegacyOwner();

  // Dono legado → religa ao workspace existente (preserva dados da UniverHair)
  if (user.email && user.email.toLowerCase() === legacy.email) {
    const [legacyWs] = await db.select().from(workspaces).where(eq(workspaces.slug, legacy.slug)).limit(1);
    if (legacyWs) {
      await db
        .insert(workspaceMembers)
        .values({ id: ID.workspaceMember(), workspaceId: legacyWs.id, userId: user.id, role: 'admin', acceptedAt: now })
        .onConflictDoNothing();
      return { id: legacyWs.id, slug: legacyWs.slug, name: legacyWs.name, role: 'admin' };
    }
    // se o workspace legado não existe, cai no fluxo normal (cria pessoal)
  }

  // Workspace pessoal — slug determinístico por usuário evita duplicação em corrida
  const base = slugifyWs(user.name || user.email.split('@')[0] || 'workspace');
  const slug = `${base}-${user.id.slice(-6).toLowerCase()}`;
  const name = user.name?.trim() || (user.email ? `${user.email.split('@')[0]}` : 'Meu workspace');

  await db
    .insert(workspaces)
    .values({ id: ID.workspace(), slug, name, plan: 'free', status: 'active' })
    .onConflictDoNothing();

  const [ws] = await db.select().from(workspaces).where(eq(workspaces.slug, slug)).limit(1);
  if (!ws) return null;

  await db
    .insert(workspaceMembers)
    .values({ id: ID.workspaceMember(), workspaceId: ws.id, userId: user.id, role: 'admin', acceptedAt: now })
    .onConflictDoNothing();

  return { id: ws.id, slug: ws.slug, name: ws.name, role: 'admin' };
}

/**
 * Pega session atual do request + carrega workspace_member do user.
 * Se o usuário não tem membership, provisiona um workspace próprio (admin).
 * Retorna null apenas se não houver sessão autenticada.
 */
export async function getCurrentSession(): Promise<CurrentSession | null> {
  try {
    const h = await headers();
    const session = await getSession(h);
    if (!session?.user?.id) return null;

    const db = getDb();

    // 1. Lista TODOS os memberships do user (pra workspace switcher)
    const memberships = await db
      .select({
        member: workspaceMembers,
        workspace: workspaces,
      })
      .from(workspaceMembers)
      .innerJoin(workspaces, eq(workspaces.id, workspaceMembers.workspaceId))
      .where(eq(workspaceMembers.userId, session.user.id))
      .orderBy(desc(workspaceMembers.invitedAt));

    const [userRow] = await db
      .select()
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    if (memberships.length === 0) {
      // Usuário autenticado sem nenhuma workspace_member.
      // ANTES (bug crítico): fallback silencioso pra workspace 'univerhair' como admin —
      // qualquer signup virava admin do tenant compartilhado. REMOVIDO.
      // AGORA: provisiona um workspace próprio (admin) de forma idempotente e race-safe.
      // Exceção: o e-mail do dono legado é religado ao workspace 'univerhair' existente.
      const email = userRow?.email ?? session.user.email ?? '';
      const provisioned = await provisionWorkspaceForUser(db, {
        id: userRow?.id ?? session.user.id,
        email,
        name: userRow?.name ?? null,
      });
      if (!provisioned) return null;
      return {
        user: { id: userRow?.id ?? session.user.id, email, name: userRow?.name ?? null },
        workspace: { id: provisioned.id, slug: provisioned.slug, name: provisioned.name },
        member: { role: provisioned.role },
      };
    }

    // 2. Resolve current workspace via cookie 'uc_current_ws' ou primeiro membership
    const cookieWsId = await getCurrentWorkspaceCookie();
    let active = memberships.find((m) => m.workspace.id === cookieWsId);
    if (!active) active = memberships[0];

    return {
      user: { id: userRow?.id ?? session.user.id, email: userRow?.email ?? '', name: userRow?.name ?? null },
      workspace: { id: active.workspace.id, slug: active.workspace.slug, name: active.workspace.name },
      member: { role: active.member.role as Role },
    };
  } catch (e) {
    console.error('getCurrentSession failed:', e);
    return null;
  }
}

/** Lista todos workspaces do user atual pra UI do switcher */
export async function listMyWorkspaces(): Promise<Array<{ id: string; slug: string; name: string; role: Role }>> {
  try {
    const h = await headers();
    const session = await getSession(h);
    if (!session?.user?.id) return [];
    const db = getDb();
    const rows = await db
      .select({ ws: workspaces, m: workspaceMembers })
      .from(workspaceMembers)
      .innerJoin(workspaces, eq(workspaces.id, workspaceMembers.workspaceId))
      .where(eq(workspaceMembers.userId, session.user.id))
      .orderBy(desc(workspaceMembers.invitedAt));
    return rows.map((r) => ({ id: r.ws.id, slug: r.ws.slug, name: r.ws.name, role: r.m.role as Role }));
  } catch {
    return [];
  }
}

/**
 * Garante que user atual tem role mínimo necessário.
 * Throws se não autenticado ou sem permissão.
 */
export async function requireRole(minRole: Role): Promise<CurrentSession> {
  const sess = await getCurrentSession();
  if (!sess) throw new RbacError('UNAUTHENTICATED');
  if (!hasPermission(sess.member.role, minRole)) {
    throw new RbacError('FORBIDDEN', `Necessário role ${minRole} (você é ${sess.member.role})`);
  }
  return sess;
}

export class RbacError extends Error {
  constructor(public code: 'UNAUTHENTICATED' | 'FORBIDDEN', message?: string) {
    super(message ?? code);
    this.name = 'RbacError';
  }
}
