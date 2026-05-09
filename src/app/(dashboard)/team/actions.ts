'use server';

// UniverCert · Team management server actions

import { eq, and } from 'drizzle-orm';
import { headers } from 'next/headers';
import { getDb } from '@/db/client';
import { workspaceMembers, users, invites, workspaces, auditLogs } from '@/db/schema';
import { ID } from '@/lib/ulid';
import { requireRole, RbacError } from '@/lib/rbac';

type Role = 'admin' | 'editor' | 'aprovador' | 'viewer';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_ROLES: Role[] = ['admin', 'editor', 'aprovador', 'viewer'];

function getOrigin(): string {
  // Best effort — em prod usa NEXT_PUBLIC_APP_URL ou request origin
  return process.env.NEXT_PUBLIC_APP_URL ?? 'https://univercert.com.br';
}

function rand32(): string {
  const arr = new Uint8Array(24);
  crypto.getRandomValues(arr);
  return Array.from(arr).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function inviteUserAction(
  args: { email: string; role: Role },
): Promise<{ ok: true; acceptUrl: string } | { ok: false; error: string }> {
  if (!EMAIL_RE.test(args.email)) return { ok: false, error: 'Email inválido' };
  if (!VALID_ROLES.includes(args.role)) return { ok: false, error: 'Role inválido' };

  try {
    const sess = await requireRole('admin');
    const db = getDb();

    // Não convida quem já é membro
    const [existingUser] = await db.select().from(users).where(eq(users.email, args.email)).limit(1);
    if (existingUser) {
      const [m] = await db
        .select()
        .from(workspaceMembers)
        .where(and(eq(workspaceMembers.workspaceId, sess.workspace.id), eq(workspaceMembers.userId, existingUser.id)))
        .limit(1);
      if (m) return { ok: false, error: 'Esse email já é membro do workspace' };
    }

    const token = rand32();
    const id = ID.template().replace('tpl_', 'inv_');
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = now + 7 * 24 * 3600; // 7 dias

    await db.insert(invites).values({
      id,
      workspaceId: sess.workspace.id,
      email: args.email,
      role: args.role,
      token,
      invitedByUserId: sess.user.id,
      expiresAt,
    });

    try {
      await db.insert(auditLogs).values({
        id: ID.auditLog(),
        workspaceId: sess.workspace.id,
        userId: sess.user.id,
        action: 'invite.create',
        entityType: 'invite',
        entityId: id,
        metadataJson: JSON.stringify({ email: args.email, role: args.role }),
      });
    } catch {}

    // TODO S15.2: enviar email com link via Resend. Por enquanto retornamos URL.
    const acceptUrl = `${getOrigin()}/aceitar-convite/${token}`;
    return { ok: true, acceptUrl };
  } catch (e) {
    if (e instanceof RbacError) return { ok: false, error: 'Sem permissão (precisa ser Admin)' };
    return { ok: false, error: (e as Error).message };
  }
}

export async function revokeInviteAction(
  inviteId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const sess = await requireRole('admin');
    const db = getDb();
    const [inv] = await db.select().from(invites).where(eq(invites.id, inviteId)).limit(1);
    if (!inv || inv.workspaceId !== sess.workspace.id) return { ok: false, error: 'Convite não encontrado' };
    if (inv.acceptedAt) return { ok: false, error: 'Convite já foi aceito' };

    await db
      .update(invites)
      .set({ revokedAt: Math.floor(Date.now() / 1000) })
      .where(eq(invites.id, inviteId));

    try {
      await db.insert(auditLogs).values({
        id: ID.auditLog(),
        workspaceId: sess.workspace.id,
        userId: sess.user.id,
        action: 'invite.revoke',
        entityType: 'invite',
        entityId: inviteId,
      });
    } catch {}
    return { ok: true };
  } catch (e) {
    if (e instanceof RbacError) return { ok: false, error: 'Sem permissão' };
    return { ok: false, error: (e as Error).message };
  }
}

export async function removeUserAction(
  memberId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const sess = await requireRole('admin');
    const db = getDb();
    const [m] = await db.select().from(workspaceMembers).where(eq(workspaceMembers.id, memberId)).limit(1);
    if (!m || m.workspaceId !== sess.workspace.id) return { ok: false, error: 'Membro não encontrado' };
    if (m.userId === sess.user.id) return { ok: false, error: 'Você não pode se remover. Outro admin precisa fazer isso.' };

    // Não permite remover último admin
    if (m.role === 'admin') {
      const allAdmins = await db
        .select()
        .from(workspaceMembers)
        .where(and(eq(workspaceMembers.workspaceId, sess.workspace.id), eq(workspaceMembers.role, 'admin')));
      if (allAdmins.length <= 1) return { ok: false, error: 'Não pode remover o último admin do workspace' };
    }

    await db.delete(workspaceMembers).where(eq(workspaceMembers.id, memberId));

    try {
      await db.insert(auditLogs).values({
        id: ID.auditLog(),
        workspaceId: sess.workspace.id,
        userId: sess.user.id,
        action: 'member.remove',
        entityType: 'workspace_member',
        entityId: memberId,
      });
    } catch {}
    return { ok: true };
  } catch (e) {
    if (e instanceof RbacError) return { ok: false, error: 'Sem permissão' };
    return { ok: false, error: (e as Error).message };
  }
}

export async function changeRoleAction(
  memberId: string,
  newRole: Role,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!VALID_ROLES.includes(newRole)) return { ok: false, error: 'Role inválido' };
  try {
    const sess = await requireRole('admin');
    const db = getDb();
    const [m] = await db.select().from(workspaceMembers).where(eq(workspaceMembers.id, memberId)).limit(1);
    if (!m || m.workspaceId !== sess.workspace.id) return { ok: false, error: 'Membro não encontrado' };
    if (m.userId === sess.user.id && newRole !== 'admin') {
      // Não rebaixa a si mesmo
      const allAdmins = await db
        .select()
        .from(workspaceMembers)
        .where(and(eq(workspaceMembers.workspaceId, sess.workspace.id), eq(workspaceMembers.role, 'admin')));
      if (allAdmins.length <= 1) return { ok: false, error: 'Não pode rebaixar a si mesmo (último admin).' };
    }

    await db.update(workspaceMembers).set({ role: newRole }).where(eq(workspaceMembers.id, memberId));

    try {
      await db.insert(auditLogs).values({
        id: ID.auditLog(),
        workspaceId: sess.workspace.id,
        userId: sess.user.id,
        action: 'member.role_change',
        entityType: 'workspace_member',
        entityId: memberId,
        metadataJson: JSON.stringify({ from: m.role, to: newRole }),
      });
    } catch {}
    return { ok: true };
  } catch (e) {
    if (e instanceof RbacError) return { ok: false, error: 'Sem permissão' };
    return { ok: false, error: (e as Error).message };
  }
}

export async function acceptInviteAction(
  token: string,
): Promise<{ ok: true; workspaceSlug: string } | { ok: false; error: string }> {
  try {
    const db = getDb();
    const [inv] = await db.select().from(invites).where(eq(invites.token, token)).limit(1);
    if (!inv) return { ok: false, error: 'Convite não encontrado ou inválido' };
    if (inv.acceptedAt) return { ok: false, error: 'Convite já foi aceito anteriormente' };
    if (inv.revokedAt) return { ok: false, error: 'Convite revogado pelo workspace' };
    if (inv.expiresAt < Math.floor(Date.now() / 1000)) return { ok: false, error: 'Convite expirou' };

    // Pega session do user atual (precisa estar logado)
    const h = await headers();
    const { getSession } = await import('@/lib/auth');
    const session = await getSession(h);
    if (!session?.user?.id) return { ok: false, error: 'Faça login ou crie conta primeiro' };

    // Valida que email da invite bate com email do user
    const [user] = await db.select().from(users).where(eq(users.id, session.user.id)).limit(1);
    if (!user) return { ok: false, error: 'Usuário não encontrado' };
    if (user.email.toLowerCase() !== inv.email.toLowerCase()) {
      return { ok: false, error: `Convite é pra ${inv.email} mas você está logado como ${user.email}` };
    }

    // Cria membership (idempotente)
    const [existing] = await db
      .select()
      .from(workspaceMembers)
      .where(and(eq(workspaceMembers.workspaceId, inv.workspaceId), eq(workspaceMembers.userId, user.id)))
      .limit(1);

    const now = Math.floor(Date.now() / 1000);
    if (!existing) {
      await db.insert(workspaceMembers).values({
        id: ID.template().replace('tpl_', 'wsm_'),
        workspaceId: inv.workspaceId,
        userId: user.id,
        role: inv.role,
        acceptedAt: now,
      });
    }

    await db
      .update(invites)
      .set({ acceptedAt: now, acceptedByUserId: user.id })
      .where(eq(invites.id, inv.id));

    try {
      await db.insert(auditLogs).values({
        id: ID.auditLog(),
        workspaceId: inv.workspaceId,
        userId: user.id,
        action: 'invite.accept',
        entityType: 'invite',
        entityId: inv.id,
      });
    } catch {}

    const [ws] = await db.select().from(workspaces).where(eq(workspaces.id, inv.workspaceId)).limit(1);
    return { ok: true, workspaceSlug: ws?.slug ?? 'main' };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
