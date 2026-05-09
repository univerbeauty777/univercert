// UniverCert · RBAC helpers (Sprint 15) — server-only (usa next/headers)
// Constantes & tipos client-safe vão em ./rbac-types.ts

import { headers } from 'next/headers';
import { eq, and } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { workspaceMembers, workspaces, users } from '@/db/schema';
import { getSession } from '@/lib/auth';
import { ROLE_LEVEL, hasPermission, type Role } from '@/lib/rbac-types';

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
    const [row] = await db
      .select({
        user: users,
        member: workspaceMembers,
        workspace: workspaces,
      })
      .from(users)
      .leftJoin(workspaceMembers, eq(workspaceMembers.userId, users.id))
      .leftJoin(workspaces, eq(workspaceMembers.workspaceId, workspaces.id))
      .where(eq(users.id, session.user.id))
      .limit(1);

    if (!row?.user || !row.member || !row.workspace) {
      // Fallback: legacy single-tenant (univerhair) — assume admin
      const [fallbackWs] = await db
        .select()
        .from(workspaces)
        .where(eq(workspaces.slug, 'univerhair'))
        .limit(1);
      if (!fallbackWs) return null;
      return {
        user: {
          id: row?.user?.id ?? session.user.id,
          email: row?.user?.email ?? session.user.email ?? '',
          name: row?.user?.name ?? null,
        },
        workspace: { id: fallbackWs.id, slug: fallbackWs.slug, name: fallbackWs.name },
        member: { role: 'admin' },
      };
    }

    return {
      user: { id: row.user.id, email: row.user.email, name: row.user.name },
      workspace: { id: row.workspace.id, slug: row.workspace.slug, name: row.workspace.name },
      member: { role: row.member.role as Role },
    };
  } catch (e) {
    console.error('getCurrentSession failed:', e);
    return null;
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
