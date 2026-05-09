'use client';

// UniverCert · Workflow editor (live preview + variável insertion + A/B test)

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { AVAILABLE_VARS, previewWithSample, validateTemplate } from '@/lib/workflow-template';
import { saveWorkflowAction, deleteWorkflowAction } from './actions';
import PageHeader from '@/components/PageHeader';

type Workflow = {
  id: string;
  name: string;
  channel: 'email' | 'whatsapp';
  triggerEvent: 'credential.issued' | 'credential.revoked' | 'request.created' | 'nps.d7';
  subject: string;
  bodyTemplate: string;
  isActive: boolean;
  delaySeconds: number;
  abSubjectB: string;
};

const EVENTS = [
  { id: 'credential.issued', label: '🏆 Certificado emitido' },
  { id: 'credential.revoked', label: '⚠ Certificado revogado' },
  { id: 'request.created', label: '📋 Solicitação criada' },
  { id: 'nps.d7', label: '💛 NPS D+7' },
] as const;

export default function WorkflowEditor({
  mode,
  initial,
}: {
  mode: 'new' | 'edit';
  initial: Workflow;
}) {
  const router = useRouter();
  const [w, setW] = useState<Workflow>(initial);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const previewSubject = useMemo(() => previewWithSample(w.subject || ''), [w.subject]);
  const previewBody = useMemo(() => previewWithSample(w.bodyTemplate), [w.bodyTemplate]);
  const previewAbSubject = useMemo(
    () => (w.abSubjectB ? previewWithSample(w.abSubjectB) : null),
    [w.abSubjectB],
  );

  const validation = useMemo(() => {
    const subj = validateTemplate(w.subject || '');
    const body = validateTemplate(w.bodyTemplate);
    const ab = validateTemplate(w.abSubjectB || '');
    const errors: string[] = [];
    if (!subj.ok) errors.push(`Subject: variável desconhecida (${subj.unknownVars.join(', ')})`);
    if (!body.ok) errors.push(`Body: variável desconhecida (${body.unknownVars.join(', ')})`);
    if (!ab.ok) errors.push(`Subject B: variável desconhecida (${ab.unknownVars.join(', ')})`);
    return errors;
  }, [w.subject, w.bodyTemplate, w.abSubjectB]);

  const insertVar = (key: string, target: 'subject' | 'body' | 'ab') => {
    const tag = `{{${key}}}`;
    if (target === 'subject') setW((p) => ({ ...p, subject: p.subject + tag }));
    else if (target === 'ab') setW((p) => ({ ...p, abSubjectB: p.abSubjectB + tag }));
    else setW((p) => ({ ...p, bodyTemplate: p.bodyTemplate + tag }));
  };

  const handleSave = () => {
    if (!w.name.trim()) {
      setFeedback('Dê um nome ao workflow');
      return;
    }
    if (validation.length > 0) {
      setFeedback(`Corrija: ${validation[0]}`);
      return;
    }
    startTransition(async () => {
      const result = await saveWorkflowAction(w);
      if (result.ok) {
        setFeedback('✓ Salvo. Redirecionando…');
        setTimeout(() => router.push('/workflows'), 800);
      } else {
        setFeedback(`✗ ${result.error}`);
      }
    });
  };

  const handleDelete = () => {
    if (!confirm('Remover esse workflow? Volta pros textos padrão.')) return;
    startTransition(async () => {
      const result = await deleteWorkflowAction(w.id);
      if (result.ok) router.push('/workflows');
      else setFeedback(`✗ ${result.error}`);
    });
  };

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-ink-900 py-8 px-6">
      <div className="max-w-7xl mx-auto">
        <PageHeader
          icon={w.channel === 'email' ? '📧' : '💬'}
          title={mode === 'new' ? 'Novo workflow' : `Editar: ${initial.name}`}
          subtitle={`${w.channel === 'email' ? 'Email' : 'WhatsApp'} · ${EVENTS.find(e => e.id === w.triggerEvent)?.label}`}
          actions={
            <>
              {mode === 'edit' && (
                <button onClick={handleDelete} className="btn-ghost text-sm text-danger">
                  Remover
                </button>
              )}
              <a href="/workflows" className="btn-secondary text-sm">Cancelar</a>
              <button onClick={handleSave} disabled={isPending} className="btn-primary text-sm">
                {isPending ? 'Salvando…' : '💾 Salvar'}
              </button>
            </>
          }
        />

        {feedback && (
          <div className={`mb-4 p-3 rounded-xl text-sm font-medium animate-slide-up ${
            feedback.startsWith('✓') ? 'bg-success/10 text-success border border-success/20' : 'bg-danger/10 text-danger border border-danger/20'
          }`}>
            {feedback}
          </div>
        )}

        {validation.length > 0 && (
          <div className="mb-4 p-3 rounded-xl text-sm bg-warning/10 text-warning border border-warning/20">
            ⚠ {validation.join(' · ')}
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-5">
          {/* EDITOR */}
          <div className="space-y-5">
            <div className="card !p-5">
              <h3 className="font-bold mb-4 tracking-tight">Configuração</h3>
              <div className="space-y-4">
                <div>
                  <label className="label">Nome interno</label>
                  <input className="input" value={w.name} onChange={(e) => setW((p) => ({ ...p, name: e.target.value }))} placeholder="Ex: Email cert emitido — versão 2" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Canal</label>
                    <select className="input text-sm" value={w.channel} onChange={(e) => setW((p) => ({ ...p, channel: e.target.value as any }))}>
                      <option value="email">📧 Email</option>
                      <option value="whatsapp">💬 WhatsApp</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Trigger event</label>
                    <select className="input text-sm" value={w.triggerEvent} onChange={(e) => setW((p) => ({ ...p, triggerEvent: e.target.value as any }))}>
                      {EVENTS.map((ev) => <option key={ev.id} value={ev.id}>{ev.label}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Delay (minutos)</label>
                    <input
                      type="number" min={0} max={43200} className="input text-sm"
                      value={Math.round(w.delaySeconds / 60)}
                      onChange={(e) => setW((p) => ({ ...p, delaySeconds: Math.max(0, Number(e.target.value) * 60) }))}
                    />
                  </div>
                  <div>
                    <label className="label">Status</label>
                    <button onClick={() => setW((p) => ({ ...p, isActive: !p.isActive }))} className={`input text-sm flex items-center justify-between ${
                      w.isActive ? 'border-success/40 bg-success/5 text-success' : 'border-gray-300 text-ink-500'
                    }`}>
                      <span>{w.isActive ? '✓ Ativo' : '○ Pausado'}</span>
                      <span className="text-xs">clique pra alternar</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {w.channel === 'email' && (
              <div className="card !p-5">
                <h3 className="font-bold mb-4 tracking-tight">Subject (assunto)</h3>
                <input
                  className="input text-sm"
                  value={w.subject}
                  onChange={(e) => setW((p) => ({ ...p, subject: e.target.value }))}
                  placeholder="Seu certificado de {{courseName}} chegou!"
                />
                <details className="mt-3">
                  <summary className="text-xs text-ink-500 cursor-pointer hover:text-primary">+ A/B test (subject alternativo, 50/50)</summary>
                  <input
                    className="input text-sm mt-2"
                    value={w.abSubjectB}
                    onChange={(e) => setW((p) => ({ ...p, abSubjectB: e.target.value }))}
                    placeholder="Versão B do subject"
                  />
                </details>
              </div>
            )}

            <div className="card !p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold tracking-tight">{w.channel === 'email' ? 'Corpo do email' : 'Mensagem WhatsApp'}</h3>
                <span className="text-[10px] text-ink-500">
                  {w.bodyTemplate.length} chars
                </span>
              </div>
              <textarea
                className="input text-sm font-mono"
                value={w.bodyTemplate}
                onChange={(e) => setW((p) => ({ ...p, bodyTemplate: e.target.value }))}
                rows={14}
                placeholder="Olá {{recipientFirstName}}, ..."
              />

              <div className="mt-4">
                <h4 className="text-[10px] uppercase tracking-widest text-ink-500 font-bold mb-2">Inserir variável</h4>
                <div className="flex gap-1.5 flex-wrap">
                  {AVAILABLE_VARS.map((v) => (
                    <button
                      key={v.key}
                      onClick={() => insertVar(v.key, 'body')}
                      title={`${v.label} · Ex: ${v.example}`}
                      className="px-2 py-1 rounded-lg bg-primary-soft hover:bg-primary hover:text-white text-[10px] font-mono font-bold transition"
                    >
                      {`{{${v.key}}}`}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* PREVIEW */}
          <div className="lg:sticky lg:top-20 space-y-5 self-start">
            <div className="text-[10px] uppercase tracking-widest text-ink-500 font-bold">
              👁 Preview com dados de exemplo
            </div>

            {w.channel === 'email' ? (
              <div className="card !p-0 overflow-hidden">
                <div className="bg-gray-100 dark:bg-ink-700 px-5 py-3 border-b border-gray-200 dark:border-ink-700">
                  <div className="text-[10px] uppercase tracking-widest text-ink-500 font-bold mb-1">De</div>
                  <div className="text-sm font-medium">UniverHair &lt;cert@univerhair.com.br&gt;</div>
                </div>
                <div className="bg-gray-100 dark:bg-ink-700 px-5 py-3 border-b border-gray-200 dark:border-ink-700">
                  <div className="text-[10px] uppercase tracking-widest text-ink-500 font-bold mb-1">Subject</div>
                  <div className="text-sm font-bold">{previewSubject || '(vazio)'}</div>
                  {previewAbSubject && (
                    <div className="mt-1 text-xs text-ink-500">
                      <span className="badge-primary mr-2">B</span>
                      {previewAbSubject}
                    </div>
                  )}
                </div>
                <div className="p-6 whitespace-pre-wrap text-sm leading-relaxed font-sans">
                  {previewBody || <span className="text-ink-500 italic">Body vazio</span>}
                </div>
              </div>
            ) : (
              <div className="max-w-sm mx-auto">
                <div className="bg-[#075E54] rounded-t-2xl px-4 py-3 text-white text-sm">
                  <div className="font-bold">UniverHair</div>
                  <div className="text-[10px] opacity-80">online</div>
                </div>
                <div className="bg-[#ECE5DD] dark:bg-ink-700 p-4">
                  <div className="bg-white dark:bg-ink-800 rounded-lg rounded-tl-sm p-3 max-w-[85%] shadow text-sm whitespace-pre-wrap leading-relaxed">
                    {previewBody || <span className="text-ink-500 italic">Mensagem vazia</span>}
                    <div className="text-[10px] text-ink-500 text-right mt-1">14:42 ✓✓</div>
                  </div>
                </div>
                <div className="bg-[#075E54] rounded-b-2xl h-3" />
              </div>
            )}

            <p className="text-xs text-ink-500 leading-relaxed px-2">
              💡 Variáveis interpoladas com dados de exemplo. Em produção, substituídas pelos dados reais do aluno/curso.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
