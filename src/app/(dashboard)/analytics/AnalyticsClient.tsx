'use client';

// UniverCert · Analytics Dashboard Client (S32)

import { useEffect, useState } from 'react';

type Data = {
  range: string;
  metrics: { sharesTotal: number; verifyCount: number; issuedInRange: number; pendingReqs: number };
  sharesByChannel: Array<{ channel: string; count: number }>;
  topCerts: Array<{ id: string; courseName: string; shares: number; issuedAt?: number }>;
};

const CHANNEL_META: Record<string, { label: string; color: string; icon: string }> = {
  linkedin: { label: 'LinkedIn', color: '#0A66C2', icon: '💼' },
  whatsapp: { label: 'WhatsApp', color: '#25D366', icon: '💬' },
  twitter: { label: 'X / Twitter', color: '#1DA1F2', icon: '🐦' },
  facebook: { label: 'Facebook', color: '#1877F2', icon: '👥' },
  email: { label: 'Email', color: '#64748b', icon: '✉' },
  wallet_apple: { label: 'Apple Wallet', color: '#000', icon: '🍎' },
  wallet_google: { label: 'Google Wallet', color: '#4285F4', icon: '📱' },
  direct: { label: 'Link copiado', color: '#10b981', icon: '🔗' },
  native_share: { label: 'Share nativo', color: '#8b5cf6', icon: '📲' },
};

export default function AnalyticsClient() {
  const [range, setRange] = useState<'7d' | '30d' | '90d' | '365d'>('30d');
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true); setError(null);
    fetch(`/api/v1/analytics/workspace?range=${range}`)
      .then((r) => r.json())
      .then((d) => { if (d.ok) setData(d); else setError(d.error ?? 'erro'); })
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, [range]);

  const maxShare = data ? Math.max(...data.sharesByChannel.map((s) => s.count), 1) : 1;

  return (
    <div className="space-y-5">
      {/* Range selector */}
      <div style={{ display: 'flex', gap: 8 }}>
        {(['7d', '30d', '90d', '365d'] as const).map((r) => (
          <button
            key={r} onClick={() => setRange(r)}
            className={`btn-sm ${range === r ? 'btn-primary' : 'btn-ghost'}`}
            style={{ borderRadius: 10 }}
          >
            {r === '7d' ? '7 dias' : r === '30d' ? '30 dias' : r === '90d' ? '90 dias' : '1 ano'}
          </button>
        ))}
      </div>

      {error && <div className="card text-sm text-[rgb(var(--danger))]">⚠ {error}</div>}
      {loading && <div className="card text-center py-12 text-sm text-[rgb(var(--fg-muted))]">Carregando…</div>}

      {data && !loading && (
        <>
          {/* KPI cards */}
          <div className="grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
            <KpiCard label="Certs emitidos" value={data.metrics.issuedInRange} icon="🏆" color="#10b981" />
            <KpiCard label="Verificações" value={data.metrics.verifyCount} icon="✓" color="#0ea5e9" />
            <KpiCard label="Shares totais" value={data.metrics.sharesTotal} icon="📤" color="#8b5cf6" />
            <KpiCard label="Pedidos pendentes" value={data.metrics.pendingReqs} icon="⏳" color="#f59e0b" />
          </div>

          {/* Shares por canal */}
          <div className="card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Shares por canal</h3>
            {data.sharesByChannel.length === 0 ? (
              <p className="text-sm text-[rgb(var(--fg-muted))]">Nenhum share nesse período. Diga aos alunos pra compartilhar 🤝</p>
            ) : (
              <div className="space-y-2">
                {data.sharesByChannel.sort((a, b) => b.count - a.count).map((s) => {
                  const meta = CHANNEL_META[s.channel] ?? { label: s.channel, color: '#64748b', icon: '•' };
                  const pct = (s.count / maxShare) * 100;
                  return (
                    <div key={s.channel} style={{ display: 'grid', gridTemplateColumns: '160px 1fr 60px', gap: 12, alignItems: 'center' }}>
                      <div style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span>{meta.icon}</span> <span>{meta.label}</span>
                      </div>
                      <div style={{ background: 'rgba(0,0,0,0.04)', borderRadius: 6, height: 18, overflow: 'hidden' }}>
                        <div style={{ background: meta.color, width: `${pct}%`, height: '100%', borderRadius: 6, transition: 'width 0.5s' }} />
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 600, textAlign: 'right' }}>{s.count.toLocaleString('pt-BR')}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Top certs */}
          <div className="card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Certificados mais compartilhados</h3>
            {data.topCerts.length === 0 ? (
              <p className="text-sm text-[rgb(var(--fg-muted))]">Sem dados ainda.</p>
            ) : (
              <ol style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 0, listStyle: 'none' }}>
                {data.topCerts.map((c, i) => (
                  <li key={c.id}>
                    <a href={`/v/${c.id}`} className="flex items-center gap-3 p-3 rounded-lg hover:bg-[rgb(var(--surface-2))] transition" style={{ textDecoration: 'none', color: 'inherit' }}>
                      <span style={{ width: 24, height: 24, borderRadius: '50%', background: i < 3 ? '#1B2D5E' : 'rgba(0,0,0,0.05)', color: i < 3 ? '#fff' : '#64748b', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>{i + 1}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.courseName}</div>
                        {c.issuedAt && <div style={{ fontSize: 11, color: 'rgb(var(--fg-muted))' }}>{new Date(c.issuedAt * 1000).toLocaleDateString('pt-BR')}</div>}
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#8b5cf6' }}>{c.shares} shares</div>
                    </a>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function KpiCard({ label, value, icon, color }: { label: string; value: number; icon: string; color: string }) {
  return (
    <div style={{ background: 'rgb(var(--surface))', border: '1px solid rgb(var(--border))', borderRadius: 14, padding: 18, display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: `${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{icon}</div>
      <div>
        <div style={{ fontSize: 22, fontWeight: 700, color: 'rgb(var(--fg))' }}>{value.toLocaleString('pt-BR')}</div>
        <div style={{ fontSize: 11, color: 'rgb(var(--fg-muted))', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{label}</div>
      </div>
    </div>
  );
}
