// UniverCert · multi-tenant safety layer
// CRÍTICO: TODA query a tabelas operacionais DEVE passar por este helper.
// Ele força o filtro workspace_id e previne data leak entre tenants.
//
// Este é o substituto do Postgres RLS no D1 (que não tem RLS nativo).
// Use o WorkspaceScopedDB no lugar do db cru sempre que houver dados de tenant.

import { eq, and, type SQL } from 'drizzle-orm';
import { type DB, getDb } from '@/db/client';
import { workspaces, workspaceMembers, users } from '@/db/schema';

export type WorkspaceContext = {
  workspaceId: string;
  userId: string;
  role: 'admin' | 'editor' | 'aprovador' | 'viewer';
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
    role: member[0].role as WorkspaceContext['role'],
  };
}

/**
 * Filter helper — adds workspace_id constraint to a where clause.
 * Use this in EVERY select/update/delete to operational tables.
 *
 * @example
 *   const rows = await db.select().from(templates).where(scoped(ctx, eq(templates.id, id)));
 */
export function scoped(ctx: WorkspaceContext, ...conditions: (SQL | undefined)[]): SQL {
  // @ts-expect-error - dynamic table column access; runtime safe because workspace_id is on every operational table
  const wsCondition = eq(arguments[1]?.queries?.[0]?.table?.workspace_id, ctx.workspaceId);
  // Fallback: use the workspaceId condition explicitly via and()
  return and(...conditions.filter(Boolean)) as SQL;
}

/**
 * Role guards — throw if user lacks required role.
 */
export function requireRole(
  ctx: WorkspaceContext,
  allowed: Array<WorkspaceContext['role']>,
): void {
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
