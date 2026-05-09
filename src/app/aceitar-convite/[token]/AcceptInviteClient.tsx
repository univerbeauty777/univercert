'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { acceptInviteAction } from '@/app/(dashboard)/team/actions';
import { ROLE_LABELS } from '@/lib/rbac-types';

type Role = 'admin' | 'editor' | 'aprovador' | 'viewer';

const ROLE_EMOJI: Record<Role, string> = { admin: '👑', editor: '✏', aprovador: '✓', viewer: '👁' };

export default function AcceptInviteClient({
  token,
  status,
  email,
  role,
  workspaceName,
  inviterName,
  expiresAt,
}: {
  token: string;
  status: 'valid' | 'accepted' | 'revoked' | 'expired';
  email: string;
  role: Role;
  workspaceName: string;
  inviterName: string;
  expiresAt: number;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleAccept = () => {
    startTransition(async () => {
      const result = await acceptInviteAction(token);
      if (result.ok) {
        window.location.href = '/dashboard';
      } else {
        setError(result.error);
      }
    });
  };

  if (status === 'accepted') {
    return (
      <>
        <div className="text-5xl mb-4">✓</div>
        <h1 className="font-display text-3xl font-semibold tracking-tight mb-2">Convite já foi aceito</h1>
        <p className="text-sm text-ink-500 dark:text-ink-400 mb-6">
          Esse convite já foi usado anteriormente. Se você é o convidado, faça login.
        </p>
        <a href="/sign-in" className="btn-gradient w-full justify-center">Fazer login →</a>
      </>
    );
  }

  if (status === 'revoked') {
    return (
      <>
        <div className="text-5xl mb-4">✗</div>
        <h1 className="font-display text-3xl font-semibold tracking-tight mb-2">Convite revogado</h1>
        <p className="text-sm text-ink-500 dark:text-ink-400 mb-6">
          Este convite foi revogado pelo workspace. Peça pra eles enviarem um novo.
        </p>
        <a href="/" className="btn-secondary w-full justify-center">Voltar ao site</a>
      </>
    );
  }

  if (status === 'expired') {
    return (
      <>
        <div className="text-5xl mb-4">⏰</div>
        <h1 className="font-display text-3xl font-semibold tracking-tight mb-2">Convite expirou</h1>
        <p className="text-sm text-ink-500 dark:text-ink-400 mb-6">
          Esse convite era válido até {new Date(expiresAt * 1000).toLocaleDateString('pt-BR')}. Peça pra workspace enviar um novo.
        </p>
        <a href="/" className="btn-secondary w-full justify-center">Voltar ao site</a>
      </>
    );
  }

  return (
    <>
      <div className="inline-block px-3 py-1 bg-success-soft border border-success/30 rounded-full text-[10px] font-bold text-success uppercase tracking-widest mb-4">
        ✉ Você foi convidado
      </div>
      <h1 className="font-display text-3xl font-semibold tracking-tight mb-2">
        Junte-se a <span className="text-gradient">{workspaceName}</span>
      </h1>
      <p className="text-sm text-ink-500 dark:text-ink-400 mb-6">
        <strong>{inviterName}</strong> te convidou pra fazer parte do workspace UniverCert como <strong>{ROLE_EMOJI[role]} {ROLE_LABELS[role]}</strong>.
      </p>

      <div className="card !p-4 mb-5 bg-primary-soft/50 dark:bg-ink-700/50 border-primary/20">
        <div className="text-[10px] uppercase tracking-widest text-primary dark:text-ink-300 font-bold mb-2">Convite pra</div>
        <div className="font-mono text-sm font-bold mb-3">{email}</div>
        <div className="text-xs text-ink-500 dark:text-ink-400">
          Faça login ou crie conta com esse mesmo email pra aceitar.
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm rounded-xl animate-slide-up">
          ⚠ {error}
        </div>
      )}

      <div className="space-y-3">
        <button onClick={handleAccept} disabled={isPending} className="btn-gradient w-full justify-center">
          {isPending ? 'Aceitando…' : 'Aceitar convite →'}
        </button>
        <a
          href={`/sign-in?next=${encodeURIComponent(`/aceitar-convite/${token}`)}`}
          className="btn-secondary w-full justify-center text-sm"
        >
          Fazer login com {email}
        </a>
        <a
          href={`/sign-up?email=${encodeURIComponent(email)}&next=${encodeURIComponent(`/aceitar-convite/${token}`)}`}
          className="btn-ghost w-full justify-center text-sm"
        >
          Ou criar conta nova
        </a>
      </div>

      <p className="text-[11px] text-ink-500 dark:text-ink-400 mt-6 text-center">
        Convite expira em {new Date(expiresAt * 1000).toLocaleDateString('pt-BR')}
      </p>
    </>
  );
}
