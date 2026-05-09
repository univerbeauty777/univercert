'use client';

// UniverCert · Domain Wizard · Sprint 19 GODMODE
// 4 steps: input → DNS → wait verify → done

import { useState, useTransition, useEffect } from 'react';
import { addDomainAction, removeDomainAction, checkDomainStatusAction } from './actions';

type Step = 'input' | 'dns' | 'verifying' | 'active';
type Status = { ssl: 'pending' | 'active' | 'failed'; verification: 'pending' | 'active' | 'failed' };

const SUBDOMAIN_RE = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z]{2,})+$/i;

export default function DomainWizard({
  workspaceId,
  currentDomain,
  fallbackHost,
}: {
  workspaceId: string;
  currentDomain: string | null;
  fallbackHost: string;
}) {
  const [step, setStep] = useState<Step>(currentDomain ? 'active' : 'input');
  const [domain, setDomain] = useState(currentDomain ?? '');
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<Status | null>(null);
  const [isPending, startTransition] = useTransition();
  const [polling, setPolling] = useState(false);

  // Auto-poll status quando estiver em verifying
  useEffect(() => {
    if (step !== 'verifying' && step !== 'dns') return;
    if (!domain) return;

    let cancelled = false;
    const poll = async () => {
      const result = await checkDomainStatusAction({ workspaceId, hostname: domain });
      if (cancelled) return;
      if (result.ok) {
        setStatus(result.status);
        if (result.status.ssl === 'active' && result.status.verification === 'active') {
          setStep('active');
          setPolling(false);
        }
      }
    };
    setPolling(true);
    poll();
    const interval = setInterval(poll, 8000);
    return () => {
      cancelled = true;
      setPolling(false);
      clearInterval(interval);
    };
  }, [step, domain, workspaceId]);

  const subdomainPart = domain.split('.')[0];

  const submitAdd = () => {
    setError(null);
    const clean = domain.trim().toLowerCase();
    if (!SUBDOMAIN_RE.test(clean)) {
      setError('Domínio inválido. Use formato: cert.suaescola.com.br');
      return;
    }
    startTransition(async () => {
      const result = await addDomainAction({ workspaceId, hostname: clean });
      if (result.ok) {
        setDomain(clean);
        setStep('dns');
      } else {
        setError(result.error);
      }
    });
  };

  const handleRemove = () => {
    if (!confirm(`Remover ${currentDomain}? Você perderá acesso via esse domínio (mas o cert.universuaescola.com.br não funciona mais).`)) return;
    startTransition(async () => {
      const result = await removeDomainAction({ workspaceId });
      if (result.ok) {
        window.location.reload();
      } else {
        setError(result.error);
      }
    });
  };

  return (
    <>
      {/* Progress stepper */}
      <div className="grid grid-cols-4 gap-2 mb-7">
        {(['input', 'dns', 'verifying', 'active'] as Step[]).map((s, i) => {
          const stepIdx = ['input', 'dns', 'verifying', 'active'].indexOf(step);
          const isActive = i <= stepIdx;
          const labels = ['Domínio', 'DNS', 'SSL', 'Ativo'];
          return (
            <div key={s} className="text-center">
              <div className={`h-1.5 rounded-full mb-2 transition-all duration-700 ${
                isActive ? 'bg-gradient-to-r from-primary to-accent' : 'bg-gray-200 dark:bg-ink-700'
              }`} />
              <div className={`text-[10px] uppercase tracking-widest font-bold ${
                i === stepIdx ? 'text-primary dark:text-accent' : isActive ? 'text-ink-700 dark:text-ink-300' : 'text-ink-500'
              }`}>
                {labels[i]}
              </div>
            </div>
          );
        })}
      </div>

      {error && (
        <div className="mb-5 p-3 rounded-xl text-sm bg-danger/10 text-danger border border-danger/20">
          ⚠ {error}
        </div>
      )}

      {/* STEP 1 — Input domínio */}
      {step === 'input' && (
        <div className="card !p-7 animate-slide-up">
          <h2 className="font-display text-2xl font-semibold tracking-tight mb-2">Qual domínio você quer usar?</h2>
          <p className="text-sm text-ink-500 dark:text-ink-400 mb-6">
            Recomendamos um subdomínio dedicado pra certificados. Exemplo:{' '}
            <code className="text-primary dark:text-accent">cert.suaescola.com.br</code>
          </p>

          <div className="space-y-2">
            <label className="label">Seu domínio</label>
            <div className="flex gap-2">
              <input
                type="text"
                className="input text-base flex-1"
                placeholder="cert.suaescola.com.br"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submitAdd()}
                autoFocus
              />
              <button onClick={submitAdd} disabled={isPending || !domain} className="btn-gradient text-base px-6">
                {isPending ? 'Adicionando...' : 'Próximo →'}
              </button>
            </div>
          </div>

          <div className="mt-6 grid sm:grid-cols-3 gap-2 text-xs">
            <Pill icon="🔐" text="SSL automático Let's Encrypt" />
            <Pill icon="⚡" text="Cloudflare edge BR" />
            <Pill icon="💎" text="Plano Pro · R$ 297/mês" />
          </div>
        </div>
      )}

      {/* STEP 2 — Configurar DNS */}
      {step === 'dns' && (
        <div className="card !p-7 animate-slide-up">
          <h2 className="font-display text-2xl font-semibold tracking-tight mb-2">Configure o DNS</h2>
          <p className="text-sm text-ink-500 dark:text-ink-400 mb-6">
            Crie um registro <strong>CNAME</strong> no painel de DNS do seu domínio (Registro.br, Cloudflare, GoDaddy, etc.).
          </p>

          <div className="card !p-5 bg-ink-900 dark:bg-black border-ink-700 mb-5">
            <div className="text-[10px] uppercase tracking-widest text-accent font-bold mb-3">DNS record</div>
            <div className="grid grid-cols-3 gap-4 font-mono text-sm">
              <DnsField label="Tipo" value="CNAME" />
              <DnsField label="Nome" value={subdomainPart} copy />
              <DnsField label="Valor" value={fallbackHost} copy />
            </div>
            <div className="mt-3 pt-3 border-t border-ink-700 text-xs text-ink-400">
              TTL: 3600 (1h) · Proxy: desabilitado se for Cloudflare
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            <button
              onClick={() => setStep('verifying')}
              className="btn-gradient text-sm"
            >
              ✓ Já configurei · verificar →
            </button>
            <button onClick={handleRemove} disabled={isPending} className="btn-secondary text-sm text-danger">
              Cancelar
            </button>
          </div>

          <details className="mt-6">
            <summary className="text-xs text-ink-500 dark:text-ink-400 cursor-pointer hover:text-primary">
              Como configurar no Registro.br?
            </summary>
            <ol className="text-xs text-ink-500 dark:text-ink-400 mt-3 space-y-1.5 list-decimal list-inside leading-relaxed">
              <li>Entre no painel do Registro.br</li>
              <li>Selecione seu domínio (suaescola.com.br)</li>
              <li>Vá em "Editar zona DNS"</li>
              <li>Adicione novo registro: tipo CNAME, nome <code>{subdomainPart}</code>, valor <code>{fallbackHost}</code></li>
              <li>Salve. Propagação leva ~5-30min.</li>
              <li>Volta aqui e clica em "verificar"</li>
            </ol>
          </details>
        </div>
      )}

      {/* STEP 3 — Verifying */}
      {step === 'verifying' && (
        <div className="card !p-7 animate-slide-up text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-primary to-accent mb-5 shadow-glow-primary animate-pulse-glow">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="animate-spin">
              <circle cx="12" cy="12" r="10" strokeOpacity="0.3" />
              <path d="M12 2a10 10 0 0 1 10 10" />
            </svg>
          </div>
          <h2 className="font-display text-2xl font-semibold tracking-tight mb-2">Verificando DNS e SSL...</h2>
          <p className="text-sm text-ink-500 dark:text-ink-400 mb-7 max-w-md mx-auto">
            Estamos validando o CNAME e provisionando certificado SSL. Geralmente leva 30s a 2min.
          </p>

          <div className="space-y-2 max-w-sm mx-auto text-left">
            <StatusRow label="DNS CNAME" state={status?.verification ?? 'pending'} />
            <StatusRow label="SSL Let's Encrypt" state={status?.ssl ?? 'pending'} />
          </div>

          {polling && (
            <p className="text-xs text-ink-500 dark:text-ink-400 mt-7 italic">
              ↻ Verificando a cada 8 segundos
            </p>
          )}

          <button onClick={() => setStep('dns')} className="text-xs text-ink-500 dark:text-ink-400 hover:text-primary mt-4">
            ← Voltar e revisar DNS
          </button>
        </div>
      )}

      {/* STEP 4 — Active */}
      {step === 'active' && currentDomain && (
        <div className="card !p-7 animate-slide-up">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-success-soft border border-success/30 rounded-full text-[10px] font-bold text-success uppercase tracking-widest mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            Ativo · SSL OK
          </div>
          <h2 className="font-display text-3xl font-semibold tracking-tight mb-2">
            <span className="text-gradient">{currentDomain}</span>
          </h2>
          <p className="text-sm text-ink-500 dark:text-ink-400 mb-6">
            Seu domínio está ativo. Todo cert emitido pode ser verificado em{' '}
            <code className="text-primary dark:text-accent">{currentDomain}/v/&lt;id&gt;</code>.
          </p>

          <div className="grid sm:grid-cols-3 gap-3 mb-6">
            <a href={`https://${currentDomain}`} target="_blank" rel="noopener" className="card !p-4 text-center hover:-translate-y-1 transition flex flex-col items-center gap-1">
              <span className="text-2xl">🌐</span>
              <span className="text-xs font-bold">Abrir site</span>
            </a>
            <a href={`https://${currentDomain}/verificar`} target="_blank" rel="noopener" className="card !p-4 text-center hover:-translate-y-1 transition flex flex-col items-center gap-1">
              <span className="text-2xl">🔐</span>
              <span className="text-xs font-bold">Verificador</span>
            </a>
            <a href={`https://${currentDomain}/demo`} target="_blank" rel="noopener" className="card !p-4 text-center hover:-translate-y-1 transition flex flex-col items-center gap-1">
              <span className="text-2xl">🧪</span>
              <span className="text-xs font-bold">Demo</span>
            </a>
          </div>

          <button onClick={handleRemove} disabled={isPending} className="btn-secondary text-sm text-danger w-full">
            Remover domínio
          </button>
        </div>
      )}

      {/* Footer info */}
      <div className="mt-8 card !p-6 bg-gradient-to-br from-primary-soft via-white to-accent/5 dark:from-ink-800 dark:via-ink-800 dark:to-ink-700 border-primary/20">
        <h3 className="font-bold mb-3 tracking-tight">Como funciona</h3>
        <ol className="text-sm text-ink-700 dark:text-ink-300 space-y-2.5 list-decimal list-inside leading-relaxed">
          <li>Você adiciona <code className="text-primary dark:text-accent">cert.suaescola.com.br</code></li>
          <li>Criamos o custom hostname no Cloudflare for SaaS</li>
          <li>Você cria CNAME no DNS apontando pra <code className="text-primary dark:text-accent">{fallbackHost}</code></li>
          <li>Cloudflare emite SSL automático (Let's Encrypt) em segundos</li>
          <li>Verify pages, emails e branding aparecem com sua marca</li>
        </ol>
        <p className="text-xs text-ink-500 dark:text-ink-400 mt-4">
          💎 Disponível a partir do plano <strong>Pro (R$ 297/mês)</strong>.
        </p>
      </div>
    </>
  );
}

function Pill({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="card !p-3 flex items-center gap-2 text-xs">
      <span className="text-base">{icon}</span>
      <span className="text-ink-700 dark:text-ink-300 font-medium">{text}</span>
    </div>
  );
}

function DnsField({ label, value, copy }: { label: string; value: string; copy?: boolean }) {
  const onCopy = () => navigator.clipboard.writeText(value).catch(() => {});
  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-ink-400 font-bold mb-1.5">{label}</div>
      <div className="flex items-center gap-2">
        <code className="text-white text-sm font-bold">{value}</code>
        {copy && (
          <button onClick={onCopy} title="Copiar" className="text-ink-400 hover:text-accent text-xs">
            📋
          </button>
        )}
      </div>
    </div>
  );
}

function StatusRow({ label, state }: { label: string; state: 'pending' | 'active' | 'failed' }) {
  const colors = {
    pending: 'text-ink-500 dark:text-ink-400',
    active: 'text-success',
    failed: 'text-danger',
  };
  const icons = {
    pending: '↻',
    active: '✓',
    failed: '✗',
  };
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-ink-800 rounded-lg">
      <span className="text-sm font-medium">{label}</span>
      <span className={`text-base font-bold ${colors[state]} ${state === 'pending' ? 'animate-spin' : ''}`}>
        {icons[state]}
      </span>
    </div>
  );
}
