'use client';

// UniverCert · /billing GODMODE Client (S37)

import { useEffect, useState } from 'react';
import { PLANS, formatPrice, yearlySavingsBrlCents, type PlanId } from '@/lib/plans';

type UsageData = {
  plan: { id: PlanId; name: string; monthlyBrlCents: number; yearlyBrlCents: number; limits: any; features: string[] };
  subscription: { status: string; provider: string; currentPeriodEnd: number; cancelAtPeriodEnd: boolean; trialEndsAt: number | null } | null;
  usage: { periodYm: string; certsEmitted: number; aiJobsCount: number; aiCostBrlCents: number; pctCertsUsed: number; pctAiUsed: number };
  invoices: Array<{ id: string; status: string; amountBrlCents: number; description: string; invoicePdfUrl: string | null; paidAt: number | null; createdAt: number }>;
};

export default function BillingClient({ userEmail, workspaceName }: { userEmail: string; workspaceName: string }) {
  const [data, setData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [cycle, setCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/v1/billing/usage')
      .then((r) => r.json())
      .then((d) => { if (d.ok) setData(d); else setError(d.error); })
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, []);

  const handleUpgrade = async (planId: PlanId) => {
    setBusy(planId); setError(null);
    try {
      const r = await fetch('/api/v1/billing/checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ plan: planId, cycle, provider: 'stripe', trialDays: 14 }),
      });
      const d = await r.json();
      if (d.ok && d.checkoutUrl) {
        window.location.href = d.checkoutUrl;
      } else {
        setError(d.message ?? d.error ?? 'Erro no checkout');
      }
    } catch (e) {
      setError((e as Error).message);
    } finally { setBusy(null); }
  };

  const handlePortal = async () => {
    setBusy('portal'); setError(null);
    try {
      const r = await fetch('/api/v1/billing/portal', { method: 'POST' });
      const d = await r.json();
      if (d.ok && d.url) window.location.href = d.url;
      else setError(d.error ?? 'Sem subscription ativa');
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(null); }
  };

  if (loading) return <div className="card text-center py-12 text-sm text-[rgb(var(--fg-muted))]">Carregando…</div>;
  if (!data) return <div className="card text-sm text-[rgb(var(--danger))]">Erro: {error}</div>;

  const currentPlan = data.plan.id;
  const periodEnd = data.subscription?.currentPeriodEnd ? new Date(data.subscription.currentPeriodEnd * 1000).toLocaleDateString('pt-BR') : null;
  const isTrial = data.subscription?.status === 'trialing';

  return (
    <div className="space-y-6">
      {error && <div className="card text-sm text-[rgb(var(--danger))]">⚠ {error}</div>}

      {/* Current plan + usage cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
        <div className="card" style={{ padding: 24 }}>
          <div className="text-xs uppercase font-bold text-[rgb(var(--fg-muted))] mb-1">Plano atual</div>
          <div className="text-2xl font-bold" style={{ color: '#1B2D5E' }}>{data.plan.name}</div>
          <div className="text-sm text-[rgb(var(--fg-muted))] mt-1">{workspaceName}</div>
          {isTrial && data.subscription?.trialEndsAt && (
            <div className="mt-2 px-2 py-1 inline-block rounded text-xs font-bold bg-amber-100 text-amber-800">
              🎁 Trial até {new Date(data.subscription.trialEndsAt * 1000).toLocaleDateString('pt-BR')}
            </div>
          )}
          {periodEnd && (
            <div className="text-xs text-[rgb(var(--fg-muted))] mt-2">
              {data.subscription?.cancelAtPeriodEnd ? `Cancela em ${periodEnd}` : `Renova em ${periodEnd}`}
            </div>
          )}
          {data.subscription?.providerCustomerId || data.subscription?.provider === 'stripe' ? (
            <button onClick={handlePortal} disabled={busy === 'portal'} className="btn-secondary btn-sm mt-4" style={{ borderRadius: 10 }}>
              {busy === 'portal' ? '...' : 'Gerenciar assinatura'}
            </button>
          ) : null}
        </div>

        <UsageCard label="Certificados emitidos" used={data.usage.certsEmitted} limit={data.plan.limits.certsPerMonth} pct={data.usage.pctCertsUsed} unit="certs" color="#10b981" />
        <UsageCard label="AI requests" used={data.usage.aiJobsCount} limit={data.plan.limits.aiJobsPerMonth} pct={data.usage.pctAiUsed} unit="calls" color="#8b5cf6" />
      </div>

      {/* Plans grid */}
      <div className="card" style={{ padding: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 className="text-lg font-bold">Planos</h2>
            <p className="text-sm text-[rgb(var(--fg-muted))]">Mude de plano a qualquer momento. Pague Stripe (cartão internacional) ou Pagar.me (PIX BR).</p>
          </div>
          <div style={{ display: 'inline-flex', background: 'var(--bg-secondary, rgb(248,250,252))', borderRadius: 10, padding: 4, border: '1px solid rgb(var(--border))' }}>
            {(['monthly', 'yearly'] as const).map((c) => (
              <button key={c} onClick={() => setCycle(c)} style={{
                padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
                background: cycle === c ? '#1B2D5E' : 'transparent',
                color: cycle === c ? '#fff' : 'rgb(var(--fg-muted))',
                fontSize: 12, fontWeight: 600,
              }}>
                {c === 'monthly' ? 'Mensal' : 'Anual (2 meses grátis)'}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
          {(['free', 'starter', 'pro', 'enterprise'] as const).map((pid) => {
            const p = PLANS[pid];
            const isCurrent = pid === currentPlan;
            const price = cycle === 'yearly' ? p.yearlyBrlCents : p.monthlyBrlCents;
            const savings = cycle === 'yearly' ? yearlySavingsBrlCents(p) : 0;
            return (
              <div key={pid} style={{
                background: 'rgb(var(--surface))', border: `2px solid ${p.popular ? '#1B2D5E' : 'rgb(var(--border))'}`,
                borderRadius: 16, padding: 20, position: 'relative',
                ...(isCurrent ? { boxShadow: '0 0 0 3px rgba(16,185,129,0.2)', borderColor: '#10b981' } : {}),
              }}>
                {p.popular && !isCurrent && <span style={{ position: 'absolute', top: -10, left: 16, background: '#1B2D5E', color: '#fff', padding: '2px 10px', borderRadius: 100, fontSize: 10, fontWeight: 700 }}>POPULAR</span>}
                {isCurrent && <span style={{ position: 'absolute', top: -10, left: 16, background: '#10b981', color: '#fff', padding: '2px 10px', borderRadius: 100, fontSize: 10, fontWeight: 700 }}>ATUAL</span>}
                <div style={{ fontSize: 16, fontWeight: 700 }}>{p.name}</div>
                <div style={{ fontSize: 11, color: 'rgb(var(--fg-muted))', minHeight: 28 }}>{p.tagline}</div>
                <div style={{ marginTop: 10, marginBottom: 10 }}>
                  <span style={{ fontSize: 28, fontWeight: 800, color: '#1B2D5E' }}>{formatPrice(price)}</span>
                  {price > 0 && <span style={{ fontSize: 12, color: 'rgb(var(--fg-muted))' }}>/{cycle === 'monthly' ? 'mês' : 'ano'}</span>}
                </div>
                {savings > 0 && <div style={{ fontSize: 10, color: '#10b981', fontWeight: 600, marginBottom: 8 }}>Economia: {formatPrice(savings)}</div>}
                <ul style={{ fontSize: 11, listStyle: 'none', padding: 0, margin: '8px 0 14px', display: 'flex', flexDirection: 'column', gap: 4, color: 'rgb(var(--fg-muted))' }}>
                  {p.features.slice(0, 6).map((f, i) => (<li key={i}>✓ {f}</li>))}
                </ul>
                {pid === 'enterprise' ? (
                  <a href="mailto:contato@univercert.net" className="btn-primary btn-sm w-full text-center" style={{ borderRadius: 10, display: 'block' }}>Falar com vendas</a>
                ) : isCurrent ? (
                  <button disabled className="btn-ghost btn-sm w-full" style={{ borderRadius: 10 }}>Plano atual</button>
                ) : pid === 'free' ? null : (
                  <button onClick={() => handleUpgrade(pid)} disabled={busy === pid} className="btn-primary btn-sm w-full" style={{ borderRadius: 10 }}>
                    {busy === pid ? 'Carregando…' : 'Upgrade →'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Invoice history */}
      {data.invoices.length > 0 && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <h3 style={{ padding: '16px 20px', borderBottom: '1px solid rgb(var(--border))', fontSize: 14, fontWeight: 700 }}>Histórico de faturas</h3>
          <table style={{ width: '100%', fontSize: 13 }}>
            <thead style={{ background: 'rgb(var(--surface-2, 248 250 252))' }}>
              <tr style={{ fontSize: 11, color: 'rgb(var(--fg-muted))', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <th style={{ padding: '10px 16px', textAlign: 'left' }}>Data</th>
                <th style={{ padding: '10px 16px', textAlign: 'left' }}>Descrição</th>
                <th style={{ padding: '10px 16px', textAlign: 'right' }}>Valor</th>
                <th style={{ padding: '10px 16px', textAlign: 'center' }}>Status</th>
                <th style={{ padding: '10px 16px', textAlign: 'right' }}>PDF</th>
              </tr>
            </thead>
            <tbody>
              {data.invoices.map((inv) => (
                <tr key={inv.id} style={{ borderTop: '1px solid rgb(var(--border))' }}>
                  <td style={{ padding: '10px 16px' }}>{new Date(inv.createdAt * 1000).toLocaleDateString('pt-BR')}</td>
                  <td style={{ padding: '10px 16px' }}>{inv.description}</td>
                  <td style={{ padding: '10px 16px', textAlign: 'right', fontFamily: 'monospace' }}>{formatPrice(inv.amountBrlCents)}</td>
                  <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                    <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                      background: inv.status === 'paid' ? 'rgba(16,185,129,0.1)' : inv.status === 'failed' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)',
                      color: inv.status === 'paid' ? '#059669' : inv.status === 'failed' ? '#dc2626' : '#d97706',
                    }}>{inv.status}</span>
                  </td>
                  <td style={{ padding: '10px 16px', textAlign: 'right' }}>
                    {inv.invoicePdfUrl ? <a href={inv.invoicePdfUrl} target="_blank" rel="noopener" style={{ color: '#1B2D5E', textDecoration: 'none', fontSize: 12 }}>↓ baixar</a> : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function UsageCard({ label, used, limit, pct, unit, color }: { label: string; used: number; limit: number; pct: number; unit: string; color: string }) {
  const isUnlimited = limit === -1;
  const isWarning = pct >= 80;
  const isCritical = pct >= 100;
  return (
    <div className="card" style={{ padding: 24 }}>
      <div className="text-xs uppercase font-bold text-[rgb(var(--fg-muted))] mb-1">{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span style={{ fontSize: 28, fontWeight: 800, color: isCritical ? '#dc2626' : color }}>{used.toLocaleString('pt-BR')}</span>
        <span className="text-sm text-[rgb(var(--fg-muted))]">/ {isUnlimited ? '∞' : limit.toLocaleString('pt-BR')} {unit}</span>
      </div>
      {!isUnlimited && (
        <>
          <div style={{ marginTop: 10, background: 'rgba(0,0,0,0.05)', borderRadius: 6, height: 8, overflow: 'hidden' }}>
            <div style={{ width: `${Math.min(pct, 100)}%`, height: '100%', background: isCritical ? '#dc2626' : isWarning ? '#f59e0b' : color, transition: 'width 0.5s' }} />
          </div>
          <div style={{ marginTop: 6, fontSize: 11, color: isCritical ? '#dc2626' : isWarning ? '#d97706' : 'rgb(var(--fg-muted))' }}>
            {pct}% usado{isWarning && ` · ${isCritical ? 'limite atingido!' : 'considere upgrade'}`}
          </div>
        </>
      )}
      {isUnlimited && <div style={{ marginTop: 10, fontSize: 11, color: 'rgb(var(--fg-muted))' }}>Plano ilimitado ✨</div>}
    </div>
  );
}
