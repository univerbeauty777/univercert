'use client';

// UniverCert · sign-up (Sprint 3)

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
      const { error } = await signUp.email({
        email,
        password,
        name,
        callbackURL: '/dashboard',
      });
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
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-soft to-white px-4">
      <div className="card max-w-md w-full">
        <h1 className="text-2xl font-extrabold mb-2">Criar conta</h1>
        <p className="text-sm text-gray-500 mb-6">
          Comece grátis · 50 certificados/mês · sem cartão
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label" htmlFor="name">Nome</label>
            <input
              id="name"
              type="text"
              className="input"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
            />
          </div>
          <div>
            <label className="label" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              className="input"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>
          <div>
            <label className="label" htmlFor="password">Senha (mín. 8 caracteres)</label>
            <input
              id="password"
              type="password"
              className="input"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
            {loading ? 'Criando...' : 'Criar conta'}
          </button>
        </form>

        <p className="text-xs text-center text-gray-500 mt-6">
          Já tem conta?{' '}
          <a href="/sign-in" className="text-primary font-semibold hover:underline">
            Entrar
          </a>
        </p>
      </div>
    </main>
  );
}
