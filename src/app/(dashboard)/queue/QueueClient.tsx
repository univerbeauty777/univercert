'use client';

import { useState, useTransition } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { approveRequestAction, rejectRequestAction, bulkApproveAction } from './actions';

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
};

const STATUS_BADGES: Record<string, { label: string; cls: string }> = {
  pending: { label: 'Pendente', cls: 'bg-warning/10 text-warning' },
  approved: { label: 'Aprovado', cls: 'bg-success/10 text-success' },
  rejected: { label: 'Rejeitado', cls: 'bg-danger/10 text-danger' },
  emitted: { label: 'Emitido', cls: 'bg-primary/10 text-primary' },
};

export default function QueueClient({
  requests,
  currentStatus,
  currentSource,
  currentSearch,
  counts,
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
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const [searchInput, setSearchInput] = useState(currentSearch);

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams.toString());
    if (value && value !== 'all' && value !== '') next.set(key, value);
    else next.delete(key);
    router.push(`${pathname}?${next.toString()}`);
  };

  const toggleSelect = (id: string) => {
    setSelected((s) => {
      const ns = new Set(s);
      if (ns.has(id)) ns.delete(id);
      else ns.add(id);
      return ns;
    });
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
    const fd = new FormData();
    fd.set('reason', reason || 'Sem motivo informado');
    startTransition(async () => {
      const result = await rejectRequestAction(id, fd);
      setFeedback({ ok: result.ok, msg: result.ok ? 'Rejeitado' : result.error });
      if (result.ok) router.refresh();
    });
  };

  const handleBulkApprove = () => {
    if (selected.size === 0) return;
    if (!confirm(`Aprovar ${selected.size} solicitação(ões) de uma vez? Cada uma vai gerar credential com hash SHA-256.`)) return;
    startTransition(async () => {
      const result = await bulkApproveAction(Array.from(selected));
      setFeedback({
        ok: result.ok,
        msg: `${result.approved} aprovados · ${result.failed} falharam`,
      });
      setSelected(new Set());
      router.refresh();
    });
  };

  const onSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateParam('q', searchInput);
  };

  const STATUS_TABS = [
    { id: 'pending', label: 'Pendentes', count: counts.pending ?? 0 },
    { id: 'emitted', label: 'Emitidos', count: counts.emitted ?? 0 },
    { id: 'rejected', label: 'Rejeitados', count: counts.rejected ?? 0 },
    { id: 'all', label: 'Tudo', count: Object.values(counts).reduce((a, b) => a + b, 0) },
  ];

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-end mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">Fila de aprovação</h1>
            <p className="text-sm text-gray-500 mt-1">
              {requests.length} {requests.length === 1 ? 'solicitação' : 'solicitações'}
              {currentSearch && <> · buscando "{currentSearch}"</>}
            </p>
          </div>
          {selected.size > 0 && (
            <div className="flex gap-2 items-center bg-primary/5 border border-primary/20 rounded-xl px-4 py-2 animate-slide-up">
              <span className="text-sm font-bold text-primary">{selected.size} selecionado(s)</span>
              <button
                onClick={handleBulkApprove}
                disabled={isPending}
                className="btn-primary text-xs px-3 py-1.5"
              >
                {isPending ? 'Emitindo...' : `Aprovar ${selected.size}`}
              </button>
              <button onClick={() => setSelected(new Set())} className="text-xs text-gray-500 hover:text-gray-900 px-2">
                ✕
              </button>
            </div>
          )}
        </div>

        {/* Status tabs */}
        <div className="flex gap-1 mb-4 overflow-x-auto">
          {STATUS_TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => updateParam('status', t.id)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                currentStatus === t.id
                  ? 'bg-primary text-white shadow-md shadow-primary/30'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {t.label}
              <span className={`ml-2 text-xs ${currentStatus === t.id ? 'text-white/80' : 'text-gray-400'}`}>
                {t.count}
              </span>
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="card mb-4 flex gap-3 flex-wrap items-center">
          <form onSubmit={onSearchSubmit} className="flex gap-2 flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Buscar nome, email ou curso..."
              className="input flex-1"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            <button type="submit" className="btn-secondary text-xs">Buscar</button>
          </form>

          <select
            className="input max-w-[160px]"
            value={currentSource}
            onChange={(e) => updateParam('source', e.target.value)}
          >
            <option value="all">Todas origens</option>
            <option value="form">Form</option>
            <option value="webhook">Webhook</option>
            <option value="manual">Manual</option>
            <option value="csv">CSV</option>
          </select>
        </div>

        {feedback && (
          <div
            className={`mb-4 p-3 rounded-lg text-sm font-medium animate-slide-up ${
              feedback.ok ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
            }`}
          >
            {feedback.ok ? '✓ ' : '✗ '}
            {feedback.msg}
          </div>
        )}

        {/* Tabela */}
        {requests.length === 0 ? (
          <div className="card text-center py-16">
            <div className="text-5xl mb-4">📭</div>
            <p className="text-lg font-semibold">Nenhuma solicitação aqui</p>
            <p className="text-sm text-gray-500 mt-2">
              {currentStatus === 'pending'
                ? 'Quando alunos enviam o form ou plataforma dispara webhook, aparece aqui.'
                : 'Tente outro filtro acima.'}
            </p>
          </div>
        ) : (
          <div className="card p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="px-4 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={selected.size === requests.length && requests.length > 0}
                      onChange={toggleSelectAll}
                      className="accent-primary"
                    />
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
                  return (
                    <tr key={r.id} className={`border-t border-gray-100 hover:bg-primary/5 transition ${selected.has(r.id) ? 'bg-primary/5' : ''}`}>
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selected.has(r.id)}
                          onChange={() => toggleSelect(r.id)}
                          disabled={r.status !== 'pending'}
                          className="accent-primary disabled:opacity-30"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold">{r.recipientName ?? '(sem nome)'}</div>
                        <div className="text-xs text-gray-500">{r.recipientEmail ?? '—'}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{r.courseName ?? '—'}</div>
                        {r.courseHours && <div className="text-xs text-gray-500">{r.courseHours}h</div>}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 rounded font-bold uppercase">
                          {r.source}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${badge.cls}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {new Date(r.createdAt * 1000).toLocaleString('pt-BR')}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {r.status === 'pending' ? (
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => handleReject(r.id)}
                              disabled={isPending}
                              className="text-xs text-gray-500 hover:text-danger px-3 py-1.5 transition"
                            >
                              Rejeitar
                            </button>
                            <button
                              onClick={() => handleApprove(r.id)}
                              disabled={isPending}
                              className="btn-primary text-xs px-3 py-1.5"
                            >
                              Aprovar
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-3 justify-end items-center text-xs">
                            {r.rejectionReason && (
                              <span className="text-danger truncate max-w-[160px]" title={r.rejectionReason}>
                                {r.rejectionReason}
                              </span>
                            )}
                            <span className="font-mono text-gray-400">{r.id.slice(0, 12)}…</span>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
