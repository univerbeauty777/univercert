'use client';

import { useState, useTransition } from 'react';
import { addDomainAction, removeDomainAction } from './actions';

export default function DomainWizard({
  workspaceId,
  currentDomain,
  fallbackHost,
}: {
  workspaceId: string;
  currentDomain: string | null;
  fallbackHost: string;
}) {
  const [domain, setDomain] = useState('');
  const [result, setResult] = useState<{ ok: boolean; msg: string; cname?: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleAdd = () => {
    setResult(null);
    startTransition(async () => {
      const res = await addDomainAction({ workspaceId, hostname: domain.trim() });
      if (res.ok) {
        setResult({
          ok: true,
          msg: `Domínio ${res.hostname} adicionado. Configure o DNS abaixo.`,
          cname: fallbackHost,
        });
      } else {
        setResult({ ok: false, msg: res.error });
      }
    });
  };

  const handleRemove = () => {
    if (!confirm('Remover domínio? Você perderá acesso via cert.suaescola.com.br.')) return;
    startTransition(async () => {
      await removeDomainAction({ workspaceId });
      window.location.reload();
    });
  };

  return (
    <div className="card">
      {currentDomain ? (
        <>
          <div className="flex items-center justify-between gap-3 mb-3">
            <div>
              <div className="text-xs uppercase tracking-wider text-gray-400 font-bold">Domínio atual</div>
              <div className="font-mono text-lg font-bold mt-1">{currentDomain}</div>
            </div>
            <button onClick={handleRemove} disabled={isPending} className="btn-secondary text-xs text-danger">
              Remover
            </button>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-xs">
            <p className="text-gray-500 font-bold uppercase tracking-wider mb-1">DNS necessário</p>
            <p>
              Tipo: <strong>CNAME</strong> · Nome: <code className="text-primary">{currentDomain.split('.')[0]}</code> · Valor: <code className="text-primary">{fallbackHost}</code>
            </p>
          </div>
        </>
      ) : (
        <>
          <label className="label">Domínio (ex: cert.universuaescola.com.br)</label>
          <div className="flex gap-2">
            <input
              type="text"
              className="input flex-1"
              placeholder="cert.suaescola.com.br"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              disabled={isPending}
            />
            <button onClick={handleAdd} disabled={isPending || !domain} className="btn-primary">
              {isPending ? '...' : 'Adicionar'}
            </button>
          </div>
        </>
      )}

      {result && (
        <div className={`mt-4 p-3 rounded-lg text-sm ${result.ok ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
          <div className="font-semibold">{result.ok ? '✓' : '✗'} {result.msg}</div>
          {result.ok && result.cname && (
            <div className="mt-2 text-xs font-mono">
              CNAME → {result.cname}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
