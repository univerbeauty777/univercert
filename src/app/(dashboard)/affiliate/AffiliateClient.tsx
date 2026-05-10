'use client';

import { useEffect, useState } from 'react';

type Affiliate = {
  id: string; code: string; tier: string; commissionPct: number;
  totalSignups: number; totalPayingReferred: number;
  totalCommissionBrlCents: number; totalPaidBrlCents: number;
};

type Referral = {
  id: string; status: string; source: string | null;
  firstPaymentAt: number | null; totalPaidByReferredBrlCents: number;
  commissionEarnedBrlCents: number; createdAt: number;
};

const fmt = (c: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(c / 100);

export default function AffiliateClient() {
  const [aff, setAff] = useState<Affiliate | null>(null);
  const [refs, setRefs] = useState<Referral[]>([]);
  const [trackUrl, setTrackUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/v1/affiliate');
      const d = await r.json();
      if (d.ok) {
        setAff(d.affiliate);
        setRefs(d.referrals ?? []);
        setTrackUrl(d.trackUrl ?? '');
      } else setError(d.error);
    } catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  };

  useEffect(() => { reload(); }, []);

  const handleCreate = async () => {
    setCreating(true); setError(null);
    try {
      const r = await fetch('/api/v1/affiliate', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ code }) });
      const d = await r.json();
      if (d.ok) { setCode(''); await reload(); } else setError(d.error);
    } catch (e) { setError((e as Error).message); }
    finally { setCreating(false); }
  };

  if (loading) return <div className="card text-center py-12 text-sm text-[rgb(var(--fg-muted))]">Carregando…</div>;

  if (!aff) {
    return (
      <div className="card" style={{ padding: 32 }}>
        <h2 className="text-lg font-bold mb-2">Ative seu código de afiliado</h2>
        <p className="text-sm text-[rgb(var(--fg-muted))] mb-4">
          Indique escolas pra UniverCert e ganhe <strong>10%</strong> de comissão recorrente nas mensalidades pagas.
          Programa Educator (creators com audiência): <strong>20%</strong>. <a href="/partner/apply" className="text-primary">Aplicar</a>.
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="text" placeholder="seu-codigo (ex: liso-blindado)" value={code}
            onChange={(e) => setCode(e.target.value)}
            className="input" style={{ flex: 1 }}
          />
          <button onClick={handleCreate} disabled={!code.trim() || creating} className="btn-primary btn-sm" style={{ borderRadius: 10 }}>
            {creating ? 'Ativando…' : 'Ativar'}
          </button>
        </div>
        {error && <div className="text-sm text-[rgb(var(--danger))] mt-3">⚠ {error}</div>}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {error && <div className="card text-sm text-[rgb(var(--danger))]">⚠ {error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
        <Kpi label="Comissão acumulada" value={fmt(aff.totalCommissionBrlCents)} color="#10b981" />
        <Kpi label="Pago a você" value={fmt(aff.totalPaidBrlCents)} color="#06B6D4" />
        <Kpi label="Signups" value={String(aff.totalSignups)} color="#8b5cf6" />
        <Kpi label="Pagantes" value={String(aff.totalPayingReferred)} color="#f59e0b" />
      </div>

      <div className="card" style={{ padding: 24 }}>
        <h3 className="text-sm font-bold mb-3">Seu link de indicação</h3>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', background: '#0f172a', color: '#fff', padding: 12, borderRadius: 8, fontFamily: 'monospace', fontSize: 12 }}>
          <code style={{ flex: 1, wordBreak: 'break-all' }}>{trackUrl}</code>
          <button onClick={() => navigator.clipboard.writeText(trackUrl)} style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 6, cursor: 'pointer', fontSize: 11 }}>Copiar</button>
        </div>
        <p className="text-xs text-[rgb(var(--fg-muted))] mt-3">
          Tier: <strong>{aff.tier}</strong> · Comissão: <strong>{aff.commissionPct}%</strong> recorrente · Cookie 60 dias.
        </p>
      </div>

      {refs.length > 0 && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <h3 style={{ padding: '14px 20px', borderBottom: '1px solid rgb(var(--border))', fontSize: 14, fontWeight: 700 }}>Indicações</h3>
          <table style={{ width: '100%', fontSize: 13 }}>
            <thead style={{ background: 'rgb(var(--surface-2, 248 250 252))' }}>
              <tr style={{ fontSize: 11, color: 'rgb(var(--fg-muted))', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <th style={{ padding: '10px 16px', textAlign: 'left' }}>Data</th>
                <th style={{ padding: '10px 16px', textAlign: 'center' }}>Status</th>
                <th style={{ padding: '10px 16px', textAlign: 'right' }}>Pagou</th>
                <th style={{ padding: '10px 16px', textAlign: 'right' }}>Sua comissão</th>
                <th style={{ padding: '10px 16px', textAlign: 'left' }}>Fonte</th>
              </tr>
            </thead>
            <tbody>
              {refs.map((r) => (
                <tr key={r.id} style={{ borderTop: '1px solid rgb(var(--border))' }}>
                  <td style={{ padding: '10px 16px' }}>{new Date(r.createdAt * 1000).toLocaleDateString('pt-BR')}</td>
                  <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                    <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                      background: r.status === 'paying' ? 'rgba(16,185,129,0.1)' : r.status === 'churned' ? 'rgba(239,68,68,0.1)' : 'rgba(99,102,241,0.1)',
                      color: r.status === 'paying' ? '#059669' : r.status === 'churned' ? '#dc2626' : '#1B2D5E' }}>{r.status}</span>
                  </td>
                  <td style={{ padding: '10px 16px', textAlign: 'right', fontFamily: 'monospace' }}>{fmt(r.totalPaidByReferredBrlCents)}</td>
                  <td style={{ padding: '10px 16px', textAlign: 'right', fontFamily: 'monospace', color: '#10b981', fontWeight: 600 }}>{fmt(r.commissionEarnedBrlCents)}</td>
                  <td style={{ padding: '10px 16px', fontSize: 12, color: 'rgb(var(--fg-muted))' }}>{r.source ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Kpi({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="card" style={{ padding: 18 }}>
      <div className="text-xs uppercase font-bold text-[rgb(var(--fg-muted))]">{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color, marginTop: 4 }}>{value}</div>
    </div>
  );
}
