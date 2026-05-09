'use client';

// UniverCert · Onboarding wizard premium

import { useState, useTransition } from 'react';
import Logo from '@/components/Logo';

type Step = 0 | 1 | 2 | 3 | 4;

const STEPS = [
  { n: 1, title: 'Identidade visual', desc: 'Cores e nome da escola' },
  { n: 2, title: 'Template', desc: 'Escolha o estilo do certificado' },
  { n: 3, title: 'Primeiro cert', desc: 'Emita um pra você ver como fica' },
  { n: 4, title: 'Integrações', desc: 'Conecte Hotmart, Memberkit ou Fluent' },
  { n: 5, title: 'Pronto!', desc: 'Sua escola está no ar' },
];

const TEMPLATES = [
  { id: 'classic', name: 'Classic', tag: 'Editorial', emoji: '📜' },
  { id: 'modern', name: 'Modern', tag: 'Tech', emoji: '⚡' },
  { id: 'gold', name: 'Gold', tag: 'Luxo', emoji: '✨' },
  { id: 'minimal', name: 'Minimal', tag: 'Swiss', emoji: '◽' },
  { id: 'executive', name: 'Executive', tag: 'Corporate', emoji: '💼' },
  { id: 'creative', name: 'Creative', tag: 'Bold', emoji: '🎨' },
];

const PALETTES = [
  { name: 'Navy + Gold', primary: '#1B2D5E', accent: '#D4A937' },
  { name: 'Black + Gold', primary: '#0A0E1A', accent: '#D4A937' },
  { name: 'Indigo + Pink', primary: '#6366F1', accent: '#EC4899' },
  { name: 'Emerald', primary: '#065F46', accent: '#34D399' },
  { name: 'Burgundy', primary: '#7C2D12', accent: '#FB7185' },
  { name: 'Royal', primary: '#1E3A8A', accent: '#FCD34D' },
];

const INTEGRATIONS = [
  { id: 'hotmart', name: 'Hotmart', logo: '🇧🇷', desc: 'Curso vendido na Hotmart' },
  { id: 'memberkit', name: 'Memberkit', logo: '🇧🇷', desc: 'Área de membros Memberkit' },
  { id: 'fluent', name: 'Fluent Community', logo: '🇧🇷', desc: 'Comunidade WordPress' },
  { id: 'kiwify', name: 'Kiwify', logo: '🇧🇷', desc: 'Plataforma Kiwify' },
  { id: 'eduzz', name: 'Eduzz', logo: '🇧🇷', desc: 'Plataforma Eduzz' },
  { id: 'manual', name: 'Manual / Form', logo: '✋', desc: 'Vou usar form público ou bulk CSV' },
];

export default function OnboardingClient() {
  const [step, setStep] = useState<Step>(0);
  const [isPending, startTransition] = useTransition();

  // Step 1
  const [schoolName, setSchoolName] = useState('');
  const [palette, setPalette] = useState(PALETTES[0]);

  // Step 2
  const [tplId, setTplId] = useState('classic');

  // Step 3 (first cert)
  const [studentName, setStudentName] = useState('');
  const [courseName, setCourseName] = useState('');
  const [firstCertId, setFirstCertId] = useState<string | null>(null);

  // Step 4
  const [integration, setIntegration] = useState<string | null>(null);

  const next = () => setStep((s) => Math.min(4, (s + 1) as Step));
  const back = () => setStep((s) => Math.max(0, (s - 1) as Step));

  const submitStep1 = () => {
    if (!schoolName.trim()) return;
    next();
  };

  const submitStep3 = () => {
    if (!studentName.trim() || !courseName.trim()) return;
    startTransition(async () => {
      // Emite via demo endpoint (placeholder; em produção real seria endpoint /api/v1/credentials direto)
      try {
        const res = await fetch('/api/v1/demo/issue', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ nome: studentName, curso: courseName }),
        });
        const data = await res.json();
        if (data?.credential_id) setFirstCertId(data.credential_id);
        await new Promise((r) => setTimeout(r, 800));
        next();
      } catch {
        next();
      }
    });
  };

  const finish = () => {
    window.location.href = '/dashboard';
  };

  return (
    <main className="min-h-screen bg-mesh relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary-soft/40 via-white to-accent/10" />
      <div className="fixed -top-40 -right-40 w-[500px] h-[500px] rounded-full opacity-25 blur-3xl bg-gradient-to-br from-primary to-accent animate-float" />
      <div className="fixed -bottom-40 -left-40 w-[400px] h-[400px] rounded-full opacity-20 blur-3xl bg-gradient-to-br from-violet-500 to-primary animate-float" style={{ animationDelay: '2s' }} />

      <nav className="relative z-10 max-w-5xl mx-auto py-5 px-5 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2.5">
          <Logo size={36} />
          <span className="font-extrabold tracking-tight text-base">
            <span className="text-primary">univer</span>
            <span className="text-accent">CERT</span>
          </span>
        </a>
        <button
          onClick={finish}
          className="text-xs text-ink-500 hover:text-primary px-3 py-1.5 rounded-lg hover:bg-white/60 transition font-medium"
        >
          Pular onboarding →
        </button>
      </nav>

      <div className="relative z-10 max-w-3xl mx-auto px-5 pt-6 pb-20">
        {/* Stepper */}
        <div className="grid grid-cols-5 gap-1.5 mb-10">
          {STEPS.map((s, i) => (
            <div key={i} className="text-center">
              <div className={`h-1.5 rounded-full transition-all duration-500 mb-2 ${
                i <= step ? 'bg-gradient-to-r from-primary to-accent' : 'bg-gray-200'
              }`} />
              <div className={`text-[10px] uppercase tracking-widest font-bold ${
                i === step ? 'text-primary' : i < step ? 'text-ink-700' : 'text-ink-500'
              }`}>
                {s.title}
              </div>
            </div>
          ))}
        </div>

        {/* STEP 0 — Identidade */}
        {step === 0 && (
          <div className="card-glass p-8 animate-slide-up">
            <div className="inline-block px-3 py-1 bg-primary-soft border border-primary/20 rounded-full text-[10px] font-bold text-primary uppercase tracking-widest mb-4">
              Passo 1 de 5
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-semibold tracking-tight leading-tight mb-3">
              Vamos começar pela identidade
            </h1>
            <p className="text-ink-500 mb-7">Como sua escola se chama e quais cores combinam com ela?</p>

            <div className="space-y-5">
              <div>
                <label className="label">Nome da escola</label>
                <input
                  className="input text-lg"
                  placeholder="Ex: Escola UniverHair"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  autoFocus
                />
              </div>

              <div>
                <label className="label">Paleta de cores</label>
                <div className="grid grid-cols-3 gap-2">
                  {PALETTES.map((p) => (
                    <button
                      key={p.name}
                      onClick={() => setPalette(p)}
                      className={`rounded-xl p-3 border-2 transition-all ${
                        palette.name === p.name ? 'border-primary shadow-glow-primary' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex justify-center gap-1 mb-2">
                        <span className="w-6 h-6 rounded-full border-2 border-white shadow" style={{ background: p.primary }} />
                        <span className="w-6 h-6 rounded-full border-2 border-white shadow -ml-2" style={{ background: p.accent }} />
                      </div>
                      <div className="text-xs font-bold">{p.name}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <button onClick={submitStep1} disabled={!schoolName.trim()} className="btn-gradient text-base px-7 py-3 disabled:opacity-30 disabled:hover:translate-y-0">
                Continuar →
              </button>
            </div>
          </div>
        )}

        {/* STEP 1 — Template */}
        {step === 1 && (
          <div className="card-glass p-8 animate-slide-up">
            <div className="inline-block px-3 py-1 bg-primary-soft border border-primary/20 rounded-full text-[10px] font-bold text-primary uppercase tracking-widest mb-4">
              Passo 2 de 5
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-semibold tracking-tight leading-tight mb-3">
              Qual estilo combina com sua escola?
            </h1>
            <p className="text-ink-500 mb-7">Você pode trocar a qualquer momento em /templates.</p>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTplId(t.id)}
                  className={`text-center rounded-2xl p-5 border-2 transition-all ${
                    tplId === t.id ? 'border-primary bg-primary-soft/40 shadow-glow-primary' : 'border-gray-200 hover:border-primary/40 bg-white'
                  }`}
                >
                  <div className="text-4xl mb-2">{t.emoji}</div>
                  <div className="font-bold tracking-tight">{t.name}</div>
                  <div className="text-[10px] uppercase tracking-widest text-ink-500 mt-1 font-bold">{t.tag}</div>
                </button>
              ))}
            </div>

            <div className="mt-3 text-center">
              <a href={`/api/v1/templates/${tplId}/preview?primary=${encodeURIComponent(palette.primary)}&accent=${encodeURIComponent(palette.accent)}&workspace=${encodeURIComponent(schoolName)}`} target="_blank" rel="noopener" className="text-xs text-primary font-bold hover:underline">
                👁 Ver preview do template "{tplId}" em tela cheia
              </a>
            </div>

            <div className="mt-8 flex justify-between">
              <button onClick={back} className="btn-ghost text-sm">← Voltar</button>
              <button onClick={next} className="btn-gradient text-base px-7 py-3">Continuar →</button>
            </div>
          </div>
        )}

        {/* STEP 2 — First cert */}
        {step === 2 && (
          <div className="card-glass p-8 animate-slide-up">
            <div className="inline-block px-3 py-1 bg-primary-soft border border-primary/20 rounded-full text-[10px] font-bold text-primary uppercase tracking-widest mb-4">
              Passo 3 de 5
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-semibold tracking-tight leading-tight mb-3">
              Vamos emitir seu primeiro certificado
            </h1>
            <p className="text-ink-500 mb-7">Pode ser pra você mesmo, pra ver como fica e compartilhar.</p>

            <div className="space-y-5">
              <div>
                <label className="label">Nome do aluno (pode ser você)</label>
                <input className="input text-lg" placeholder="Diego Pereira" value={studentName} onChange={(e) => setStudentName(e.target.value)} autoFocus />
              </div>
              <div>
                <label className="label">Nome do curso</label>
                <input className="input text-lg" placeholder="Ex: Coloração Profissional 40h" value={courseName} onChange={(e) => setCourseName(e.target.value)} />
              </div>
            </div>

            <div className="mt-8 flex justify-between">
              <button onClick={back} className="btn-ghost text-sm">← Voltar</button>
              <button
                onClick={submitStep3}
                disabled={isPending || !studentName.trim() || !courseName.trim()}
                className="btn-gradient text-base px-7 py-3 disabled:opacity-30"
              >
                {isPending ? 'Emitindo...' : 'Emitir certificado →'}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3 — Integrações */}
        {step === 3 && (
          <div className="card-glass p-8 animate-slide-up">
            <div className="inline-block px-3 py-1 bg-success-soft border border-success/30 rounded-full text-[10px] font-bold text-success uppercase tracking-widest mb-4">
              ✓ Cert emitido · Passo 4 de 5
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-semibold tracking-tight leading-tight mb-3">
              De onde vêm seus alunos?
            </h1>
            <p className="text-ink-500 mb-7">Conecta a plataforma que você já usa pra emitir cert automático.</p>

            {firstCertId && (
              <div className="mb-6 p-4 bg-success-soft border border-success/30 rounded-xl flex items-center gap-3">
                <span className="text-2xl">🎉</span>
                <div className="flex-1 text-sm">
                  <strong className="text-success">Seu primeiro cert está pronto!</strong>
                  <a href={`/v/${firstCertId}`} target="_blank" rel="noopener" className="ml-2 text-primary font-bold hover:underline">
                    Ver agora →
                  </a>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              {INTEGRATIONS.map((i) => (
                <button
                  key={i.id}
                  onClick={() => setIntegration(i.id)}
                  className={`text-left rounded-2xl p-4 border-2 transition-all ${
                    integration === i.id ? 'border-primary bg-primary-soft/40 shadow-glow-primary' : 'border-gray-200 hover:border-primary/40 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">{i.logo}</span>
                    <span className="font-bold">{i.name}</span>
                  </div>
                  <div className="text-xs text-ink-500">{i.desc}</div>
                </button>
              ))}
            </div>

            <div className="mt-8 flex justify-between">
              <button onClick={back} className="btn-ghost text-sm">← Voltar</button>
              <button onClick={next} className="btn-gradient text-base px-7 py-3">Continuar →</button>
            </div>
          </div>
        )}

        {/* STEP 4 — Done */}
        {step === 4 && (
          <div className="card-glass p-8 md:p-12 animate-slide-up text-center">
            <div className="inline-flex items-center justify-center w-24 h-24 mx-auto rounded-3xl bg-gradient-to-br from-primary to-accent mb-7 shadow-glow-primary animate-pulse-glow">
              <Logo size={88} variant="mark-light" className="text-white" />
            </div>
            <div className="inline-block px-3 py-1 bg-success-soft border border-success/30 rounded-full text-[10px] font-bold text-success uppercase tracking-widest mb-5">
              ✓ Pronto · Sua escola está no ar
            </div>
            <h1 className="font-display text-4xl md:text-6xl font-semibold tracking-tight leading-tight mb-4 text-balance">
              Bem-vindo ao <span className="text-gradient">univerCERT</span>!
            </h1>
            <p className="text-ink-500 mb-7 max-w-md mx-auto">
              Sua escola <strong>{schoolName}</strong> está configurada e pronta pra emitir certificados premium.
              {integration && integration !== 'manual' && <> Vou abrir as instruções pra integrar com <strong>{INTEGRATIONS.find(i => i.id === integration)?.name}</strong>.</>}
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-8 text-center">
              <a href="/dashboard" className="card !p-4 hover:-translate-y-1 transition flex flex-col items-center gap-1">
                <span className="text-2xl">📊</span>
                <span className="text-xs font-bold">Dashboard</span>
              </a>
              <a href="/queue" className="card !p-4 hover:-translate-y-1 transition flex flex-col items-center gap-1">
                <span className="text-2xl">📋</span>
                <span className="text-xs font-bold">Fila</span>
              </a>
              <a href="/templates" className="card !p-4 hover:-translate-y-1 transition flex flex-col items-center gap-1">
                <span className="text-2xl">🎨</span>
                <span className="text-xs font-bold">Templates</span>
              </a>
              <a href={integration && integration !== 'manual' ? `/integrations#${integration}` : '/integrations'} className="card !p-4 hover:-translate-y-1 transition flex flex-col items-center gap-1">
                <span className="text-2xl">🔌</span>
                <span className="text-xs font-bold">Integrar</span>
              </a>
            </div>

            <button onClick={finish} className="btn-gradient text-base px-8 py-3.5">
              Ir pro dashboard →
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
