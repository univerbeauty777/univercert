'use client';

// UniverCert · Queue row com expand de extras (S22)

import { useState, useTransition } from 'react';
import { approveRequestAction, rejectRequestAction, requestRevisionAction } from './actions';

type Props = {
  request: {
    id: string;
    courseName: string | null;
    source: string;
    status?: string | null;
    createdAt: number;
    extrasJson?: string | null;
    revisionsJson?: string | null;
  };
  recipient: {
    name: string | null;
    email: string | null;
  } | null;
};

export default function QueueRow({ request, recipient }: Props) {
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);
  const [mode, setMode] = useState<'idle' | 'reject' | 'revise' | 'expanded'>('idle');
  const [reason, setReason] = useState('');
  const [revComment, setRevComment] = useState('');

  const extras = parseJSON(request.extrasJson);
  const revisions = parseJSON(request.revisionsJson) ?? [];
  const hasExtras = extras && Object.keys(extras).length > 0;

  const handleApprove = () => {
    startTransition(async () => {
      const result = await approveRequestAction(request.id);
      if (result.ok) {
        setFeedback({ ok: true, msg: result.alreadyEmitted ? 'Já estava emitido' : `Aprovado · ${result.credentialId.slice(0, 16)}…` });
      } else {
        setFeedback({ ok: false, msg: result.error });
      }
    });
  };

  const handleReject = (formData: FormData) => {
    formData.set('reason', reason || 'Sem motivo informado');
    startTransition(async () => {
      const result = await rejectRequestAction(request.id, formData);
      setFeedback({ ok: result.ok, msg: result.ok ? 'Rejeitado' : result.error });
      setMode('idle');
    });
  };

  const handleRevise = () => {
    if (!revComment.trim()) { setFeedback({ ok: false, msg: 'Digite o comentário' }); return; }
    startTransition(async () => {
      const r = await requestRevisionAction(request.id, revComment);
      setFeedback({ ok: r.ok, msg: r.ok ? 'Revisão pedida · email enviado' : r.error });
      setMode('idle');
    });
  };

  if (feedback) {
    return (
      <tr className="border-t border-[rgb(var(--border))]">
        <td className="px-4 py-3" colSpan={5}>
          <div className={`text-sm font-medium ${feedback.ok ? 'text-[rgb(var(--success))]' : 'text-[rgb(var(--danger))]'}`}>
            {feedback.ok ? '✓ ' : '✗ '}{feedback.msg}
          </div>
        </td>
      </tr>
    );
  }

  return (
    <>
      <tr className="border-t border-[rgb(var(--border))] hover:bg-[rgb(var(--surface-2))]">
        <td className="px-4 py-3">
          <div className="font-semibold flex items-center gap-2">
            {recipient?.name ?? '(sem nome)'}
            {hasExtras && (
              <button
                onClick={() => setMode(mode === 'expanded' ? 'idle' : 'expanded')}
                className="badge badge-gold text-[10px]"
                title="Ver fotos/vídeos enviados"
              >
                {mode === 'expanded' ? '▾' : '▸'} {Object.keys(extras).length} extra{Object.keys(extras).length > 1 ? 's' : ''}
              </button>
            )}
            {revisions.length > 0 && (
              <span className="badge badge-warning text-[10px]" title={`${revisions.length} revisão(ões)`}>↺{revisions.length}</span>
            )}
          </div>
          <div className="text-xs text-[rgb(var(--fg-muted))]">{recipient?.email ?? '—'}</div>
        </td>
        <td className="px-4 py-3 text-sm">{request.courseName ?? '(sem curso)'}</td>
        <td className="px-4 py-3">
          <span className="badge badge-brand text-[10px]">{request.source}</span>
        </td>
        <td className="px-4 py-3 text-xs text-[rgb(var(--fg-muted))]">
          {new Date(request.createdAt * 1000).toLocaleString('pt-BR')}
        </td>
        <td className="px-4 py-3 text-right">
          {mode === 'reject' ? (
            <form action={handleReject} className="flex gap-2 items-center justify-end">
              <input type="text" placeholder="Motivo" value={reason} onChange={(e) => setReason(e.target.value)} className="input text-xs max-w-[200px]" disabled={isPending} />
              <button type="submit" disabled={isPending} className="btn-danger btn-sm">{isPending ? '...' : 'Confirmar rejeição'}</button>
              <button type="button" onClick={() => setMode('idle')} disabled={isPending} className="btn-ghost btn-sm">Cancelar</button>
            </form>
          ) : mode === 'revise' ? (
            <div className="flex gap-2 items-center justify-end">
              <input type="text" placeholder="O que precisa corrigir?" value={revComment} onChange={(e) => setRevComment(e.target.value)} className="input text-xs max-w-[280px]" disabled={isPending} />
              <button onClick={handleRevise} disabled={isPending || !revComment.trim()} className="btn-primary btn-sm">{isPending ? '...' : 'Pedir revisão'}</button>
              <button onClick={() => setMode('idle')} disabled={isPending} className="btn-ghost btn-sm">Cancelar</button>
            </div>
          ) : (
            <div className="flex gap-1.5 justify-end">
              {hasExtras && (
                <button onClick={() => setMode('revise')} disabled={isPending} className="btn-secondary btn-sm" title="Pedir correção e enviar email pro aluno">↺ Revisar</button>
              )}
              <button onClick={() => setMode('reject')} disabled={isPending} className="btn-secondary btn-sm">Rejeitar</button>
              <button onClick={handleApprove} disabled={isPending} className="btn-primary btn-sm">
                {isPending ? '…' : 'Aprovar'}
              </button>
            </div>
          )}
        </td>
      </tr>

      {/* Expanded details with extras */}
      {mode === 'expanded' && hasExtras && (
        <tr className="border-t border-[rgb(var(--border))] bg-[rgb(var(--surface-2))]">
          <td colSpan={5} className="px-4 py-4">
            <ExtrasView extras={extras} />
            {revisions.length > 0 && (
              <div className="mt-4 pt-4 border-t border-[rgb(var(--border))]">
                <h4 className="text-xs uppercase tracking-wider font-semibold text-[rgb(var(--fg-subtle))] mb-2">Histórico de revisões ({revisions.length})</h4>
                <ul className="space-y-1.5">
                  {revisions.map((r: any, i: number) => (
                    <li key={i} className="text-xs text-[rgb(var(--fg-muted))]">
                      <span className="text-[rgb(var(--warning))] font-medium">↺ {r.action}</span>
                      {' · '}
                      <span>{new Date(r.at * 1000).toLocaleString('pt-BR')}</span>
                      {r.comment && <div className="ml-5 text-[rgb(var(--fg))] mt-0.5">"{r.comment}"</div>}
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
}

function ExtrasView({ extras }: { extras: Record<string, any> }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {Object.entries(extras).map(([key, value]) => (
        <div key={key} className="bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded-md p-3">
          <div className="text-[10px] uppercase tracking-wider font-semibold text-[rgb(var(--fg-subtle))] mb-2">{key}</div>
          <ExtraValue value={value} />
        </div>
      ))}
    </div>
  );
}

function ExtraValue({ value }: { value: any }) {
  if (value == null) return <span className="text-xs text-[rgb(var(--fg-subtle))]">—</span>;
  // image_pair { before, after }
  if (typeof value === 'object' && (value.before || value.after)) {
    return (
      <div className="grid grid-cols-2 gap-2">
        {(['before', 'after'] as const).map((k) => (
          <div key={k}>
            <div className="text-[10px] uppercase text-[rgb(var(--fg-subtle))] mb-1">{k === 'before' ? 'Antes' : 'Depois'}</div>
            {value[k] ? (
              <a href={`/api/v1/assets/${encodeURIComponent(value[k])}`} target="_blank" rel="noopener">
                <img src={`/api/v1/assets/${encodeURIComponent(value[k])}`} alt={k} className="w-full h-32 object-cover rounded border border-[rgb(var(--border))] hover:opacity-90" />
              </a>
            ) : <div className="h-32 bg-[rgb(var(--surface-2))] rounded grid place-items-center text-xs text-[rgb(var(--fg-subtle))]">—</div>}
          </div>
        ))}
      </div>
    );
  }
  // R2 key (image/file)
  if (typeof value === 'string' && value.startsWith('workspaces/')) {
    return (
      <a href={`/api/v1/assets/${encodeURIComponent(value)}`} target="_blank" rel="noopener">
        <img src={`/api/v1/assets/${encodeURIComponent(value)}`} alt="" className="w-full max-h-48 object-cover rounded border border-[rgb(var(--border))] hover:opacity-90" />
      </a>
    );
  }
  // video URL
  if (typeof value === 'string' && /^(https?:\/\/)?(www\.)?(youtube|youtu|vimeo|loom|tiktok|instagram)/.test(value)) {
    return (
      <a href={value} target="_blank" rel="noopener" className="text-[rgb(var(--brand))] text-sm underline break-all">▶ {value}</a>
    );
  }
  // URL genérica
  if (typeof value === 'string' && /^https?:\/\//.test(value)) {
    return (
      <a href={value} target="_blank" rel="noopener" className="text-[rgb(var(--brand))] text-sm underline break-all">{value}</a>
    );
  }
  // Texto longo
  if (typeof value === 'string') {
    return <p className="text-sm text-[rgb(var(--fg))] whitespace-pre-wrap break-words">{value}</p>;
  }
  // Boolean
  if (typeof value === 'boolean') {
    return <span className={`badge ${value ? 'badge-success' : 'badge-neutral'}`}>{value ? 'Sim' : 'Não'}</span>;
  }
  return <code className="text-xs">{JSON.stringify(value)}</code>;
}

function parseJSON(s: string | null | undefined) {
  if (!s) return null;
  try { return JSON.parse(s); } catch { return null; }
}
