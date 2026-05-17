'use client';

// UniverCert · forgot-password · Sprint S78

import { useState } from 'react';
import { requestPasswordReset } from '@/lib/auth-client';
import Logo from '@/components/Logo';

export const runtime = 'edge';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { error } = await requestPasswordReset({ email, redirectTo: '/reset-password' });
      if (error) {
        setError(error.message ?? 'Nao foi possivel enviar o email');
        console.error('[forgot-password] error', error);
        setLoading(false);
      } else {
        setSent(true);
        setLoading(false);
      }
    } catch (err) {
      setError(`Erro: ${(err as Error).message}`);
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
            <span className="text-primary">univer</span><span className="text-accent">CERT</span>
          </span>
        </a>
        {sent ? (
          <>
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center mb-5 shadow-lg">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 2L11 13" /><path d="M22 2l-7 20-4-9-9-4 20-7z" />
              </svg>
            </div>
            <h1 className="font-display text-2xl md:text-3xl font-semibold tracking-tight mb-2">Verifique seu email</h1>
            <p className="text-sm text-ink-500 mb-6">
              Se houver uma conta associada a <strong className="text-ink-700">{email}</strong>, enviamos um link para redefinir a senha. O link expira em 1 hora.
            </p>
            <p className="text-xs text-ink-500 mb-6">
              Nao recebeu? Confira a caixa de spam, ou{' '}
              <button onClick={() => { setSent(false); setError(null); }} className="text-primary font-semibold hover:underline">tente outro email</button>.
            </p>
            <a href="/sign-in" className="btn-secondary w-full justify-center">&larr; Voltar ao login</a>
          </>
        ) : (
          <>
            <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight mb-2">Esqueceu a senha?</h1>
            <p className="text-sm text-ink-500 mb-7">Digite seu email e enviamos um link para voce criar uma nova senha.</p>
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl animate-slide-up">! {error}</div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label" htmlFor="email">Email</label>
                <input id="email" type="email" className="input" required value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading} autoFocus placeholder="voce@escola.com" />
              </div>
              <button type="submit" disabled={loading} className="btn-gradient w-full justify-center">
                {loading ? (<><span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Enviando...</>) : (<>Enviar link de recuperacao &rarr;</>)}
              </button>
            </form>
            <p className="text-sm text-center text-ink-500 mt-7">
              Lembrou a senha? <a href="/sign-in" className="text-primary font-bold hover:underline">Entrar</a>
            </p>
          </>
        )}
      </div>
    </main>
  );
}
