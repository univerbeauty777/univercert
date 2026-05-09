// UniverCert · /admin/health · S18 Observability Dashboard

import { requireRole, RbacError } from '@/lib/rbac';
import { getMetrics, type HealthMetrics } from '@/lib/observability';
import PageHeader from '@/components/PageHeader';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

function fmtTime(unix: number) {
  const d = new Date(unix * 1000);
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function ago(unix: number) {
  const s = Math.floor(Date.now() / 1000) - unix;
  if (s < 60) return `${s}s atrás`;
  if (s < 3600) return `${Math.floor(s / 60)}min atrás`;
  if (s < 86400) return `${Math.floor(s / 3600)}h atrás`;
  return `${Math.floor(s / 86400)}d atrás`;
}

export default async function HealthPage() {
  let metrics: HealthMetrics;
  try {
    await requireRole('admin');
  } catch (e) {
    if (e instanceof RbacError) {
      return (
        <main className="page">
          <div className="card text-center py-16">
            <h1 className="text-xl font-semibold mb-2">Acesso restrito</h1>
            <p className="text-sm text-[rgb(var(--fg-muted))]">Essa página é só pra admins do workspace.</p>
          </div>
        </main>
      );
    }
    throw e;
  }
  try {
    metrics = await getMetrics();
  } catch (e) {
    return (
      <main className="page">
        <div className="card text-center py-16">
          <h1 className="text-xl font-semibold mb-2">Erro carregando métricas</h1>
          <p className="text-sm text-[rgb(var(--fg-muted))]">{(e as Error).message}</p>
        </div>
      </main>
    );
  }

  const deliveryPct = Math.round(metrics.emailDeliveryRate * 100);
  const errorTone = metrics.errors24h === 0 ? 'success' : metrics.errors24h < 10 ? 'warning' : 'danger';

  return (
    <main className="page">
      <PageHeader
        title="Saúde da plataforma"
        subtitle={`Métricas em tempo real · refresh manual com cmd+R · última atualização ${new Date().toLocaleTimeString('pt-BR')}`}
        badge={<span className="badge badge-brand">admin</span>}
        actions={
          <a href="/admin/health" className="btn-secondary btn-sm">↻ Refresh</a>
        }
      />

      {/* Linha 1: KPIs gerais */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <Stat label="Signups · 24h" value={metrics.signupsLast24h} sub={`${metrics.signupsLast7d} nos últimos 7d`} />
        <Stat label="Certs · 24h" value={metrics.certsLast24h} sub={`${metrics.certsLast7d} nos últimos 7d`} />
        <Stat label="Na fila agora" value={metrics.pendingNow} sub={metrics.pendingNow > 0 ? 'aguardando aprovação' : 'fila limpa'} />
        <Stat label="Workspaces" value={metrics.workspacesTotal} sub="total ativos" />
      </section>

      {/* Linha 2: Errors + Emails + Verify */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        <div className="stat-card">
          <div className="stat-label">Erros · 24h</div>
          <div className={`stat-value ${errorTone === 'danger' ? 'text-[rgb(var(--danger))]' : errorTone === 'warning' ? 'text-[rgb(var(--warning))]' : 'text-[rgb(var(--success))]'}`}>
            {metrics.errors24h}
          </div>
          <div className="stat-hint">{metrics.errors24h === 0 ? '✓ tudo limpo' : 'ver detalhes abaixo'}</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Emails · 24h</div>
          <div className="stat-value font-num">
            {metrics.emailsSent24h}
            {metrics.emailsFailed24h > 0 && (
              <span className="text-base text-[rgb(var(--danger))] font-normal ml-2">
                / {metrics.emailsFailed24h} falhas
              </span>
            )}
          </div>
          <div className="stat-hint">
            <span className={deliveryPct >= 95 ? 'text-[rgb(var(--success))]' : deliveryPct >= 80 ? 'text-[rgb(var(--warning))]' : 'text-[rgb(var(--danger))]'}>
              {deliveryPct}% delivery rate
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Verificações · 24h</div>
          <div className="stat-value">{metrics.verifyViews24h.toLocaleString('pt-BR')}</div>
          <div className="stat-hint">views nas páginas /v/&lt;id&gt;</div>
        </div>
      </section>

      {/* Top error paths */}
      {metrics.errorsTopPaths.length > 0 && (
        <section className="card mb-4">
          <h2 className="text-base font-semibold mb-3">Top rotas com erro · 24h</h2>
          <div className="space-y-1.5">
            {metrics.errorsTopPaths.map((p) => (
              <div key={p.path} className="flex items-center justify-between gap-3 px-2 py-2 rounded-md hover:bg-[rgb(var(--surface-2))] transition">
                <code className="text-xs font-mono text-[rgb(var(--fg))] truncate">{p.path}</code>
                <span className="text-sm font-num font-semibold text-[rgb(var(--danger))]">{p.count}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Errors recentes */}
        <section className="card">
          <h2 className="text-base font-semibold mb-3">Erros recentes</h2>
          {metrics.recentErrors.length === 0 ? (
            <div className="py-10 text-center">
              <div className="w-12 h-12 rounded-full bg-[rgb(var(--success-soft))] flex items-center justify-center mx-auto mb-3">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-[rgb(var(--success))]">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <p className="text-sm text-[rgb(var(--fg-muted))]">Nenhum erro registrado.</p>
            </div>
          ) : (
            <ul className="space-y-1 max-h-96 overflow-auto -mx-2 px-2">
              {metrics.recentErrors.map((e) => (
                <li key={e.id} className="px-2 py-2 rounded-md hover:bg-[rgb(var(--surface-2))]">
                  <div className="flex items-center justify-between gap-2">
                    <code className="text-xs font-mono truncate">{e.path}</code>
                    <span className="text-[10px] text-[rgb(var(--fg-subtle))] font-num shrink-0">{ago(e.occurredAt)}</span>
                  </div>
                  {e.errorMessage && (
                    <p className="text-xs text-[rgb(var(--danger))] mt-0.5 line-clamp-2">{e.errorMessage}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Emails recentes */}
        <section className="card">
          <h2 className="text-base font-semibold mb-3">Emails recentes</h2>
          {metrics.recentEmails.length === 0 ? (
            <div className="py-10 text-center">
              <div className="w-12 h-12 rounded-full bg-[rgb(var(--surface-2))] flex items-center justify-center mx-auto mb-3">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[rgb(var(--fg-subtle))]">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </div>
              <p className="text-sm text-[rgb(var(--fg-muted))] mb-1">Nenhum email enviado ainda.</p>
              <p className="text-xs text-[rgb(var(--fg-subtle))]">Configure workflows pra disparar.</p>
            </div>
          ) : (
            <ul className="space-y-1 max-h-96 overflow-auto -mx-2 px-2">
              {metrics.recentEmails.map((e) => (
                <li key={e.id} className="px-2 py-2 rounded-md hover:bg-[rgb(var(--surface-2))]">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs truncate flex-1">{e.recipientEmail}</span>
                    <StatusBadge status={e.status} />
                  </div>
                  {e.subject && (
                    <p className="text-[11px] text-[rgb(var(--fg-muted))] mt-0.5 truncate">{e.subject}</p>
                  )}
                  <p className="text-[10px] text-[rgb(var(--fg-subtle))] mt-0.5 font-num">{ago(e.createdAt)}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}

function Stat({ label, value, sub }: { label: string; value: number | string; sub?: string }) {
  return (
    <div className="stat-card animate-slide-up">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{typeof value === 'number' ? value.toLocaleString('pt-BR') : value}</div>
      {sub && <div className="stat-hint">{sub}</div>}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    sent: 'badge-success',
    queued: 'badge-neutral',
    failed: 'badge-danger',
    bounced: 'badge-danger',
    opened: 'badge-brand',
    clicked: 'badge-brand',
  };
  return <span className={`badge ${map[status] ?? 'badge-neutral'}`}>{status}</span>;
}
