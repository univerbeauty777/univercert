'use client';

import { useEffect, useState } from 'react';

type Item = {
  id: string; name: string; description: string | null;
  category: string; language: string; previewUrl: string | null;
  downloads: number; ratingAvg: number; ratingCount: number;
  status: string; isPremium: number; priceBrlCents: number;
};

const CATEGORY_LABELS: Record<string, string> = {
  all: 'Todos', beauty: 'Beleza', education: 'Educação', tech: 'Tech', sports: 'Esportes', mba: 'MBA', general: 'Geral',
};

export default function MarketplaceClient() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');
  const [q, setQ] = useState('');
  const [installing, setInstalling] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (category !== 'all') params.set('category', category);
    if (q) params.set('q', q);
    fetch(`/api/v1/marketplace?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => { if (d.ok) setItems(d.items); })
      .finally(() => setLoading(false));
  }, [category, q]);

  const install = async (id: string) => {
    setInstalling(id); setError(null);
    try {
      const r = await fetch(`/api/v1/marketplace/${id}/install`, { method: 'POST' });
      const d = await r.json();
      if (d.ok && d.openUrl) window.location.href = d.openUrl;
      else if (d.upgradeUrl) {
        if (confirm(`${d.error}\nIr pra /billing?`)) window.location.href = d.upgradeUrl;
      } else setError(d.message ?? d.error);
    } catch (e) { setError((e as Error).message); }
    finally { setInstalling(null); }
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px 60px' }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="text" placeholder="Buscar..." value={q} onChange={(e) => setQ(e.target.value)}
          style={{ flex: 1, minWidth: 200, padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.1)', fontSize: 14 }}
        />
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {Object.entries(CATEGORY_LABELS).map(([k, label]) => (
            <button key={k} onClick={() => setCategory(k)}
              style={{ padding: '8px 14px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.08)',
                background: category === k ? '#1B2D5E' : '#fff', color: category === k ? '#fff' : '#475569',
                fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {error && <div style={{ background: 'rgba(239,68,68,0.1)', color: '#dc2626', padding: 12, borderRadius: 8, marginBottom: 12, fontSize: 13 }}>⚠ {error}</div>}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>Carregando…</div>
      ) : items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>📦</div>
          <p style={{ fontSize: 14 }}>Sem templates nessa busca ainda.</p>
          <a href="/sign-up" style={{ display: 'inline-block', marginTop: 12, padding: '10px 20px', background: '#1B2D5E', color: '#fff', borderRadius: 10, textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>Criar conta + subir o seu</a>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
          {items.map((item) => (
            <div key={item.id} style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ aspectRatio: '4/3', background: item.previewUrl ? `url(${item.previewUrl}) center/cover` : 'linear-gradient(135deg, #1B2D5E, #06B6D4)', position: 'relative' }}>
                {item.status === 'featured' && <span style={{ position: 'absolute', top: 10, left: 10, background: '#D4A937', color: '#0A0E1A', padding: '3px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700 }}>⭐ FEATURED</span>}
                {item.isPremium === 1 && <span style={{ position: 'absolute', top: 10, right: 10, background: '#1B2D5E', color: '#fff', padding: '3px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700 }}>PRO</span>}
              </div>
              <div style={{ padding: 14, flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 4 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0, color: '#0f172a', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</h3>
                  <span style={{ fontSize: 11, color: '#94a3b8' }}>{item.language.toUpperCase()}</span>
                </div>
                <p style={{ fontSize: 12, color: '#64748b', margin: '4px 0 10px', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{item.description ?? 'Template sem descrição.'}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', fontSize: 11, color: '#94a3b8' }}>
                  <span>↓ {item.downloads.toLocaleString('pt-BR')}</span>
                  {item.ratingCount > 0 && <span>★ {item.ratingAvg.toFixed(1)} ({item.ratingCount})</span>}
                  <span style={{ padding: '2px 6px', borderRadius: 4, background: 'rgba(99,102,241,0.08)', color: '#1B2D5E', fontWeight: 600 }}>{CATEGORY_LABELS[item.category] ?? item.category}</span>
                </div>
                <button onClick={() => install(item.id)} disabled={installing === item.id}
                  style={{ marginTop: 10, padding: '8px 14px', background: '#1B2D5E', color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  {installing === item.id ? 'Instalando…' : item.priceBrlCents > 0 ? `Comprar R$${(item.priceBrlCents / 100).toFixed(2)}` : 'Usar template'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
