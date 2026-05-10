// UniverCert · /partner/apply (S45)

'use client';

import { useState } from 'react';

export const runtime = 'edge';

export default function PartnerApplyPage() {
  const [form, setForm] = useState({ userEmail: '', fullName: '', audienceSize: '', niche: '', channels: [] as string[], motivation: '' });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true); setError(null);
    try {
      const r = await fetch('/api/v1/partner/apply', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...form, audienceSize: form.audienceSize ? parseInt(form.audienceSize, 10) : undefined }),
      });
      const d = await r.json();
      if (d.ok) setDone(true); else setError(d.error);
    } catch (e) { setError((e as Error).message); }
    finally { setSubmitting(false); }
  };

  const toggleChannel = (ch: string) => {
    setForm((f) => ({ ...f, channels: f.channels.includes(ch) ? f.channels.filter((c) => c !== ch) : [...f.channels, ch] }));
  };

  if (done) {
    return (
      <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'linear-gradient(135deg, #1B2D5E, #06B6D4)' }}>
        <div style={{ maxWidth: 480, background: '#fff', padding: 40, borderRadius: 20, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>✓</div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 8px' }}>Aplicação recebida!</h1>
          <p style={{ fontSize: 14, color: '#64748b', marginBottom: 20 }}>Resposta em até 5 dias úteis no email <strong>{form.userEmail}</strong>.</p>
          <a href="/" style={{ display: 'inline-block', padding: '12px 24px', background: '#1B2D5E', color: '#fff', borderRadius: 10, textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>Voltar ao site</a>
        </div>
      </main>
    );
  }

  return (
    <main style={{ minHeight: '100vh', background: '#fafafa', padding: '40px 24px' }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <a href="/" style={{ color: '#64748b', textDecoration: 'none', fontSize: 13 }}>← Voltar</a>
        <h1 style={{ fontSize: 32, fontWeight: 800, margin: '12px 0 4px' }}>Programa Educator Partner</h1>
        <p style={{ fontSize: 14, color: '#64748b', marginBottom: 24 }}>
          20% de comissão recorrente em todas as escolas que você indicar.
          Pra creators de conteúdo, professores e influencers do nicho de educação.
        </p>

        <form onSubmit={submit} style={{ background: '#fff', padding: 28, borderRadius: 16, border: '1px solid rgba(0,0,0,0.06)' }}>
          <div className="space-y-4">
            <div>
              <label className="label">Email *</label>
              <input type="email" className="input" required value={form.userEmail} onChange={(e) => setForm({ ...form, userEmail: e.target.value })} />
            </div>
            <div>
              <label className="label">Nome completo *</label>
              <input type="text" className="input" required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label className="label">Tamanho da audiência</label>
                <input type="number" className="input" placeholder="50000" value={form.audienceSize} onChange={(e) => setForm({ ...form, audienceSize: e.target.value })} />
              </div>
              <div>
                <label className="label">Nicho</label>
                <select className="input" value={form.niche} onChange={(e) => setForm({ ...form, niche: e.target.value })}>
                  <option value="">Selecione…</option>
                  <option value="cabelo">Cabelo / Beleza</option>
                  <option value="estetica">Estética</option>
                  <option value="educacao">Educação geral</option>
                  <option value="tech">Tech / Programação</option>
                  <option value="mba">MBA / Business</option>
                  <option value="esportes">Esportes / Fitness</option>
                  <option value="outro">Outro</option>
                </select>
              </div>
            </div>
            <div>
              <label className="label">Canais de divulgação</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
                {['instagram', 'youtube', 'tiktok', 'site', 'newsletter', 'podcast'].map((c) => (
                  <button key={c} type="button" onClick={() => toggleChannel(c)}
                    style={{ padding: '6px 14px', borderRadius: 100, border: '1px solid rgba(0,0,0,0.1)',
                      background: form.channels.includes(c) ? '#1B2D5E' : '#fff',
                      color: form.channels.includes(c) ? '#fff' : '#475569',
                      fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="label">Por que você quer ser partner?</label>
              <textarea className="input" rows={4} value={form.motivation} onChange={(e) => setForm({ ...form, motivation: e.target.value })}
                placeholder="Conta um pouco sobre seu trabalho com educação..." />
            </div>
            {error && <div style={{ background: 'rgba(239,68,68,0.1)', color: '#dc2626', padding: 10, borderRadius: 8, fontSize: 13 }}>⚠ {error}</div>}
            <button type="submit" disabled={submitting} className="btn-primary w-full justify-center" style={{ padding: '14px', borderRadius: 12 }}>
              {submitting ? 'Enviando…' : 'Aplicar pro programa'}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
