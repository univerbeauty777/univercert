// UniverCert · Aceitar convite · Sprint 15

import { notFound } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { invites, workspaces, users } from '@/db/schema';
import AcceptInviteClient from './AcceptInviteClient';
import Logo from '@/components/Logo';

export const runtime = 'edge';

type Params = { params: Promise<{ token: string }> };

export const metadata = {
  title: 'Aceitar convite · UniverCert',
};

export default async function AcceptInvitePage({ params }: Params) {
  const { token } = await params;
  if (!token || token.length < 16) notFound();

  const db = getDb();
  const [row] = await db
    .select({ invite: invites, workspace: workspaces, inviter: users })
    .from(invites)
    .leftJoin(workspaces, eq(invites.workspaceId, workspaces.id))
    .leftJoin(users, eq(invites.invitedByUserId, users.id))
    .where(eq(invites.token, token))
    .limit(1);

  if (!row?.invite) notFound();

  const { invite, workspace, inviter } = row;
  const now = Math.floor(Date.now() / 1000);
  const status: 'valid' | 'accepted' | 'revoked' | 'expired' =
    invite.acceptedAt ? 'accepted' :
    invite.revokedAt ? 'revoked' :
    invite.expiresAt < now ? 'expired' :
    'valid';

  return (
    <main className="min-h-screen bg-mesh dark:bg-ink-900 flex items-center justify-center px-4 py-10 relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary-soft/40 via-white to-accent/10 dark:from-ink-800 dark:via-ink-900 dark:to-ink-800" />
      <div className="fixed -top-40 -right-40 w-[500px] h-[500px] rounded-full opacity-25 blur-3xl bg-gradient-to-br from-primary to-accent animate-float" />

      <div className="card-glass w-full max-w-md relative animate-scale-in shadow-card-lift p-8">
        <a href="/" className="inline-flex items-center gap-2.5 mb-7 group">
          <Logo size={40} className="group-hover:scale-105 transition-transform" />
          <span className="font-extrabold tracking-tight text-base">
            <span className="text-primary dark:text-ink-200">univer</span>
            <span className="text-accent">CERT</span>
          </span>
        </a>

        <AcceptInviteClient
          token={token}
          status={status}
          email={invite.email}
          role={invite.role as any}
          workspaceName={workspace?.name ?? 'workspace'}
          inviterName={inviter?.name ?? inviter?.email ?? 'um administrador'}
          expiresAt={invite.expiresAt}
        />
      </div>
    </main>
  );
}
