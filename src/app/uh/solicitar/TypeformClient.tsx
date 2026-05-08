'use client';

import { useState, useEffect, useRef } from 'react';
import { isValidCPF, maskCPF } from '@/lib/cpf';

type Step = {
  key: keyof FormData;
  label: string;
  hint?: string;
  type: 'text' | 'email' | 'tel' | 'date' | 'cpf' | 'consent';
  placeholder?: string;
  required?: boolean;
  validate?: (v: string) => string | null; // returns error msg or null
};

type FormData = {
  curso: string;
  nome: string;
  cpf: string;
  email: string;
  whatsapp: string;
  data_conclusao: string;
  lgpd_consent: string;
};

export default function TypeformClient({
  cursoPreenchido,
  turmaPreenchida,
  workspaceSlug,
}: {
  cursoPreenchido: string;
  turmaPreenchida: string;
  workspaceSlug: string;
}) {
  const initialCurso = cursoPreenchido;
  const STEPS: Step[] = [
    {
      key: 'curso',
      label: initialCurso ? `Você concluiu "${initialCurso}", certo?` : 'Qual curso você concluiu?',
      hint: 'Confirme o nome do curso para o certificado',
      type: 'text',
      placeholder: 'ex: Coloração Avançada',
      required: true,
    },
    {
      key: 'nome',
      label: 'Como você quer ser identificado no certificado?',
      hint: 'Esse nome aparece em destaque no documento',
      type: 'text',
      placeholder: 'Seu nome completo',
      required: true,
      validate: (v) => (v.trim().split(' ').length < 2 ? 'Inclua pelo menos nome e sobrenome' : null),
    },
    {
      key: 'cpf',
      label: 'Qual seu CPF?',
      hint: 'Para validação oficial · só você vê',
      type: 'cpf',
      placeholder: '000.000.000-00',
      required: true,
      validate: (v) => (!isValidCPF(v) ? 'CPF inválido — verifique os números' : null),
    },
    {
      key: 'email',
      label: 'Pra qual email enviamos seu certificado?',
      hint: 'Você também recebe no WhatsApp',
      type: 'email',
      placeholder: 'voce@exemplo.com',
      required: true,
    },
    {
      key: 'whatsapp',
      label: 'WhatsApp para receber o link?',
      hint: 'Com DDD · enviamos só uma mensagem com o certificado',
      type: 'tel',
      placeholder: '(11) 99999-9999',
      required: true,
      validate: (v) => (v.replace(/\D/g, '').length < 10 ? 'Número incompleto' : null),
    },
    {
      key: 'data_conclusao',
      label: 'Quando você concluiu o curso?',
      hint: 'Data que aparece no certificado',
      type: 'date',
      required: true,
    },
    {
      key: 'lgpd_consent',
      label: 'Tudo certo com seus dados?',
      hint: 'Aceito que a UniverHair use meus dados para emitir e validar este certificado, conforme a política de privacidade LGPD.',
      type: 'consent',
      required: true,
    },
  ];

  const [form, setForm] = useState<FormData>({
    curso: cursoPreenchido,
    nome: '',
    cpf: '',
    email: '',
    whatsapp: '',
    data_conclusao: '',
    lgpd_consent: '',
  });
  const [stepIdx, setStepIdx] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<{ id: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const step = STEPS[stepIdx];
  const progress = ((stepIdx + 1) / STEPS.length) * 100;
  const isLast = stepIdx === STEPS.length - 1;

  useEffect(() => {
    inputRef.current?.focus();
  }, [stepIdx]);

  const next = () => {
    setError(null);
    const value = form[step.key];
    if (step.required && !value && step.type !== 'consent') {
      setError('Esse campo é obrigatório');
      return;
    }
    if (step.type === 'consent' && value !== 'on') {
      setError('Você precisa aceitar para continuar');
      return;
    }
    if (step.validate) {
      const err = step.validate(value);
      if (err) {
        setError(err);
        return;
      }
    }
    if (isLast) {
      submit();
    } else {
      setStepIdx((i) => i + 1);
    }
  };

  const back = () => {
    setError(null);
    setStepIdx((i) => Math.max(0, i - 1));
  };

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.set('workspace_slug', workspaceSlug);
      fd.set('source', 'form');
      fd.set('curso', form.curso);
      fd.set('nome', form.nome);
      fd.set('cpf', form.cpf);
      fd.set('email', form.email);
      fd.set('whatsapp', form.whatsapp);
      fd.set('data_conclusao', form.data_conclusao);
      fd.set('lgpd_consent', form.lgpd_consent);
      if (turmaPreenchida) fd.set('turma', turmaPreenchida);

      const resp = await fetch('/api/v1/requests', {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: fd,
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error ?? 'submit_failed');
      }
      const data = await resp.json();
      setDone({ id: data.request_id });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      next();
    }
  };

  if (done) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-6 bg-gradient-to-br from-success/10 via-white to-primary/5 animate-fade-in">
        <div className="text-7xl mb-6 animate-scale-in">🎉</div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-center max-w-2xl tracking-tight animate-slide-up">
          Solicitação <span className="bg-gradient-to-r from-success to-primary bg-clip-text text-transparent">recebida!</span>
        </h1>
        <p className="text-lg text-gray-600 mt-6 max-w-lg text-center animate-slide-up" style={{ animationDelay: '100ms' }}>
          Nossa equipe valida em até <strong>48h</strong>. Você recebe email + WhatsApp com o link do certificado.
        </p>
        <p className="text-xs text-gray-400 font-mono mt-8 animate-slide-up" style={{ animationDelay: '200ms' }}>
          Protocolo: {done.id}
        </p>
        <a
          href="/"
          className="btn-primary mt-10 text-base px-7 py-3.5 animate-slide-up"
          style={{ animationDelay: '300ms' }}
        >
          Página inicial
        </a>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col bg-gradient-to-br from-primary-soft via-white to-accent/5 relative overflow-hidden">
      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-gray-100 z-50">
        <div
          className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Logo */}
      <div className="absolute top-6 left-6 z-10 flex items-center gap-2">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold shadow-md shadow-primary/30">
          🏆
        </div>
        <span className="font-extrabold tracking-tight">
          Univer<span className="text-primary">Cert</span>
        </span>
      </div>

      {/* Step counter */}
      <div className="absolute top-6 right-6 z-10 text-xs font-bold uppercase tracking-widest text-gray-400">
        {stepIdx + 1} <span className="text-gray-200 mx-1">/</span> {STEPS.length}
      </div>

      {/* Step content */}
      <div className="flex-1 flex items-center justify-center px-6 md:px-12 py-24">
        <div key={stepIdx} className="w-full max-w-2xl animate-slide-up">
          {/* Question number */}
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center">
              {stepIdx + 1}
            </div>
            <div className="h-px w-12 bg-primary/30" />
            <div className="text-xs font-bold uppercase tracking-wider text-primary">
              {isLast ? 'Última pergunta' : 'Pergunta'}
            </div>
          </div>

          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight mb-3">
            {step.label}
          </h2>
          {step.hint && (
            <p className="text-lg text-gray-500 mb-10 max-w-xl">{step.hint}</p>
          )}

          {/* Input variants */}
          {step.type === 'consent' ? (
            <button
              type="button"
              onClick={() => {
                setForm((f) => ({ ...f, lgpd_consent: f.lgpd_consent === 'on' ? '' : 'on' }));
              }}
              className={`flex items-center gap-3 px-5 py-4 rounded-xl border-2 transition-all w-full md:w-auto text-left ${
                form.lgpd_consent === 'on'
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-200 hover:border-primary/50'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-md flex items-center justify-center text-white text-sm transition-all ${
                  form.lgpd_consent === 'on' ? 'bg-primary' : 'bg-gray-200'
                }`}
              >
                {form.lgpd_consent === 'on' ? '✓' : ''}
              </div>
              <span className="font-medium text-gray-700">Sim, aceito</span>
            </button>
          ) : (
            <input
              ref={inputRef}
              type={step.type === 'cpf' ? 'text' : step.type}
              value={form[step.key]}
              onChange={(e) => {
                const v = e.target.value;
                const formatted = step.type === 'cpf' ? maskCPF(v) : v;
                setForm((f) => ({ ...f, [step.key]: formatted }));
                setError(null);
              }}
              onKeyDown={handleKey}
              placeholder={step.placeholder}
              inputMode={step.type === 'cpf' || step.type === 'tel' ? 'numeric' : undefined}
              maxLength={step.type === 'cpf' ? 14 : undefined}
              className="tf-input"
              autoComplete="off"
            />
          )}

          {error && (
            <div className="mt-4 text-sm text-danger font-medium animate-fade-in">
              ⚠ {error}
            </div>
          )}

          {/* Action footer */}
          <div className="flex items-center gap-4 mt-12">
            <button
              onClick={next}
              disabled={submitting}
              className="btn-primary text-base px-7 py-3.5 group"
            >
              {submitting ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Enviando...
                </>
              ) : isLast ? (
                <>
                  Enviar solicitação <span className="ml-1">→</span>
                </>
              ) : (
                <>
                  OK <span className="ml-1 transition-transform group-hover:translate-x-1">→</span>
                </>
              )}
            </button>
            <span className="text-xs text-gray-400 hidden md:inline">
              ou pressione <kbd className="px-2 py-0.5 bg-gray-100 rounded font-mono text-[11px] border-b-2 border-gray-200">Enter ↵</kbd>
            </span>
          </div>
        </div>
      </div>

      {/* Bottom nav */}
      <div className="fixed bottom-6 right-6 z-10 flex flex-col gap-2">
        <button
          onClick={back}
          disabled={stepIdx === 0}
          className="w-10 h-10 rounded-lg bg-white border border-gray-200 hover:border-primary disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-gray-600 hover:text-primary transition-all shadow-sm"
          title="Voltar"
        >
          ↑
        </button>
        <button
          onClick={next}
          className="w-10 h-10 rounded-lg bg-white border border-gray-200 hover:border-primary flex items-center justify-center text-gray-600 hover:text-primary transition-all shadow-sm"
          title="Avançar"
        >
          ↓
        </button>
      </div>
    </main>
  );
}
