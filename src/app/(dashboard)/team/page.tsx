// UniverCert · /team · Sprint 15 RBAC

import { eq, and, isNull } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { workspaceMembers, users, invites, workspaces } from '@/db/schema';
import PageHeader from '@/components/PageHeader';
import StatsBar from '@/components/StatsBar';
import EmptyState from '@/components/EmptyState';
import TeamClient from './TeamClient';
import { ROLE_LABELS } from '@/lib/rbac';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export default async function TeamPage() {
  const db = getDb();
  const workspaceSlug = 'univerhair';
  const [ws] = await db.select().from(workspaces).where(eq(workspaces.slug, workspaceSlug)).limit(1);

  const members = ws
    ? await db
        .select({ member: workspaceMembers, user: users })
        .from(workspaceMembers)
        .leftJoin(users, eq(workspaceMembers.userId, users.id))
        .where(eq(workspaceMembers.workspaceId, ws.id))
    : [];

  const pendingInvites = ws
    ? await db
        .select()
        .from(invites)
        .where(and(eq(invites.workspaceId, ws.id), isNull(invites.acceptedAt), isNull(invites.revokedAt)))
    : [];

  const adminCount = members.filter((m) => m.member.role === 'admin').length;
  const editorCount = members.filter((m) => m.member.role === 'editor').length;
  const aprovadorCount = members.filter((m) => m.member.role === 'aprovador').length;
  const viewerCount = members.filter((m) => m.member.role === 'viewer').length;

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-ink-900 py-8 px-6">
      <div className="max-w-7xl mx-auto">
        <PageHeader
          icon="👥"
          title="Equipe & permissões"
          subtitle={`${members.length} ${members.length === 1 ? 'membro' : 'membros'} · ${pendingInvites.length} ${pendingInvites.length === 1 ? 'convite pendente' : 'convites pendentes'}`}
        />

        <StatsBar
          stats={[
            { label: 'Admins', value: adminCount, icon: '👑', tone: 'primary' },
            { label: 'Editores', value: editorCount, icon: '✏', tone: 'gold' },
            { label: 'Aprovadores', value: aprovadorCount, icon: '✓', tone: 'success' },
            { label: 'Viewers', value: viewerCount, icon: '👁', tone: 'primary' },
          ]}
        />

        <TeamClient
          members={members.map(({ member, user }) => ({
            id: member.id,
            userId: member.userId,
            userName: user?.name ?? null,
            userEmail: user?.email ?? '—',
            role: member.role as any,
            invitedAt: member.invitedAt,
            acceptedAt: member.acceptedAt,
          }))}
          pendingInvites={pendingInvites.map((i) => ({
            id: i.id,
            email: i.email,
            role: i.role as any,
            createdAt: i.createdAt,
            expiresAt: i.expiresAt,
            token: i.token,
          }))}
        />

        {/* Doc roles */}
        <div className="mt-8 card !p-6 bg-gradient-to-br from-primary-soft via-white to-accent/5 dark:from-ink-800 dark:via-ink-800 dark:to-ink-700 border-primary/20 dark:border-ink-600">
          <h3 className="font-bold mb-4 tracking-tight">📚 O que cada role pode fazer</h3>
          <div className="grid md:grid-cols-2 gap-3 text-sm">
            <RoleCard role="admin" emoji="👑" />
            <RoleCard role="editor" emoji="✏" />
            <RoleCard role="aprovador" emoji="✓" />
            <RoleCard role="viewer" emoji="👁" />
          </div>
        </div>
      </div>
    </main>
  );
}

function RoleCard({ role, emoji }: { role: 'admin' | 'editor' | 'aprovador' | 'viewer'; emoji: string }) {
  const desc: Record<string, string> = {
    admin: 'Acesso total: convida usuários, billing, domínio próprio, revoga certs.',
    editor: 'Cria/edita templates, workflows, bulk emit. Não mexe em billing.',
    aprovador: 'Aprova/rejeita requests da fila, emite cert. Não cria templates.',
    viewer: 'Só leitura: dashboard, fila, certificados, alunos. Não edita nada.',
  };
  return (
    <div className="bg-white dark:bg-ink-800 border border-gray-200 dark:border-ink-700 rounded-xl p-3.5">
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-lg">{emoji}</span>
        <span className="font-bold">{ROLE_LABELS[role]}</span>
      </div>
      <p className="text-xs text-ink-500 dark:text-ink-400 leading-relaxed">{desc[role]}</p>
    </div>
  );
}
