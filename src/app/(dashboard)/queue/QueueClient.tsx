'use client';

import { useState, useTransition } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { approveRequestAction, rejectRequestAction, bulkApproveAction, requestRevisionAction } from './actions';
import PageHeader from '@/components/PageHeader';
import StatsBar from '@/components/StatsBar';
import EmptyState from '@/components/EmptyState';

type RequestRow = {
  id: string;
  courseName: string | null;
  courseHours: number | null;
  source: string;
  status: string;
  rejectionReason: string | null;
  createdAt: number;
  recipientName: string | null;
  recipientEmail: string | null;
  recipientCpf: string | null;
  extrasJson?: string | null;
  revisionsJson?: string | null;
  courseId?: string | null;
};

const STATUS_BADGES: Record<string, { label: string; cls: string }> = {
  pending: { label: 'Pendente', cls: 'badge-warning' },
  needs_revision: { label: 'Revisão', cls: 'badge-warning' },
  approved: { label: 'Aprovado', cls: 'badge-success' },
  rejected: { label: 'Rejeitado', cls: 'badge-danger' },
  emitted: { label: 'Emitido', cls: 'badge-primary' },
};

const SOURCE_ICON: Record<string, string> = { form: '📝', webhook: '🔌', manual: '✋', csv: '📊' };

export default function QueueClient({
  requests, currentStatus, currentSource, currentSearch, counts,
}: {
  requests: RequestRow[];
  currentStatus: string;
  currentSource: string;
  currentSearch: string;
  counts: Record<string, number>;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const [searchInput, setSearchInput] = useState(currentSearch);

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams.toString());
    if (value && value !== 'all' && value !== '') next.set(key, value); else next.delete(key);
    router.push(`${pathname}?${next.toString()}`);
  };

  const toggleSelect = (id: string) => {
    setSelected((s) => { const ns = new Set(s); if (ns.has(id)) ns.delete(id); else ns.add(id); return ns; });
  };
  const toggleSelectAll = () => {
    if (selected.size === requests.length) setSelected(new Set());
    else setSelected(new Set(requests.map((r) => r.id)));
  };

  const handleApprove = (id: string) => {
    startTransition(async () => {
      const result = await approveRequestAction(id);
      setFeedback({ ok: result.ok, msg: result.ok ? `Aprovado: ${result.credentialId?.slice(0, 16)}…` : result.error });
      if (result.ok) router.refresh();
    });
  };
  const handleReject = (id: string) => {
    const reason = prompt('Motivo da rejeição (opcional):');
    if (reason === null) return;
    const fd = new FormData(); fd.set('reason', reason || 'Sem motivo informado');
    startTransition(async () => {
      const result = await rejectRequestAction(id, fd);
      setFeedback({ ok: result.ok, msg: result.ok ? 'Rejeitado' : result.error });
      if (result.ok) router.refresh();
    });
  };
  const handleRevise = (id: string) => {
    const comment = prompt('O que precisa ser corrigido? (Esse texto vai pro email do aluno)');
    if (!comment || !comment.trim()) return;
    startTransition(async () => {
      const r = await requestRevisionAction(id, comment);
      setFeedback({ ok: r.ok, msg: r.ok ? 'Revisão pedida · email enviado' : r.error });
      if (r.ok) router.refresh();
    });
  };
  const handleBulkApprove = () => {
    if (selected.size === 0) return;
    if (!confirm(`Aprovar ${selected.size} solicitação(ões) de uma vez?`)) return;
    startTransition(async () => {
      const result = await bulkApproveAction(Array.from(selected));
      setFeedback({ ok: result.ok, msg: `${result.approved} aprovados · ${result.failed} falharam` });
      setSelected(new Set()); router.refresh();
    });
  };
  const onSearchSubmit = (e: React.FormEvent) => { e.preventDefault(); updateParam('q', searchInput); };

  const STATUS_TABS = [
    { id: 'pending', label: 'Pendentes', count: counts.pending ?? 0, icon: '⏳' },
    { id: 'emitted', label: 'Emitidos', count: counts.emitted ?? 0, icon: '✓' },
    { id: 'rejected', label: 'Rejeitados', count: counts.rejected ?? 0, icon: '✗' },
    { id: 'all', label: 'Tudo', count: Object.values(counts).reduce((a, b) => a + b, 0), icon: '◯' },
  ];

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-6">
      <div className="max-w-7xl mx-auto">
        <PageHeader
          icon="📋"
          title="Fila de aprovação"
          subtitle={`${requests.length} ${requests.length === 1 ? 'solicitação' : 'solicitações'}${currentSearch ? ` · buscando "${currentSearch}"` : ''}`}
          actions={selected.size > 0 ? (
            <>
              <span className="text-sm font-bold text-primary px-3 py-1.5 bg-primary-soft rounded-lg border border-primary/20">{selected.size} selecionado(s)</span>
              <button onClick={handleBulkApprove} disabled={isPending} className="btn-gradient text-sm">
                {isPending ? 'Emitindo...' : `Aprovar ${selected.size} em massa`}
              </button>
              <button onClick={() => setSelected(new Set())} className="btn-ghost text-sm">Cancelar</button>
            </>
          ) : null}
        />

        <StatsBar stats={[
          { label: 'Pendentes', value: counts.pending ?? 0, icon: '⏳', tone: 'warning' },
          { label: 'Emitidos', value: counts.emitted ?? 0, icon: '✓', tone: 'success' },
          { label: 'Rejeitados', value: counts.rejected ?? 0, icon: '✗', tone: 'danger' },
          { label: 'Total', value: Object.values(counts).reduce((a, b) => a + b, 0), icon: '📊', tone: 'primary' },
        ]} />

        <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1">
          {STATUS_TABS.map((t) => (
            <button key={t.id} onClick={() => updateParam('status', t.id)}
              className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
                currentStatus === t.id ? 'bg-gradient-to-r from-primary to-violet-600 text-white shadow-glow-primary' : 'bg-white text-ink-700 hover:bg-gray-50 border border-gray-200'
              }`}>
              <span className="text-xs">{t.icon}</span>
              {t.label}
              <span className={`text-xs font-mono ${currentStatus === t.id ? 'text-white/80' : 'text-ink-500'}`}>{t.count}</span>
            </button>
          ))}
        </div>

        <div className="card !p-4 mb-4 flex gap-3 flex-wrap items-center">
          <form onSubmit={onSearchSubmit} className="flex gap-2 flex-1 min-w-[240px] relative">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-3.5 top-3.5 text-ink-500 pointer-events-none">
              <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
            </svg>
            <input type="text" placeholder="Buscar nome, email ou curso..." className="input pl-10" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
            <button type="submit" className="btn-secondary text-sm">Buscar</button>
          </form>
          <select className="input max-w-[180px]" value={currentSource} onChange={(e) => updateParam('source', e.target.value)}>
            <option value="all">Todas origens</option>
            <option value="form">📝 Form</option>
            <option value="webhook">🔌 Webhook</option>
            <option value="manual">✋ Manual</option>
            <option value="csv">📊 CSV</option>
          </select>
        </div>

        {feedback && (
          <div className={`mb-4 p-3 rounded-xl text-sm font-medium animate-slide-up flex items-center gap-2 ${
            feedback.ok ? 'bg-success/10 text-success border border-success/20' : 'bg-danger/10 text-danger border border-danger/20'
          }`}>
            <span className="font-bold">{feedback.ok ? '✓' : '✗'}</span> {feedback.msg}
          </div>
        )}

        {requests.length === 0 ? (
          <EmptyState icon="📭" title="Nenhuma solicitação aqui"
            description={currentStatus === 'pending' ? 'Quando alunos enviam o form ou plataforma dispara webhook, aparece aqui.' : 'Tente outro filtro acima.'}
            cta={currentStatus === 'pending' ? { label: 'Configurar integrações', href: '/integrations' } : undefined} />
        ) : (
          <div className="card !p-0 overflow-hidden animate-fade-in stagger-2">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50/50 text-[10px] uppercase tracking-widest text-ink-500 font-bold">
                  <tr>
                    <th className="px-4 py-3 w-10">
                      <input type="checkbox" checked={selected.size === requests.length && requests.length > 0} onChange={toggleSelectAll} className="accent-primary" />
                    </th>
                    <th className="px-4 py-3 text-left">Aluno</th>
                    <th className="px-4 py-3 text-left">Curso</th>
                    <th className="px-4 py-3 text-left">Origem</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-left">Solicitado</th>
                    <th className="px-4 py-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((r) => {
                    const badge = STATUS_BADGES[r.status] ?? STATUS_BADGES.pending;
                    const extras = parseJSON(r.extrasJson);
                    const revisions = parseJSON(r.revisionsJson) ?? [];
                    const hasExtras = extras && Object.keys(extras).length > 0;
                    const isExpanded = expandedId === r.id;
                    return (
                      <>
                      <tr key={r.id} className={`border-t border-gray-100 hover:bg-primary-soft/40 transition ${selected.has(r.id) ? 'bg-primary-soft/60' : ''}`}>
                        <td className="px-4 py-3">
                          <input type="checkbox" checked={selected.has(r.id)} onChange={() => toggleSelect(r.id)} disabled={r.status !== 'pending'} className="accent-primary disabled:opacity-30" />
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-bold text-ink-900 flex items-center gap-2 flex-wrap">
                            {r.recipientName ?? '(sem nome)'}
                            {hasExtras && (
                              <button
                                onClick={() => setExpandedId(isExpanded ? null : r.id)}
                                className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 hover:bg-amber-200 transition"
                                title="Ver fotos/vídeos enviados"
                              >
                                {isExpanded ? '▾' : '▸'} {Object.keys(extras).length} extra{Object.keys(extras).length > 1 ? 's' : ''}
                              </button>
                            )}
                            {revisions.length > 0 && (
                              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700" title={`${revisions.length} revisão(ões)`}>↺ {revisions.length}</span>
                            )}
                          </div>
                          <div className="text-xs text-ink-500">{r.recipientEmail ?? '—'}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-ink-700">{r.courseName ?? '—'}</div>
                          {r.courseHours && <div className="text-xs text-ink-500">{r.courseHours}h</div>}
                        </td>
                        <td className="px-4 py-3 text-xs">
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-ink-700 rounded-lg font-bold uppercase tracking-wider">
                            <span>{SOURCE_ICON[r.source] ?? '◯'}</span>{r.source}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center"><span className={badge.cls}>{badge.label}</span></td>
                        <td className="px-4 py-3 text-xs text-ink-500">{new Date(r.createdAt * 1000).toLocaleString('pt-BR')}</td>
                        <td className="px-4 py-3 text-right">
                          {(r.status === 'pending' || r.status === 'needs_revision') ? (
                            <div className="flex gap-1.5 justify-end">
                              {hasExtras && (
                                <button onClick={() => handleRevise(r.id)} disabled={isPending} className="text-xs text-orange-700 hover:text-white hover:bg-orange-600 px-3 py-1.5 rounded-lg border border-orange-300 transition font-medium" title="Pedir correção e enviar email pro aluno">
                                  ↺ Revisar
                                </button>
                              )}
                              <button onClick={() => handleReject(r.id)} disabled={isPending} className="text-xs text-ink-500 hover:text-danger px-3 py-1.5 rounded-lg hover:bg-danger-soft transition font-medium">Rejeitar</button>
                              <button onClick={() => handleApprove(r.id)} disabled={isPending} className="btn-primary text-xs px-3 py-1.5">Aprovar</button>
                            </div>
                          ) : (
                            <div className="flex gap-3 justify-end items-center text-xs">
                              {r.rejectionReason && <span className="text-danger truncate max-w-[160px]" title={r.rejectionReason}>{r.rejectionReason}</span>}
                              <span className="font-mono text-ink-500/70">{r.id.slice(0, 12)}…</span>
                            </div>
                          )}
                        </td>
                      </tr>

                      {isExpanded && hasExtras && (
                        <tr key={r.id + '-expanded'} className="border-t border-gray-100 bg-gray-50">
                          <td colSpan={7} className="px-4 py-4">
                            <ExtrasView extras={extras} />
                            {revisions.length > 0 && (
                              <div className="mt-4 pt-4 border-t border-gray-200">
                                <h4 className="text-[10px] uppercase tracking-wider font-semibold text-ink-500 mb-2">Histórico de revisões ({revisions.length})</h4>
                                <ul className="space-y-1.5">
                                  {revisions.map((rev: any, i: number) => (
                                    <li key={i} className="text-xs text-ink-700">
                                      <span className="text-orange-600 font-medium">↺ {rev.action}</span>
                                      {' · '}
                                      <span className="text-ink-500">{new Date(rev.at * 1000).toLocaleString('pt-BR')}</span>
                                      {rev.comment && <div className="ml-5 mt-0.5 italic">"{rev.comment}"</div>}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

/* ---- helpers/components ---- */

function parseJSON(s: string | null | undefined): any {
  if (!s) return null;
  try { return JSON.parse(s); } catch { return null; }
}

function ExtrasView({ extras }: { extras: Record<string, any> }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {Object.entries(extras).map(([key, value]) => (
        <div key={key} className="bg-white border border-gray-200 rounded-lg p-3">
          <div className="text-[10px] uppercase tracking-wider font-semibold text-ink-500 mb-2">{key}</div>
          <ExtraValue value={value} />
        </div>
      ))}
    </div>
  );
}

function ExtraValue({ value }: { value: any }) {
  if (value == null) return <span className="text-xs text-ink-500">—</span>;
  // image_pair { before, after }
  if (typeof value === 'object' && (value.before || value.after)) {
    return (
      <div className="grid grid-cols-2 gap-2">
        {(['before', 'after'] as const).map((k) => (
          <div key={k}>
            <div className="text-[10px] uppercase text-ink-500 mb-1">{k === 'before' ? 'Antes' : 'Depois'}</div>
            {value[k] ? (
              <a href={`/api/v1/assets/${encodeURIComponent(value[k])}`} target="_blank" rel="noopener">
                <img src={`/api/v1/assets/${encodeURIComponent(value[k])}`} alt={k} className="w-full h-32 object-cover rounded border border-gray-200 hover:opacity-90" />
              </a>
            ) : <div className="h-32 bg-gray-100 rounded grid place-items-center text-xs text-ink-500">—</div>}
          </div>
        ))}
      </div>
    );
  }
  if (typeof value === 'string' && value.startsWith('workspaces/')) {
    return (
      <a href={`/api/v1/assets/${encodeURIComponent(value)}`} target="_blank" rel="noopener">
        <img src={`/api/v1/assets/${encodeURIComponent(value)}`} alt="" className="w-full max-h-48 object-cover rounded border border-gray-200 hover:opacity-90" />
      </a>
    );
  }
  if (typeof value === 'string' && /^(https?:\/\/)?(www\.)?(youtube|youtu|vimeo|loom|tiktok|instagram)/.test(value)) {
    return <a href={value} target="_blank" rel="noopener" className="text-primary text-sm underline break-all">▶ {value}</a>;
  }
  if (typeof value === 'string' && /^https?:\/\//.test(value)) {
    return <a href={value} target="_blank" rel="noopener" className="text-primary text-sm underline break-all">{value}</a>;
  }
  if (typeof value === 'string') {
    return <p className="text-sm text-ink-700 whitespace-pre-wrap break-words">{value}</p>;
  }
  if (typeof value === 'boolean') {
    return <span className={`badge ${value ? 'badge-success' : 'badge-neutral'}`}>{value ? 'Sim' : 'Não'}</span>;
  }
  return <code className="text-xs">{JSON.stringify(value)}</code>;
}
