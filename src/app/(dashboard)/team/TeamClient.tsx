'use client';

// UniverCert · Team management client (Sprint 15)

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ROLE_LABELS } from '@/lib/rbac-types';
import { inviteUserAction, revokeInviteAction, removeUserAction, changeRoleAction } from './actions';
import EmptyState from '@/components/EmptyState';

type Role = 'admin' | 'editor' | 'aprovador' | 'viewer';

type Member = {
  id: string;
  userId: string;
  userName: string | null;
  userEmail: string;
  role: Role;
  invitedAt: number;
  acceptedAt: number | null;
};

type Invite = {
  id: string;
  email: string;
  role: Role;
  createdAt: number;
  expiresAt: number;
  token: string;
};

const ROLE_COLORS: Record<Role, string> = {
  admin: 'badge-primary',
  editor: 'badge-warning',
  aprovador: 'badge-success',
  viewer: 'badge bg-gray-100 dark:bg-ink-700 text-ink-700 dark:text-ink-300',
};

export default function TeamClient({ members, pendingInvites }: { members: Member[]; pendingInvites: Invite[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string; link?: string } | null>(null);

  // Modal invite
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<Role>('aprovador');

  const submitInvite = () => {
    if (!inviteEmail.trim() || !/^.+@.+\..+$/.test(inviteEmail)) {
      setFeedback({ ok: false, msg: 'Email inválido' });
      return;
    }
    startTransition(async () => {
      const result = await inviteUserAction({ email: inviteEmail.trim().toLowerCase(), role: inviteRole });
      if (result.ok) {
        setFeedback({
          ok: true,
          msg: `Convite criado pra ${inviteEmail}. Compartilhe o link com a pessoa.`,
          link: result.acceptUrl,
        });
        setInviteEmail('');
        setShowInvite(false);
        router.refresh();
      } else {
        setFeedback({ ok: false, msg: result.error });
      }
    });
  };

  const revokeInvite = (id: string) => {
    if (!confirm('Revogar este convite? Ele não poderá ser usado.')) return;
    startTransition(async () => {
      const result = await revokeInviteAction(id);
      if (result.ok) {
        setFeedback({ ok: true, msg: 'Convite revogado.' });
        router.refresh();
      } else {
        setFeedback({ ok: false, msg: result.error });
      }
    });
  };

  const removeMember = (id: string, name: string) => {
    if (!confirm(`Remover ${name} do workspace? Histórico de aprovações dele fica preservado.`)) return;
    startTransition(async () => {
      const result = await removeUserAction(id);
      if (result.ok) {
        setFeedback({ ok: true, msg: 'Membro removido.' });
        router.refresh();
      } else {
        setFeedback({ ok: false, msg: result.error });
      }
    });
  };

  const changeRole = (id: string, role: Role) => {
    startTransition(async () => {
      const result = await changeRoleAction(id, role);
      if (result.ok) {
        setFeedback({ ok: true, msg: `Role alterada para ${ROLE_LABELS[role]}.` });
        router.refresh();
      } else {
        setFeedback({ ok: false, msg: result.error });
      }
    });
  };

  const copyLink = (link: string) => {
    navigator.clipboard.writeText(link).catch(() => {});
    setFeedback({ ok: true, msg: '✓ Link copiado!' });
  };

  return (
    <div className="space-y-6">
      {feedback && (
        <div className={`p-3 rounded-xl text-sm font-medium animate-slide-up flex items-start gap-3 ${
          feedback.ok ? 'bg-success/10 text-success border border-success/20' : 'bg-danger/10 text-danger border border-danger/20'
        }`}>
          <span className="font-bold">{feedback.ok ? '✓' : '✗'}</span>
          <div className="flex-1">
            <div>{feedback.msg}</div>
            {feedback.link && (
              <div className="mt-2 flex items-center gap-2">
                <code className="font-mono text-xs bg-white dark:bg-ink-900 px-2 py-1 rounded border border-success/30 break-all">
                  {feedback.link}
                </code>
                <button onClick={() => copyLink(feedback.link!)} className="text-xs underline shrink-0">Copiar</button>
              </div>
            )}
          </div>
          <button onClick={() => setFeedback(null)} className="text-ink-500 hover:text-ink-900 dark:hover:text-ink-100">✕</button>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="font-display text-2xl font-semibold tracking-tight">Membros</h2>
        <button onClick={() => setShowInvite(true)} className="btn-gradient text-sm">
          + Convidar
        </button>
      </div>

      {/* Modal invite */}
      {showInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur p-4 animate-fade-in" onClick={() => setShowInvite(false)}>
          <div className="card max-w-md w-full p-6 animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display text-2xl font-semibold tracking-tight mb-1">Convidar pra equipe</h3>
            <p className="text-sm text-ink-500 dark:text-ink-400 mb-5">Vou gerar um link único pra você compartilhar com a pessoa. Ela aceita criando conta ou fazendo login.</p>

            <div className="space-y-4">
              <div>
                <label className="label">Email</label>
                <input type="email" autoFocus value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} className="input" placeholder="colega@suaescola.com.br" onKeyDown={(e) => e.key === 'Enter' && submitInvite()} />
              </div>
              <div>
                <label className="label">Role</label>
                <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value as Role)} className="input text-sm">
                  <option value="admin">👑 Admin · acesso total</option>
                  <option value="editor">✏ Editor · cria templates e workflows</option>
                  <option value="aprovador">✓ Aprovador · aprova fila</option>
                  <option value="viewer">👁 Viewer · só leitura</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex gap-2 justify-end">
              <button onClick={() => setShowInvite(false)} className="btn-ghost text-sm">Cancelar</button>
              <button onClick={submitInvite} disabled={isPending} className="btn-primary text-sm">
                {isPending ? 'Gerando…' : 'Gerar link'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Members list */}
      {members.length === 0 ? (
        <EmptyState icon="👥" title="Sem membros ainda" description="Você é o primeiro. Convide colegas pra dividir trabalho." />
      ) : (
        <div className="card !p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50/50 dark:bg-ink-800 text-[10px] uppercase tracking-widest text-ink-500 font-bold">
              <tr>
                <th className="px-4 py-3 text-left">Membro</th>
                <th className="px-4 py-3 text-left">Role</th>
                <th className="px-4 py-3 text-left">Entrou em</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id} className="border-t border-gray-100 dark:border-ink-700 hover:bg-primary-soft/40 dark:hover:bg-ink-700/40 transition">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-xs">
                        {(m.userName ?? m.userEmail).slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold">{m.userName ?? '—'}</div>
                        <div className="text-xs text-ink-500">{m.userEmail}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={m.role}
                      onChange={(e) => changeRole(m.id, e.target.value as Role)}
                      disabled={isPending}
                      className={`text-xs font-bold px-2 py-1 rounded-lg uppercase tracking-wider bg-transparent ${ROLE_COLORS[m.role]}`}
                    >
                      <option value="admin">👑 Admin</option>
                      <option value="editor">✏ Editor</option>
                      <option value="aprovador">✓ Aprovador</option>
                      <option value="viewer">👁 Viewer</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-xs text-ink-500">
                    {m.acceptedAt
                      ? new Date(m.acceptedAt * 1000).toLocaleDateString('pt-BR')
                      : <span className="italic">Pendente</span>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => removeMember(m.id, m.userName ?? m.userEmail)}
                      disabled={isPending}
                      className="text-xs text-ink-500 hover:text-danger px-3 py-1.5 rounded-lg hover:bg-danger-soft transition font-medium"
                    >
                      Remover
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pending invites */}
      {pendingInvites.length > 0 && (
        <>
          <h2 className="font-display text-xl font-semibold tracking-tight mt-7">Convites pendentes</h2>
          <div className="card !p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50/50 dark:bg-ink-800 text-[10px] uppercase tracking-widest text-ink-500 font-bold">
                <tr>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-left">Role</th>
                  <th className="px-4 py-3 text-left">Expira em</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {pendingInvites.map((i) => {
                  const url = typeof window !== 'undefined' ? `${window.location.origin}/aceitar-convite/${i.token}` : `/aceitar-convite/${i.token}`;
                  return (
                    <tr key={i.id} className="border-t border-gray-100 dark:border-ink-700">
                      <td className="px-4 py-3 font-bold">{i.email}</td>
                      <td className="px-4 py-3"><span className={ROLE_COLORS[i.role]}>{ROLE_LABELS[i.role]}</span></td>
                      <td className="px-4 py-3 text-xs text-ink-500">{new Date(i.expiresAt * 1000).toLocaleDateString('pt-BR')}</td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => copyLink(url)} className="text-xs text-primary hover:underline mr-3">📋 Copiar link</button>
                        <button
                          onClick={() => revokeInvite(i.id)}
                          disabled={isPending}
                          className="text-xs text-ink-500 hover:text-danger px-3 py-1.5 rounded-lg hover:bg-danger-soft transition font-medium"
                        >
                          Revogar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
