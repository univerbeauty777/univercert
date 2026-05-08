'use client';

// UniverCert · sign-up · Sprint 11 GODMODE

import { useState } from 'react';
import { signUp } from '@/lib/auth-client';

export const runtime = 'edge';

export default function SignUpPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { error } = await signUp.email({ email, password, name, callbackURL: '/dashboard' });
      if (error) {
        setError(error.message ?? 'Erro ao criar conta');
        setLoading(false);
      } else {
        window.location.href = '/dashboard';
      }
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-mesh flex items-center justify-center px-4 py-10 relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary-soft/40 via-white to-accent/10" />
      <div className="fixed -top-40 -right-40 w-[500px] h-[500px] rounded-full opacity-30 blur-3xl bg-gradient-to-br from-primary to-accent animate-float" />
      <div className="fixed -bottom-40 -left-40 w-[400px] h-[400px] rounded-full opacity-20 blur-3xl bg-gradient-to-br from-violet-500 to-primary animate-float" style={{ animationDelay: '2s' }} />

      <div className="card-glass w-full max-w-md relative animate-scale-in shadow-card-lift p-8">
        <a href="/" className="inline-flex items-center gap-2.5 mb-7 group">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary via-violet-500 to-accent flex items-center justify-center text-white font-bold shadow-glow-primary group-hover:scale-105 transition-transform">🏆</div>
          <span className="font-extrabold tracking-tight text-base">Univer<span className="text-primary">Cert</span></span>
        </a>

        <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight mb-2">Criar conta grátis</h1>
        <p className="text-sm text-ink-500 mb-7">
          50 certificados/mês · sem cartão · 5min pra configurar
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl animate-slide-up">⚠ {error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label" htmlFor="name">Nome</label>
            <input id="name" type="text" className="input" required value={name} onChange={(e) => setName(e.target.value)} disabled={loading} autoFocus />
          </div>
          <div>
            <label className="label" htmlFor="email">Email</label>
            <input id="email" type="email" className="input" required value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading} />
          </div>
          <div>
            <label className="label" htmlFor="password">Senha (mín. 8 caracteres)</label>
            <input id="password" type="password" className="input" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} disabled={loading} />
          </div>
          <button type="submit" disabled={loading} className="btn-gradient w-full justify-center">
            {loading ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Criando...
              </>
            ) : (<>Criar conta grátis →</>)}
          </button>
        </form>

        <div className="flex gap-x-4 gap-y-1 justify-center text-[11px] text-ink-500 mt-6 flex-wrap">
          <span>✓ Sem cartão</span>
          <span>✓ Cancele quando quiser</span>
          <span>✓ LGPD-ready</span>
        </div>

        <p className="text-sm text-center text-ink-500 mt-6">
          Já tem conta?{' '}
          <a href="/sign-in" className="text-primary font-bold hover:underline">Entrar</a>
        </p>
      </div>
    </main>
  );
}
