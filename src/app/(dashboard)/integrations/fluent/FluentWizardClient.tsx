'use client';

// UniverCert · Fluent Wizard 4 steps

import { useState, useTransition } from 'react';
import { generateFluentSecretAction, saveFluentConfigAction } from './actions';

type Config = {
  auto_approve: boolean;
  send_email: boolean;
  default_template: string;
  course_template_map: Record<string, string>;
};

type Props = {
  workspaceSlug: string;
  workspaceName: string;
  initialSecret: string | null;
  initialConfig: Config;
  templateOptions: { id: string; name: string }[];
};

const APP_BASE = typeof window !== 'undefined' ? window.location.origin : 'https://univercert.com.br';

export default function FluentWizardClient({
  workspaceSlug,
  workspaceName,
  initialSecret,
  initialConfig,
  templateOptions,
}: Props) {
  const [secret, setSecret] = useState<string | null>(initialSecret);
  const [config, setConfig] = useState<Config>(initialConfig);
  const [step, setStep] = useState<1 | 2 | 3 | 4>(initialSecret ? 2 : 1);
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'error' | 'info'; msg: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const [showSecret, setShowSecret] = useState(false);
  const [newCourse, setNewCourse] = useState('');
  const [newTpl, setNewTpl] = useState('classic');

  const webhookUrl = `${APP_BASE}/api/webhooks/fluent?ws=${encodeURIComponent(workspaceSlug)}`;
  const pluginDownloadUrl = `${APP_BASE}/univercert-fluent.zip`;

  const handleGenSecret = () => {
    startTransition(async () => {
      const r = await generateFluentSecretAction();
      if (r.ok) {
        setSecret(r.secret);
        setShowSecret(true);
        setFeedback({ tone: 'success', msg: 'Secret gerado. Copie agora — não vai mais aparecer depois.' });
        setStep(2);
      } else {
        setFeedback({ tone: 'error', msg: r.error });
      }
    });
  };

  const handleSaveConfig = (patch: Partial<Config>) => {
    startTransition(async () => {
      const r = await saveFluentConfigAction(patch);
      if (r.ok) {
        setConfig(r.config);
        setFeedback({ tone: 'success', msg: 'Configuração salva' });
      } else {
        setFeedback({ tone: 'error', msg: r.error });
      }
    });
  };

  const handleAddCourseMap = () => {
    if (!newCourse.trim() || !newTpl) return;
    const next = { ...config.course_template_map, [newCourse.trim()]: newTpl };
    handleSaveConfig({ course_template_map: next });
    setNewCourse('');
  };

  const handleRemoveCourseMap = (k: string) => {
    const next = { ...config.course_template_map };
    delete next[k];
    handleSaveConfig({ course_template_map: next });
  };

  const handleSendTest = async () => {
    setFeedback({ tone: 'info', msg: 'Disparando evento de teste…' });
    if (!secret) {
      setFeedback({ tone: 'error', msg: 'Gere o secret primeiro (Step 1)' });
      return;
    }
    const payload = {
      event: 'course.completed',
      event_id: 'test_' + Date.now(),
      course: { name: 'Curso de Teste UniverCert', hours: 8 },
      student: { name: 'Aluno Teste', email: 'teste@univercert.com.br' },
      is_test: true,
    };
    try {
      const body = JSON.stringify(payload);
      const sig = await hmacHex(body, secret);
      const r = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Fluent-Signature': 'sha256=' + sig },
        body,
      });
      const data = await r.json();
      if (r.ok && data.ok) {
        setFeedback({ tone: 'success', msg: `OK · request criado · auto_approve=${data.autoApproved ? 'sim' : 'não'}` });
      } else {
        setFeedback({ tone: 'error', msg: `${r.status}: ${data.error ?? 'erro'}` });
      }
    } catch (e) {
      setFeedback({ tone: 'error', msg: (e as Error).message });
    }
  };

  return (
    <>
      {/* Stepper */}
      <div className="card mb-6">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          {[
            { n: 1, label: 'Conexão' },
            { n: 2, label: 'Plugin WordPress' },
            { n: 3, label: 'Comportamento' },
            { n: 4, label: 'Testar' },
          ].map((s) => (
            <button
              key={s.n}
              onClick={() => setStep(s.n as any)}
              className={`flex items-center gap-2 text-sm px-3 py-1.5 rounded-md transition ${
                step === s.n
                  ? 'bg-[rgb(var(--brand))] text-white'
                  : s.n < step
                    ? 'bg-[rgb(var(--success-soft))] text-[rgb(var(--success))]'
                    : 'text-[rgb(var(--fg-muted))] hover:bg-[rgb(var(--surface-2))]'
              }`}
            >
              <span className="font-num font-semibold">{s.n}</span>
              <span>{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      {feedback && (
        <div
          className={`mb-4 px-3 py-2.5 rounded-md text-sm ${
            feedback.tone === 'success'
              ? 'bg-[rgb(var(--success-soft))] text-[rgb(var(--success))]'
              : feedback.tone === 'error'
                ? 'bg-[rgb(var(--danger-soft))] text-[rgb(var(--danger))]'
                : 'bg-[rgb(var(--brand-soft))] text-[rgb(var(--brand))]'
          }`}
        >
          {feedback.msg}
        </div>
      )}

      {/* Step 1: Connection */}
      {step === 1 && (
        <section className="card animate-slide-up">
          <h2 className="text-base font-semibold mb-1">1. Gerar credenciais de conexão</h2>
          <p className="text-sm text-[rgb(var(--fg-muted))] mb-4">
            Cria um secret HMAC SHA256 que o plugin WordPress vai usar pra assinar cada evento.
          </p>

          <div className="space-y-3 mb-4">
            <Field label="Workspace slug">
              <code className="kbd-block">{workspaceSlug}</code>
            </Field>
            <Field label="URL do webhook (auto)">
              <CopyableValue value={webhookUrl} />
            </Field>
            {secret && (
              <Field label="Webhook secret">
                <div className="flex items-center gap-2">
                  <code className="kbd-block flex-1">
                    {showSecret ? secret : '•'.repeat(40)}
                  </code>
                  <button onClick={() => setShowSecret((v) => !v)} className="btn-ghost btn-sm">
                    {showSecret ? 'Ocultar' : 'Mostrar'}
                  </button>
                  <CopyButton value={secret} />
                </div>
              </Field>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button onClick={handleGenSecret} disabled={isPending} className="btn-primary btn-sm">
              {isPending ? '…' : secret ? 'Regenerar secret' : 'Gerar secret agora'}
            </button>
            {secret && (
              <button onClick={() => setStep(2)} className="btn-secondary btn-sm">
                Próximo: Plugin →
              </button>
            )}
          </div>

          {secret && (
            <p className="mt-4 text-xs text-[rgb(var(--warning))] bg-[rgb(var(--warning-soft))] p-2 rounded-md">
              ⚠ Regenerar invalida o secret antigo — o plugin no WP vai parar de funcionar até você atualizar lá.
            </p>
          )}
        </section>
      )}

      {/* Step 2: Plugin WP */}
      {step === 2 && (
        <section className="card animate-slide-up">
          <h2 className="text-base font-semibold mb-1">2. Instalar plugin WordPress no UniverHair</h2>
          <p className="text-sm text-[rgb(var(--fg-muted))] mb-4">
            Baixe o .zip, instale no WordPress e cole as credenciais geradas no Step 1.
          </p>

          <ol className="space-y-3 mb-4 text-sm text-[rgb(var(--fg))]">
            <li className="flex gap-3"><span className="step-num">1</span> Baixar plugin: <a href={pluginDownloadUrl} className="text-[rgb(var(--brand))] font-medium underline">univercert-fluent.zip</a></li>
            <li className="flex gap-3"><span className="step-num">2</span> No WordPress UniverHair → Plugins → Adicionar novo → Enviar plugin → escolher .zip → Instalar agora → Ativar</li>
            <li className="flex gap-3"><span className="step-num">3</span> Settings → UniverCert → colar:
              <ul className="ml-3 mt-1 list-disc list-inside text-[rgb(var(--fg-muted))]">
                <li>Workspace slug: <code className="font-mono">{workspaceSlug}</code></li>
                <li>Webhook secret: o gerado no Step 1</li>
              </ul>
            </li>
            <li className="flex gap-3"><span className="step-num">4</span> Salvar configurações</li>
          </ol>

          <div className="flex items-center gap-2">
            <a href={pluginDownloadUrl} className="btn-primary btn-sm">↓ Baixar plugin .zip</a>
            <button onClick={() => setStep(3)} className="btn-secondary btn-sm">
              Próximo: Comportamento →
            </button>
          </div>
        </section>
      )}

      {/* Step 3: Behavior */}
      {step === 3 && (
        <section className="card animate-slide-up">
          <h2 className="text-base font-semibold mb-1">3. Comportamento padrão</h2>
          <p className="text-sm text-[rgb(var(--fg-muted))] mb-4">
            Define o que acontece quando UniverCert recebe um evento de curso concluído.
          </p>

          <div className="space-y-4">
            <Toggle
              label="Auto-aprovar"
              hint="Emite cert imediatamente sem revisão manual. Recomendado pra UniverHair (FluentCommunity já confirma a conclusão)."
              checked={config.auto_approve}
              onChange={(v) => handleSaveConfig({ auto_approve: v })}
            />
            <Toggle
              label="Enviar email automático"
              hint="Aluno recebe email com link do certificado em ~30s após emissão."
              checked={config.send_email}
              onChange={(v) => handleSaveConfig({ send_email: v })}
            />

            <Field label="Template default (usado quando curso não tem mapeamento)">
              <select
                className="input"
                value={config.default_template}
                onChange={(e) => handleSaveConfig({ default_template: e.target.value })}
              >
                {templateOptions.map((t) => (
                  <option key={t.id} value={t.id}>{t.name} · {t.id}</option>
                ))}
              </select>
            </Field>

            <Field label="Mapeamento curso → template (opcional)">
              <div className="space-y-2">
                {Object.entries(config.course_template_map).map(([course, tpl]) => (
                  <div key={course} className="flex items-center gap-2">
                    <code className="flex-1 px-2 py-1.5 bg-[rgb(var(--surface-2))] rounded-md text-xs">{course}</code>
                    <span className="text-[rgb(var(--fg-subtle))]">→</span>
                    <code className="px-2 py-1.5 bg-[rgb(var(--brand-soft))] text-[rgb(var(--brand))] rounded-md text-xs font-medium">{tpl}</code>
                    <button onClick={() => handleRemoveCourseMap(course)} className="btn-ghost btn-sm text-[rgb(var(--danger))]">×</button>
                  </div>
                ))}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Nome exato do curso no FluentCommunity"
                    value={newCourse}
                    onChange={(e) => setNewCourse(e.target.value)}
                    className="input flex-1"
                  />
                  <select className="input" value={newTpl} onChange={(e) => setNewTpl(e.target.value)} style={{ width: 160 }}>
                    {templateOptions.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                  <button onClick={handleAddCourseMap} disabled={!newCourse.trim()} className="btn-primary btn-sm">+</button>
                </div>
                {Object.keys(config.course_template_map).length === 0 && (
                  <p className="text-xs text-[rgb(var(--fg-subtle))]">
                    Nenhum mapeamento. Todos os cursos vão usar o template default <code>{config.default_template}</code>.
                  </p>
                )}
              </div>
            </Field>
          </div>

          <div className="mt-5 flex items-center gap-2">
            <button onClick={() => setStep(4)} className="btn-primary btn-sm">
              Próximo: Testar →
            </button>
          </div>
        </section>
      )}

      {/* Step 4: Test */}
      {step === 4 && (
        <section className="card animate-slide-up">
          <h2 className="text-base font-semibold mb-1">4. Disparar evento de teste</h2>
          <p className="text-sm text-[rgb(var(--fg-muted))] mb-4">
            Simula um aluno completando um curso. Vai criar uma request (e cert se auto_approve estiver ligado), além de enviar o email.
          </p>

          <button onClick={handleSendTest} disabled={isPending || !secret} className="btn-primary btn-sm">
            ⚡ Disparar evento de teste
          </button>

          <div className="mt-6 p-4 bg-[rgb(var(--surface-2))] rounded-md text-sm">
            <h3 className="font-semibold mb-2">Após o teste, conferir:</h3>
            <ul className="space-y-1.5 text-[rgb(var(--fg-muted))]">
              <li><a href="/queue" className="text-[rgb(var(--brand))] underline">/queue</a> — request aparece (pending ou approved se auto)</li>
              <li><a href="/credentials" className="text-[rgb(var(--brand))] underline">/credentials</a> — cert criado se auto_approve=on</li>
              <li><a href="/admin/health" className="text-[rgb(var(--brand))] underline">/admin/health</a> — email aparece em "Emails recentes"</li>
              <li><a href={`/embed/student/teste@univercert.com.br?ws=${workspaceSlug}`} target="_blank" rel="noopener" className="text-[rgb(var(--brand))] underline">/embed/student/teste@univercert.com.br</a> — embed widget mostra o cert</li>
            </ul>
          </div>

          <div className="mt-4 p-4 bg-[rgb(var(--brand-soft))] rounded-md text-sm">
            <h3 className="font-semibold mb-2 text-[rgb(var(--brand))]">📋 Embed no perfil do aluno (UniverHair)</h3>
            <p className="text-[rgb(var(--fg-muted))] mb-2">Cole o shortcode em qualquer página/post do FluentCommunity:</p>
            <code className="block p-2 bg-[rgb(var(--surface))] rounded text-xs font-mono">[univercert_certificates]</code>
            <p className="text-xs text-[rgb(var(--fg-subtle))] mt-2">Mostra todos os certs do user logado (pega o email automaticamente).</p>
          </div>
        </section>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .kbd-block { display: inline-block; padding: 6px 10px; background: rgb(var(--surface-2)); border: 1px solid rgb(var(--border)); border-radius: 6px; font-family: ui-monospace, monospace; font-size: 12px; word-break: break-all; }
        .step-num { display: inline-flex; align-items: center; justify-content: center; width: 22px; height: 22px; border-radius: 50%; background: rgb(var(--brand)); color: white; font-size: 11px; font-weight: 700; flex-shrink: 0; }
      ` }} />
    </>
  );
}

/* ---- helpers ---- */

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
    </div>
  );
}

function Toggle({ label, hint, checked, onChange }: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-start gap-3 cursor-pointer p-2 -m-2 rounded-md hover:bg-[rgb(var(--surface-2))] transition">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 w-4 h-4 accent-[rgb(var(--brand))]"
      />
      <div className="flex-1">
        <div className="text-sm font-medium">{label}</div>
        {hint && <div className="text-xs text-[rgb(var(--fg-muted))] mt-0.5">{hint}</div>}
      </div>
    </label>
  );
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        try { await navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch {}
      }}
      className="btn-secondary btn-sm"
    >
      {copied ? '✓ Copiado' : 'Copiar'}
    </button>
  );
}

function CopyableValue({ value }: { value: string }) {
  return (
    <div className="flex items-center gap-2">
      <code className="kbd-block flex-1">{value}</code>
      <CopyButton value={value} />
    </div>
  );
}

async function hmacHex(message: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, '0')).join('');
}
