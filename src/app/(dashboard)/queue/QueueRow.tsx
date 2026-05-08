'use client';

// Linha da fila com botões interativos. Client Component porque usa useTransition + estado.

import { useState, useTransition } from 'react';
import { approveRequestAction, rejectRequestAction } from './actions';

type Props = {
  request: {
    id: string;
    courseName: string | null;
    source: string;
    createdAt: number;
  };
  recipient: {
    name: string | null;
    email: string | null;
  } | null;
};

export default function QueueRow({ request, recipient }: Props) {
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);
  const [showReject, setShowReject] = useState(false);
  const [reason, setReason] = useState('');

  const handleApprove = () => {
    startTransition(async () => {
      const result = await approveRequestAction(request.id);
      if (result.ok) {
        setFeedback({
          ok: true,
          msg: result.alreadyEmitted
            ? 'Já estava emitido'
            : `Aprovado · ${result.credentialId.slice(0, 16)}…`,
        });
      } else {
        setFeedback({ ok: false, msg: result.error });
      }
    });
  };

  const handleReject = (formData: FormData) => {
    formData.set('reason', reason || 'Sem motivo informado');
    startTransition(async () => {
      const result = await rejectRequestAction(request.id, formData);
      if (result.ok) {
        setFeedback({ ok: true, msg: 'Rejeitado' });
      } else {
        setFeedback({ ok: false, msg: result.error });
      }
      setShowReject(false);
    });
  };

  if (feedback) {
    return (
      <tr className="border-t border-gray-100">
        <td className="px-4 py-3" colSpan={5}>
          <div
            className={`text-sm font-medium ${
              feedback.ok ? 'text-success' : 'text-danger'
            }`}
          >
            {feedback.ok ? '✓ ' : '✗ '}
            {feedback.msg}
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-t border-gray-100 hover:bg-gray-50">
      <td className="px-4 py-3">
        <div className="font-semibold">{recipient?.name ?? '(sem nome)'}</div>
        <div className="text-xs text-gray-500">{recipient?.email ?? '—'}</div>
      </td>
      <td className="px-4 py-3">{request.courseName ?? '(sem curso)'}</td>
      <td className="px-4 py-3 text-xs">
        <span className="inline-block px-2 py-1 bg-primary/10 text-primary rounded font-bold uppercase">
          {request.source}
        </span>
      </td>
      <td className="px-4 py-3 text-xs text-gray-500">
        {new Date(request.createdAt * 1000).toLocaleString('pt-BR')}
      </td>
      <td className="px-4 py-3 text-right">
        {showReject ? (
          <form action={handleReject} className="flex gap-2 items-center justify-end">
            <input
              type="text"
              placeholder="Motivo (opcional)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="input text-xs px-2 py-1 max-w-[200px]"
              disabled={isPending}
            />
            <button
              type="submit"
              disabled={isPending}
              className="btn text-xs px-3 py-1.5 bg-danger text-white rounded-lg hover:opacity-90 disabled:opacity-50"
            >
              {isPending ? '...' : 'Confirmar'}
            </button>
            <button
              type="button"
              onClick={() => setShowReject(false)}
              disabled={isPending}
              className="btn-secondary text-xs px-3 py-1.5"
            >
              Cancelar
            </button>
          </form>
        ) : (
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setShowReject(true)}
              disabled={isPending}
              className="btn-secondary text-xs px-3 py-1.5"
            >
              Rejeitar
            </button>
            <button
              onClick={handleApprove}
              disabled={isPending}
              className="btn-primary text-xs px-3 py-1.5"
            >
              {isPending ? 'Emitindo...' : 'Aprovar'}
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}
