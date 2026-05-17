'use client';

// UniverCert · reset-password · Sprint S78

import { useEffect, useState } from 'react';
import { resetPassword } from '@/lib/auth-client';
import Logo from '@/components/Logo';

export const runtime = 'edge';

export default function ResetPasswordPage() {
  const [token, setToken] = useState<string | null>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get('token');
    const e = params.get('error');
    if (e) {
      setTokenError(e === 'INVALID_TOKEN' || e === 'invalid_token'
        ? 'Este link de recuperacao e invalido ou ja expirou.'
        : 'Nao foi possivel validar o link de recuperacao.');
    } else if (!t) {
      setTokenError('Link de recuperacao incompleto. Solicite um novo email.');
    } else {
      setToken(t);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { setError('As senhas nao coincidem.'); return; }
    if (password.length < 8) { setError('A senha precisa ter pelo menos 8 caracteres.'); return; }
    if (!token) { setError('Token ausente.'); return; }
    setLoading(true); setError(null);
    try {
      const { error } = await resetPassword({ newPassword: password, token });
      if (error) {
        setError(error.message ?? 'Nao foi possivel redefinir a senha');
        setLoading(false);
      } else {
        setDone(true); setLoading(false);
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
        {done ? (
          <>
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center mb-5 shadow-lg">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
            </div>
            <h1 className="font-display text-2xl md:text-3xl font-semibold tracking-tight mb-2">Senha redefinida!</h1>
            <p className="text-sm text-ink-500 mb-6">Sua nova senha ja esta ativa.</p>
            <a href="/sign-in" className="btn-gradient w-full justify-center">Entrar agora &rarr;</a>
          </>
        ) : tokenError ? (
          <>
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center mb-5 shadow-lg">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></svg>
            </div>
            <h1 className="font-display text-2xl md:text-3xl font-semibold tracking-tight mb-2">Link invalido</h1>
            <p className="text-sm text-ink-500 mb-6">{tokenError}</p>
            <a href="/forgot-password" className="btn-gradient w-full justify-center">Solicitar novo link &rarr;</a>
            <p className="text-sm text-center text-ink-500 mt-5"><a href="/sign-in" className="text-primary font-bold hover:underline">Voltar ao login</a></p>
          </>
        ) : (
          <>
            <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight mb-2">Nova senha</h1>
            <p className="text-sm text-ink-500 mb-7">Crie uma senha forte para sua conta UniverCert.</p>
            {error && (<div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl animate-slide-up">! {error}</div>)}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label" htmlFor="password">Nova senha</label>
                <input id="password" type="password" className="input" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} disabled={loading} autoFocus placeholder="Minimo 8 caracteres" />
              </div>
              <div>
                <label className="label" htmlFor="confirm">Confirmar nova senha</label>
                <input id="confirm" type="password" className="input" required minLength={8} value={confirm} onChange={(e) => setConfirm(e.target.value)} disabled={loading} placeholder="Repita a senha" />
              </div>
              <button type="submit" disabled={loading || !token} className="btn-gradient w-full justify-center">
                {loading ? (<><span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Salvando...</>) : (<>Redefinir senha &rarr;</>)}
              </button>
            </form>
            <p className="text-sm text-center text-ink-500 mt-7"><a href="/sign-in" className="text-primary font-bold hover:underline">Voltar ao login</a></p>
          </>
        )}
      </div>
    </main>
  );
}
