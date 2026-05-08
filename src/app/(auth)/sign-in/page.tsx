'use client';

// UniverCert · sign-in · Sprint 12 (logo navy/gold)

import { useState } from 'react';
import { signIn } from '@/lib/auth-client';
import Logo from '@/components/Logo';

export const runtime = 'edge';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { error } = await signIn.email({ email, password, callbackURL: '/dashboard' });
      if (error) {
        setError(error.message ?? 'Email ou senha incorretos');
        setLoading(false);
      } else {
        window.location.href = '/dashboard';
      }
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    try {
      await signIn.social({ provider: 'google', callbackURL: '/dashboard' });
    } catch {
      setError('Google sign-in não disponível no momento');
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-mesh flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary-soft/40 via-white to-accent/10" />
      <div className="fixed -top-40 -right-40 w-[500px] h-[500px] rounded-full opacity-30 blur-3xl bg-gradient-to-br from-primary to-accent animate-float" />
      <div className="fixed -bottom-40 -left-40 w-[400px] h-[400px] rounded-full opacity-20 blur-3xl bg-gradient-to-br from-violet-500 to-primary animate-float" style={{ animationDelay: '2s' }} />

      <div className="card-glass w-full max-w-md relative animate-scale-in shadow-card-lift p-8">
        <a href="/" className="inline-flex items-center gap-2.5 mb-7 group">
          <Logo size={40} className="group-hover:scale-105 transition-transform drop-shadow-md" />
          <span className="font-extrabold tracking-tight text-base">
            <span className="text-primary">univer</span>
            <span className="text-accent">CERT</span>
          </span>
        </a>

        <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight mb-2">Bem-vindo de volta</h1>
        <p className="text-sm text-ink-500 mb-7">Entre para gerenciar seus certificados</p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl animate-slide-up">⚠ {error}</div>
        )}

        <button onClick={handleGoogle} disabled={loading} className="btn-secondary w-full justify-center mb-4">
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Continuar com Google
        </button>

        <div className="my-5 flex items-center gap-3 text-xs text-ink-500">
          <div className="flex-1 h-px bg-gray-200" />
          ou com email
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label" htmlFor="email">Email</label>
            <input id="email" type="email" className="input" required value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading} autoFocus />
          </div>
          <div>
            <label className="label" htmlFor="password">Senha</label>
            <input id="password" type="password" className="input" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} disabled={loading} />
          </div>
          <button type="submit" disabled={loading} className="btn-gradient w-full justify-center">
            {loading ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Entrando...
              </>
            ) : (<>Entrar →</>)}
          </button>
        </form>

        <p className="text-sm text-center text-ink-500 mt-7">
          Não tem conta?{' '}
          <a href="/sign-up" className="text-primary font-bold hover:underline">Criar grátis</a>
        </p>
      </div>
    </main>
  );
}
