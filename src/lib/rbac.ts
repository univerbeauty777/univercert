// UniverCert · RBAC helpers (Sprint 15 / S23) — server-only (usa next/headers)
// Constantes & tipos client-safe vão em ./rbac-types.ts

import { headers } from 'next/headers';
import { eq, and, desc } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { workspaceMembers, workspaces, users } from '@/db/schema';
import { getSession } from '@/lib/auth';
import { ROLE_LEVEL, hasPermission, type Role } from '@/lib/rbac-types';
import { getCurrentWorkspaceCookie } from '@/lib/current-workspace';

// Re-exports pra compat (server code segue importando de @/lib/rbac)
export { ROLE_LABELS, ROLE_DESCRIPTIONS, hasPermission, type Role } from '@/lib/rbac-types';

export type CurrentSession = {
  user: { id: string; email: string; name: string | null };
  workspace: { id: string; slug: string; name: string };
  member: { role: Role };
};

/**
 * Pega session atual do request + carrega workspace_member do user.
 * Se usuário não tem membership, retorna null.
 * Pra rotas dashboard, deve sempre haver um membership.
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
      .orderBy(desc(workspaceMembers.createdAt));

    const [userRow] = await db
      .select()
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    if (memberships.length === 0) {
      // Fallback: legacy single-tenant (univerhair) — assume admin
      const [fallbackWs] = await db
        .select()
        .from(workspaces)
        .where(eq(workspaces.slug, 'univerhair'))
        .limit(1);
      if (!fallbackWs) return null;
      return {
        user: {
          id: userRow?.id ?? session.user.id,
          email: userRow?.email ?? session.user.email ?? '',
          name: userRow?.name ?? null,
        },
        workspace: { id: fallbackWs.id, slug: fallbackWs.slug, name: fallbackWs.name },
        member: { role: 'admin' },
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
      .orderBy(desc(workspaceMembers.createdAt));
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
