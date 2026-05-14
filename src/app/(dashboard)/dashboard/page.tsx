// UniverCert · Visão geral GODMODE 2.0

import { eq, count, and, sql, desc } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { getDb } from '@/db/client';
import {
  credentials,
  certificateRequests,
  verifyLogs,
  workspaces,
  brandKits,
  templates,
  workspaceMembers,
} from '@/db/schema';
import { getCurrentSession } from '@/lib/rbac';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

async function loadData(workspaceId: string) {
  const db = getDb();
  const [ws] = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.id, workspaceId))
    .limit(1);
  if (!ws) return null;
  const wid = ws.id;
  const since24h = Math.floor(Date.now() / 1000) - 24 * 3600;

  const [
    [emitted],
    [pending],
    [emittedToday],
    [verifyCount],
    [tplCount],
    [memberCount],
    recent,
    [brand],
  ] = await Promise.all([
    db.select({ value: count() }).from(credentials).where(eq(credentials.workspaceId, wid)),
    db.select({ value: count() }).from(certificateRequests).where(and(eq(certificateRequests.workspaceId, wid), eq(certificateRequests.status, 'pending'))),
    db.select({ value: count() }).from(credentials).where(and(eq(credentials.workspaceId, wid), sql`${credentials.issuedAt} >= ${since24h}`)),
    db.select({ value: count() }).from(verifyLogs).leftJoin(credentials, eq(verifyLogs.credentialId, credentials.id)).where(eq(credentials.workspaceId, wid)),
    db.select({ value: count() }).from(templates).where(eq(templates.workspaceId, wid)),
    db.select({ value: count() }).from(workspaceMembers).where(eq(workspaceMembers.workspaceId, wid)),
    db.select().from(credentials).where(eq(credentials.workspaceId, wid)).orderBy(desc(credentials.issuedAt)).limit(5),
    db.select().from(brandKits).where(eq(brandKits.workspaceId, wid)).limit(1),
  ]);

  return {
    ws,
    stats: {
      emitted: emitted?.value ?? 0,
      pending: pending?.value ?? 0,
      emittedToday: emittedToday?.value ?? 0,
      verifyCount: verifyCount?.value ?? 0,
    },
    setup: {
      hasBrand: !!brand,
      hasCustomTpl: (tplCount?.value ?? 0) > 0,
      hasMembers: (memberCount?.value ?? 0) > 1,
      hasDomain: !!ws.customDomain,
      hasEmitted: (emitted?.value ?? 0) > 0,
    },
    recent,
  };
}

export default async function DashboardPage() {
  const sess = await getCurrentSession();
  if (!sess) redirect('/sign-in');
  const data = await loadData(sess.workspace.id);

  if (!data) {
    return (
      <main className="page">
        <div className="card text-center py-16">
          <p className="text-[rgb(var(--fg-muted))] text-sm">Workspace não encontrado.</p>
        </div>
      </main>
    );
  }

  const { ws, stats, setup, recent } = data;
  const setupSteps = [
    { key: 'brand', label: 'Personalizar cores e logo', href: '/templates', done: setup.hasBrand },
    { key: 'tpl', label: 'Criar 1º template customizado', href: '/templates/new', done: setup.hasCustomTpl },
    { key: 'integrations', label: 'Conectar Hotmart / Memberkit / Fluent', href: '/integrations', done: false },
    { key: 'team', label: 'Convidar 1º membro pra equipe', href: '/team', done: setup.hasMembers },
    { key: 'domain', label: 'Configurar domínio próprio', href: '/domain', done: setup.hasDomain },
    { key: 'first', label: 'Emitir 1º certificado', href: '/queue', done: setup.hasEmitted },
  ];
  const setupDone = setupSteps.filter((s) => s.done).length;
  const setupTotal = setupSteps.length;
  const setupPct = Math.round((setupDone / setupTotal) * 100);

  return (
    <main className="page">
      {/* Header */}
      <header className="page-header">
        <div>
          <h1 className="page-title">Visão geral</h1>
          <p className="page-subtitle">
            {ws.name} ·{' '}
            <span className="font-num">{stats.emitted.toLocaleString('pt-BR')}</span>{' '}
            certificados emitidos
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a href="/queue" className="btn-secondary btn-sm">
            Fila
            {stats.pending > 0 && (
              <span className="badge badge-brand ml-1">{stats.pending}</span>
            )}
          </a>
          <a href="/credentials" className="btn-primary btn-sm">+ Emitir</a>
        </div>
      </header>

      {/* Stats grid */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label="Total emitidos" value={stats.emitted} hint="desde o início" />
        <StatCard label="Hoje" value={stats.emittedToday} hint="últimas 24h" delta={stats.emittedToday > 0 ? 'up' : undefined} />
        <StatCard label="Na fila" value={stats.pending} hint={stats.pending > 0 ? 'aguardando aprovação' : 'fila limpa'} />
        <StatCard label="Verificações" value={stats.verifyCount} hint="views totais" />
      </section>

      {/* Setup + Atividade */}
      <section className="grid lg:grid-cols-3 gap-4">
        {/* Setup checklist */}
        <div className="card lg:col-span-2 animate-slide-up stagger-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold">Configuração</h2>
              <p className="text-xs text-[rgb(var(--fg-muted))] mt-0.5">
                {setupDone === setupTotal ? 'Tudo pronto. ✦' : `${setupDone} de ${setupTotal} concluídos`}
              </p>
            </div>
            <div className="text-right">
              <div className="font-num text-2xl font-semibold leading-none">{setupPct}%</div>
            </div>
          </div>
          <div className="h-1.5 bg-[rgb(var(--surface-2))] rounded-full overflow-hidden mb-4">
            <div
              className="h-full bg-[rgb(var(--brand))] rounded-full transition-all duration-500"
              style={{ width: `${setupPct}%` }}
            />
          </div>
          <ul className="space-y-1">
            {setupSteps.map((s, i) => (
              <li key={s.key} className="animate-slide-up" style={{ animationDelay: `${(i + 3) * 40}ms` }}>
                <a
                  href={s.href}
                  className="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-[rgb(var(--surface-2))] transition group"
                >
                  <CheckCircle done={s.done} />
                  <span
                    className={`text-sm flex-1 ${s.done ? 'text-[rgb(var(--fg-muted))] line-through' : 'text-[rgb(var(--fg))]'}`}
                  >
                    {s.label}
                  </span>
                  <span className="text-[rgb(var(--fg-subtle))] text-xs opacity-0 group-hover:opacity-100 transition">
                    →
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Atividade recente */}
        <div className="card animate-slide-up stagger-3">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold">Atividade recente</h2>
            <a href="/credentials" className="text-xs text-[rgb(var(--fg-muted))] hover:text-[rgb(var(--brand))] transition">
              Ver tudo →
            </a>
          </div>
          {recent.length === 0 ? (
            <div className="text-center py-10">
              <div className="w-12 h-12 rounded-full bg-[rgb(var(--surface-2))] flex items-center justify-center mx-auto mb-3">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[rgb(var(--fg-subtle))]">
                  <circle cx="12" cy="8" r="6" />
                  <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
                </svg>
              </div>
              <p className="text-sm text-[rgb(var(--fg-muted))] mb-1">Nenhum cert emitido ainda</p>
              <p className="text-xs text-[rgb(var(--fg-subtle))] mb-4">Os primeiros aparecem aqui.</p>
              <a href="/queue" className="btn-secondary btn-sm">Ver fila</a>
            </div>
          ) : (
            <ul className="space-y-2">
              {recent.map((c) => (
                <li key={c.id} className="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-[rgb(var(--surface-2))] transition">
                  <div className="avatar shrink-0">
                    {(c.recipientName ?? '?').slice(0, 1).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm truncate">{c.recipientName ?? c.recipientEmail ?? '—'}</div>
                    <div className="text-[11px] text-[rgb(var(--fg-subtle))] truncate">{c.courseName ?? c.id}</div>
                  </div>
                  <a href={`/v/${c.id}`} target="_blank" rel="noopener" className="text-[11px] text-[rgb(var(--fg-muted))] hover:text-[rgb(var(--brand))] transition">
                    abrir
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </main>
  );
}

/* ------------------------------------------------------------------------- */

function StatCard({
  label,
  value,
  hint,
  delta,
}: {
  label: string;
  value: number;
  hint?: string;
  delta?: 'up' | 'down';
}) {
  return (
    <div className="stat-card animate-slide-up stagger-1">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value.toLocaleString('pt-BR')}</div>
      {hint && (
        <div className={`stat-hint ${delta === 'up' ? 'stat-delta-up' : delta === 'down' ? 'stat-delta-down' : ''}`}>
          {delta === 'up' && '↑ '}
          {delta === 'down' && '↓ '}
          {hint}
        </div>
      )}
    </div>
  );
}

function CheckCircle({ done }: { done: boolean }) {
  return done ? (
    <span className="w-5 h-5 rounded-full bg-[rgb(var(--brand))] flex items-center justify-center shrink-0 animate-spring">
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    </span>
  ) : (
    <span className="w-5 h-5 rounded-full border-2 border-[rgb(var(--border-strong))] shrink-0" />
  );
}
