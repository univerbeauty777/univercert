// UniverCert · multi-tenant safety layer
// CRÍTICO: TODA query a tabelas operacionais DEVE incluir workspace_id no WHERE.
// Substitui Postgres RLS — D1 não tem RLS nativo, isolamento é no app.

import { eq, and } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { workspaces, workspaceMembers } from '@/db/schema';

export type WorkspaceRole = 'admin' | 'editor' | 'aprovador' | 'viewer';

export type WorkspaceContext = {
  workspaceId: string;
  userId: string;
  role: WorkspaceRole;
};

/**
 * Verify the user belongs to the workspace and return context.
 * Throws if access denied.
 */
export async function requireWorkspaceAccess(
  workspaceId: string,
  userId: string,
): Promise<WorkspaceContext> {
  const db = getDb();
  const member = await db
    .select({ role: workspaceMembers.role })
    .from(workspaceMembers)
    .where(and(eq(workspaceMembers.workspaceId, workspaceId), eq(workspaceMembers.userId, userId)))
    .limit(1);

  if (member.length === 0) {
    throw new Error('FORBIDDEN: user is not a member of this workspace');
  }

  return {
    workspaceId,
    userId,
    role: member[0].role as WorkspaceRole,
  };
}

/**
 * Role guards — throw if user lacks required role.
 */
export function requireRole(ctx: WorkspaceContext, allowed: ReadonlyArray<WorkspaceRole>): void {
  if (!allowed.includes(ctx.role)) {
    throw new Error(`FORBIDDEN: requires one of [${allowed.join(', ')}], got ${ctx.role}`);
  }
}

export const ROLES = {
  admin: ['admin'] as const,
  editor: ['admin', 'editor'] as const,
  aprovador: ['admin', 'editor', 'aprovador'] as const,
  viewer: ['admin', 'editor', 'aprovador', 'viewer'] as const,
};

/**
 * Resolve workspace by slug or custom domain (for white-label).
 */
export async function resolveWorkspace(slugOrDomain: string) {
  const db = getDb();
  const result = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.slug, slugOrDomain))
    .limit(1);

  if (result.length > 0) return result[0];

  const byDomain = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.customDomain, slugOrDomain))
    .limit(1);

  return byDomain[0] ?? null;
}
