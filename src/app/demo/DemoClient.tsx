'use client';

// UniverCert · Demo pública · Typeform-style 2 steps + loading + redirect

import { useState, useRef, useEffect } from 'react';

type Step = 'nome' | 'curso' | 'loading';

export default function DemoClient() {
  const [step, setStep] = useState<Step>('nome');
  const [nome, setNome] = useState('');
  const [curso, setCurso] = useState('');
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, [step]);

  const next = () => setError(null) ?? setStep('curso');
  const submit = async () => {
    if (curso.trim().length < 2) {
      setError('Digite o nome do curso');
      return;
    }
    setStep('loading');
    setError(null);
    try {
      const res = await fetch('/api/v1/demo/issue', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ nome: nome.trim(), curso: curso.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStep('curso');
        setError(data.message ?? 'Erro ao gerar demo. Tente novamente em instantes.');
        return;
      }
      // Redireciona pra página de resultado
      window.location.href = data.demo_result_url;
    } catch {
      setStep('curso');
      setError('Erro de rede. Tente novamente.');
    }
  };

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>, action: () => void) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      action();
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-primary-soft via-white to-accent/10 px-4 relative overflow-hidden">
      <div className="fixed -top-40 -right-40 w-[600px] h-[600px] rounded-full opacity-20 blur-3xl bg-gradient-to-br from-primary to-accent" />
      <div className="fixed -bottom-40 -left-40 w-[500px] h-[500px] rounded-full opacity-15 blur-3xl bg-gradient-to-br from-accent to-primary" />

      <nav className="relative z-10 max-w-5xl mx-auto py-5 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2 hover:opacity-80 transition">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold shadow-md shadow-primary/30">
            🏆
          </div>
          <span className="font-extrabold tracking-tight">
            Univer<span className="text-primary">Cert</span>
          </span>
        </a>
        <a href="/sign-up" className="text-sm text-gray-700 hover:text-primary px-4 py-2 rounded-lg hover:bg-white/50 transition">
          Já quero criar conta →
        </a>
      </nav>

      <div className="relative z-10 max-w-2xl mx-auto pt-12 pb-20">
        {/* Progress bar */}
        <div className="flex gap-1.5 mb-12">
          <ProgressDot active={step === 'nome' || step === 'curso' || step === 'loading'} />
          <ProgressDot active={step === 'curso' || step === 'loading'} />
          <ProgressDot active={step === 'loading'} />
        </div>

        {step === 'nome' && (
          <div className="animate-slide-up">
            <div className="text-xs uppercase tracking-widest text-primary font-bold mb-3">Pergunta 1 de 2</div>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight mb-3">
              Qual nome vai no certificado?
            </h1>
            <p className="text-base text-gray-500 mb-8">
              Vamos emitir um certificado <strong>de verdade</strong> em 30 segundos. Sem cadastro.
            </p>
            <input
              ref={inputRef}
              className="tf-input"
              placeholder="Ex: Maria Aparecida"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              onKeyDown={(e) => handleKey(e, next)}
              maxLength={80}
              autoFocus
            />
            <div className="flex items-center gap-3 mt-8">
              <button
                onClick={next}
                disabled={nome.trim().length < 2}
                className="btn-primary text-base px-7 py-3.5 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              >
                Continuar →
              </button>
              <span className="text-xs text-gray-500">
                ou pressione <kbd className="px-1.5 py-0.5 bg-gray-100 rounded border border-gray-300 text-[10px] font-mono">Enter ↵</kbd>
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-10 max-w-md">
              💡 Use seu nome real ou um nome fictício. Esse certificado é só pra você ver como funciona — não tem CPF nem dados sensíveis.
            </p>
          </div>
        )}

        {step === 'curso' && (
          <div className="animate-slide-up">
            <div className="text-xs uppercase tracking-widest text-primary font-bold mb-3">Pergunta 2 de 2</div>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight mb-3">
              Qual curso você concluiu, <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">{firstName(nome)}</span>?
            </h1>
            <p className="text-base text-gray-500 mb-8">
              Coloca aí o nome de um curso real ou inventado. É só pra ver como fica.
            </p>
            <input
              ref={inputRef}
              className="tf-input"
              placeholder="Ex: Alisamento Profissional · 40h"
              value={curso}
              onChange={(e) => setCurso(e.target.value)}
              onKeyDown={(e) => handleKey(e, submit)}
              maxLength={120}
              autoFocus
            />
            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl animate-slide-up">
                ⚠ {error}
              </div>
            )}
            <div className="flex items-center gap-3 mt-8">
              <button
                onClick={submit}
                disabled={curso.trim().length < 2}
                className="btn-primary text-base px-7 py-3.5 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              >
                Emitir meu certificado de teste →
              </button>
              <span className="text-xs text-gray-500">
                ou <kbd className="px-1.5 py-0.5 bg-gray-100 rounded border border-gray-300 text-[10px] font-mono">Enter ↵</kbd>
              </span>
            </div>
            <button
              onClick={() => setStep('nome')}
              className="text-xs text-gray-500 hover:text-primary mt-6 transition"
            >
              ← Voltar e mudar nome
            </button>
          </div>
        )}

        {step === 'loading' && (
          <div className="animate-fade-in text-center pt-8">
            <div className="relative inline-block mb-8">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-5xl shadow-2xl shadow-primary/40 animate-pulse">
                🏆
              </div>
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary to-accent opacity-30 blur-xl animate-pulse" />
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3">
              Gerando seu certificado...
            </h2>
            <div className="space-y-2 max-w-md mx-auto text-sm text-gray-600 mt-6">
              <LoadingStep delay={0}>Calculando hash SHA-256...</LoadingStep>
              <LoadingStep delay={400}>Gerando ULID único...</LoadingStep>
              <LoadingStep delay={800}>Criando URL de verificação...</LoadingStep>
              <LoadingStep delay={1200}>Renderizando layout...</LoadingStep>
            </div>
          </div>
        )}
      </div>

      <footer className="relative z-10 max-w-2xl mx-auto pb-6 text-center text-xs text-gray-500">
        🇧🇷 UniverCert · Demo limitada a 3 testes/hora por IP. Curtindo? <a href="/sign-up" className="text-primary font-semibold hover:underline">Crie conta grátis</a>.
      </footer>
    </main>
  );
}

function firstName(nome: string): string {
  const trimmed = nome.trim();
  if (!trimmed) return 'aluno(a)';
  return trimmed.split(/\s+/)[0];
}

function ProgressDot({ active }: { active: boolean }) {
  return (
    <div
      className={`h-1 flex-1 rounded-full transition-all duration-500 ${
        active ? 'bg-gradient-to-r from-primary to-accent' : 'bg-gray-200'
      }`}
    />
  );
}

function LoadingStep({ delay, children }: { delay: number; children: React.ReactNode }) {
  return (
    <div
      className="flex items-center justify-center gap-2 opacity-0 animate-fade-in"
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'forwards' }}
    >
      <span className="text-success">✓</span>
      <span>{children}</span>
    </div>
  );
}
