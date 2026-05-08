'use client';

import { useState, useRef, useEffect } from 'react';
import Logo from '@/components/Logo';

type Step = 'nome' | 'curso' | 'loading';

export default function DemoClient() {
  const [step, setStep] = useState<Step>('nome');
  const [nome, setNome] = useState('');
  const [curso, setCurso] = useState('');
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, [step]);

  const next = () => {
    setError(null);
    if (nome.trim().length < 2) { setError('Digite pelo menos 2 caracteres'); return; }
    setStep('curso');
  };

  const submit = async () => {
    if (curso.trim().length < 2) { setError('Digite o nome do curso'); return; }
    setStep('loading');
    setError(null);
    try {
      const res = await fetch('/api/v1/demo/issue', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ nome: nome.trim(), curso: curso.trim() }),
      });
      let data: any = null;
      const ct = res.headers.get('content-type') ?? '';
      try { data = ct.includes('application/json') ? await res.json() : { _raw: await res.text() }; } catch { data = {}; }
      if (!res.ok) {
        setStep('curso');
        const reason = data?.message ?? data?.error ?? `HTTP ${res.status}`;
        setError(`Erro: ${reason}`);
        console.error('[demo/issue]', res.status, data);
        return;
      }
      await new Promise((r) => setTimeout(r, 1600));
      window.location.href = data.demo_result_url;
    } catch (e) {
      setStep('curso');
      setError(`Erro de rede: ${(e as Error).message ?? 'desconhecido'}`);
    }
  };

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>, action: () => void) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); action(); }
  };

  return (
    <main className="min-h-screen bg-mesh relative overflow-hidden">
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-primary-soft/40 via-white to-accent/10" />
      <div className="fixed -top-40 -right-40 w-[600px] h-[600px] rounded-full opacity-30 blur-3xl bg-gradient-to-br from-primary to-accent animate-float" />
      <div className="fixed -bottom-40 -left-40 w-[500px] h-[500px] rounded-full opacity-25 blur-3xl bg-gradient-to-br from-violet-500 to-primary animate-float" style={{ animationDelay: '2s' }} />

      <nav className="relative z-10 max-w-5xl mx-auto py-5 px-5 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2.5 group">
          <Logo size={40} className="group-hover:scale-105 transition-transform drop-shadow-md" />
          <span className="font-extrabold tracking-tight text-base">
            <span className="text-primary">univer</span>
            <span className="text-accent">CERT</span>
          </span>
        </a>
        <a href="/sign-up" className="text-xs md:text-sm text-ink-700 hover:text-primary px-4 py-2 rounded-lg hover:bg-white/60 transition font-medium">
          Já quero criar conta →
        </a>
      </nav>

      <div className="relative z-10 max-w-2xl mx-auto px-5 pt-6 md:pt-12 pb-20">
        <div className="flex gap-1.5 mb-10 md:mb-12">
          <ProgressDot active />
          <ProgressDot active={step === 'curso' || step === 'loading'} />
          <ProgressDot active={step === 'loading'} />
        </div>

        {step === 'nome' && (
          <div className="animate-slide-up">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-primary/20 rounded-full text-[10px] font-bold text-primary uppercase tracking-widest mb-5 shadow-card">
              Pergunta 1 de 2
            </div>
            <h1 className="font-display text-4xl md:text-6xl font-semibold tracking-tight leading-[1.05] mb-4 text-balance">
              Qual nome vai no certificado?
            </h1>
            <p className="text-base md:text-lg text-ink-500 mb-8 max-w-md">
              Vamos emitir um certificado <strong className="text-ink-900">de verdade</strong> em 30 segundos. Sem cadastro, sem cartão.
            </p>
            <input ref={inputRef} className="tf-input" placeholder="Ex: Maria Aparecida" value={nome} onChange={(e) => setNome(e.target.value)} onKeyDown={(e) => handleKey(e, next)} maxLength={80} autoFocus />
            {error && <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl animate-slide-up">⚠ {error}</div>}
            <div className="flex items-center gap-3 mt-9 flex-wrap">
              <button onClick={next} disabled={nome.trim().length < 2} className="btn-gradient text-base px-8 py-3.5 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:translate-y-0">
                Continuar →
              </button>
              <span className="text-xs text-ink-500">ou pressione <kbd className="kbd">Enter ↵</kbd></span>
            </div>
            <p className="text-xs text-ink-500 mt-12 max-w-md leading-relaxed">
              💡 Use seu nome real ou um nome fictício. Esse é só pra você ver como funciona.
            </p>
          </div>
        )}

        {step === 'curso' && (
          <div className="animate-slide-up">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-accent/30 rounded-full text-[10px] font-bold text-accent uppercase tracking-widest mb-5 shadow-card">
              Pergunta 2 de 2
            </div>
            <h1 className="font-display text-4xl md:text-6xl font-semibold tracking-tight leading-[1.05] mb-4 text-balance">
              Qual curso você concluiu, <span className="text-gradient">{firstName(nome)}</span>?
            </h1>
            <p className="text-base md:text-lg text-ink-500 mb-8 max-w-md">
              Coloca aí o nome de um curso real ou inventado. É só pra ver como fica.
            </p>
            <input ref={inputRef} className="tf-input" placeholder="Ex: Alisamento Profissional · 40h" value={curso} onChange={(e) => setCurso(e.target.value)} onKeyDown={(e) => handleKey(e, submit)} maxLength={120} autoFocus />
            {error && <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl animate-slide-up">⚠ {error}</div>}
            <div className="flex items-center gap-3 mt-9 flex-wrap">
              <button onClick={submit} disabled={curso.trim().length < 2} className="btn-gradient text-base px-8 py-3.5 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:translate-y-0">
                Emitir meu certificado →
              </button>
              <span className="text-xs text-ink-500">ou <kbd className="kbd">Enter ↵</kbd></span>
            </div>
            <button onClick={() => setStep('nome')} className="text-xs text-ink-500 hover:text-primary mt-7 transition">
              ← Voltar e mudar nome
            </button>
          </div>
        )}

        {step === 'loading' && (
          <div className="animate-fade-in text-center pt-4 md:pt-12">
            <div className="relative inline-block mb-9">
              <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-glow-primary animate-pulse-glow p-3">
                <Logo size={88} className="text-white" />
              </div>
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary to-accent opacity-30 blur-xl animate-pulse" />
            </div>
            <h2 className="font-display text-4xl md:text-5xl font-semibold tracking-tight mb-3">Gerando seu certificado...</h2>
            <p className="text-sm text-ink-500 mb-7">Em segundos você terá seu cert real.</p>
            <div className="space-y-2 max-w-sm mx-auto text-sm text-ink-700 mt-6">
              <LoadingStep delay={0}>Criando ID único (ULID)</LoadingStep>
              <LoadingStep delay={350}>Calculando hash SHA-256</LoadingStep>
              <LoadingStep delay={700}>Gerando URL de verificação</LoadingStep>
              <LoadingStep delay={1050}>Renderizando layout premium</LoadingStep>
            </div>
          </div>
        )}
      </div>

      <footer className="relative z-10 max-w-2xl mx-auto pb-6 px-5 text-center text-[11px] text-ink-500">
        🇧🇷 UniverCert · Demo limitada a 3 testes/hora por IP. Curtindo? <a href="/sign-up" className="text-primary font-bold hover:underline">Crie conta grátis</a>.
      </footer>
    </main>
  );
}

function firstName(nome: string): string {
  const trimmed = nome.trim();
  if (!trimmed) return 'aluno(a)';
  return trimmed.split(/\s+/)[0];
}

function ProgressDot({ active }: { active?: boolean }) {
  return <div className={`h-1.5 flex-1 rounded-full transition-all duration-700 ${active ? 'bg-gradient-to-r from-primary via-violet-500 to-accent' : 'bg-gray-200'}`} />;
}

function LoadingStep({ delay, children }: { delay: number; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-center gap-2 opacity-0 animate-fade-in" style={{ animationDelay: `${delay}ms`, animationFillMode: 'forwards' }}>
      <span className="text-success font-bold">✓</span>
      <span>{children}</span>
    </div>
  );
}
