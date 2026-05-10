'use client';

import { useEffect, useState } from 'react';

type Brand = {
  displayName: string | null;
  tagline: string | null;
  description: string | null;
  logoUrl: string | null;
  coverUrl: string | null;
  brandColor: string;
  websiteUrl: string | null;
  socialInstagram: string | null;
  socialYoutube: string | null;
  socialLinkedin: string | null;
  emailPublic: string | null;
  showCertCount: number;
  showRecentCerts: number;
  showCourses: number;
  testimonialsJson: string | null;
};

type Testimonial = { author: string; role?: string; text: string };

export default function BrandingClient({ workspaceSlug }: { workspaceSlug: string }) {
  const [brand, setBrand] = useState<Brand | null>(null);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/v1/workspace/brand')
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) {
          setBrand(d.brand);
          try { setTestimonials(d.brand.testimonialsJson ? JSON.parse(d.brand.testimonialsJson) : []); } catch {}
        } else setError(d.error);
      })
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    if (!brand) return;
    setSaving(true); setError(null); setSaved(false);
    try {
      const r = await fetch('/api/v1/workspace/brand', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...brand, testimonialsJson: JSON.stringify(testimonials) }),
      });
      const d = await r.json();
      if (d.ok) { setSaved(true); setTimeout(() => setSaved(false), 3000); }
      else setError(d.error);
    } catch (e) { setError((e as Error).message); }
    finally { setSaving(false); }
  };

  const upload = async (kind: 'logo' | 'cover', file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('kind', kind);
    const r = await fetch('/api/v1/uploads', { method: 'POST', body: fd });
    const d = await r.json();
    if (d.ok && d.url) {
      setBrand((b) => b ? { ...b, [kind === 'logo' ? 'logoUrl' : 'coverUrl']: d.url } : b);
    } else {
      setError(d.error ?? 'Upload falhou');
    }
  };

  if (loading) return <div className="card text-center py-12 text-sm text-[rgb(var(--fg-muted))]">Carregando…</div>;
  if (!brand) return <div className="card text-sm text-[rgb(var(--danger))]">Erro: {error}</div>;

  const set = (k: keyof Brand, v: any) => setBrand({ ...brand, [k]: v });

  return (
    <div className="space-y-5">
      {error && <div className="card text-sm text-[rgb(var(--danger))]">⚠ {error}</div>}
      {saved && <div className="card text-sm" style={{ background: 'rgba(16,185,129,0.1)', color: '#059669', borderColor: '#10b981' }}>✓ Salvo! Pagina /escola/{workspaceSlug} atualizada.</div>}

      {/* Header info */}
      <div className="card" style={{ padding: 24 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>Informações públicas</h3>
        <div className="space-y-3">
          <div>
            <label className="label">Nome público</label>
            <input className="input" value={brand.displayName ?? ''} onChange={(e) => set('displayName', e.target.value)} placeholder="Ex: Liso Blindado Academy" />
          </div>
          <div>
            <label className="label">Tagline (1 linha)</label>
            <input className="input" value={brand.tagline ?? ''} onChange={(e) => set('tagline', e.target.value)} placeholder="A maior escola de cabelo do Brasil" maxLength={120} />
          </div>
          <div>
            <label className="label">Descrição completa</label>
            <textarea className="input" rows={5} value={brand.description ?? ''} onChange={(e) => set('description', e.target.value)} placeholder="Conta a história, missão, diferenciais da escola..." maxLength={1500} />
          </div>
        </div>
      </div>

      {/* Visual */}
      <div className="card" style={{ padding: 24 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>Visual</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div>
            <label className="label">Logo</label>
            {brand.logoUrl && <img src={brand.logoUrl} alt="" style={{ width: 80, height: 80, borderRadius: 12, objectFit: 'cover', marginBottom: 8 }} />}
            <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && upload('logo', e.target.files[0])} className="text-xs" />
          </div>
          <div>
            <label className="label">Cover banner</label>
            {brand.coverUrl && <img src={brand.coverUrl} alt="" style={{ width: '100%', height: 80, borderRadius: 8, objectFit: 'cover', marginBottom: 8 }} />}
            <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && upload('cover', e.target.files[0])} className="text-xs" />
          </div>
        </div>
        <div style={{ marginTop: 14 }}>
          <label className="label">Cor da marca (HEX)</label>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input type="color" value={brand.brandColor} onChange={(e) => set('brandColor', e.target.value)} style={{ width: 50, height: 38, border: 'none', borderRadius: 8 }} />
            <input className="input" style={{ flex: 1, fontFamily: 'monospace' }} value={brand.brandColor} onChange={(e) => set('brandColor', e.target.value)} placeholder="#1B2D5E" />
          </div>
        </div>
      </div>

      {/* Links */}
      <div className="card" style={{ padding: 24 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>Links e redes sociais</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div><label className="label">Site</label><input className="input" value={brand.websiteUrl ?? ''} onChange={(e) => set('websiteUrl', e.target.value)} placeholder="https://escola.com" /></div>
          <div><label className="label">Email público</label><input className="input" value={brand.emailPublic ?? ''} onChange={(e) => set('emailPublic', e.target.value)} placeholder="contato@escola.com" /></div>
          <div><label className="label">Instagram</label><input className="input" value={brand.socialInstagram ?? ''} onChange={(e) => set('socialInstagram', e.target.value)} placeholder="@lisoblindado" /></div>
          <div><label className="label">YouTube</label><input className="input" value={brand.socialYoutube ?? ''} onChange={(e) => set('socialYoutube', e.target.value)} placeholder="@canalescola" /></div>
          <div><label className="label">LinkedIn</label><input className="input" value={brand.socialLinkedin ?? ''} onChange={(e) => set('socialLinkedin', e.target.value)} placeholder="company/escola" /></div>
        </div>
      </div>

      {/* Page settings */}
      <div className="card" style={{ padding: 24 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>O que mostrar na página pública</h3>
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={brand.showCertCount === 1} onChange={(e) => set('showCertCount', e.target.checked ? 1 : 0)} /> Total de certificados emitidos</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={brand.showRecentCerts === 1} onChange={(e) => set('showRecentCerts', e.target.checked ? 1 : 0)} /> Grid de certificados recentes</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={brand.showCourses === 1} onChange={(e) => set('showCourses', e.target.checked ? 1 : 0)} /> Lista de cursos</label>
        </div>
      </div>

      {/* Testimonials */}
      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700 }}>Depoimentos</h3>
          <button onClick={() => setTestimonials([...testimonials, { author: '', text: '' }])} className="btn-ghost btn-sm" style={{ borderRadius: 8 }}>+ Adicionar</button>
        </div>
        <div className="space-y-3">
          {testimonials.map((t, i) => (
            <div key={i} style={{ padding: 14, background: 'rgb(var(--surface-2, 248 250 252))', borderRadius: 10 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: 8, marginBottom: 8 }}>
                <input className="input text-xs" placeholder="Nome" value={t.author} onChange={(e) => { const c = [...testimonials]; c[i].author = e.target.value; setTestimonials(c); }} />
                <input className="input text-xs" placeholder="Cargo / curso" value={t.role ?? ''} onChange={(e) => { const c = [...testimonials]; c[i].role = e.target.value; setTestimonials(c); }} />
                <button onClick={() => setTestimonials(testimonials.filter((_, j) => j !== i))} style={{ background: 'transparent', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 18 }}>×</button>
              </div>
              <textarea className="input text-xs" rows={2} placeholder="Depoimento..." value={t.text} onChange={(e) => { const c = [...testimonials]; c[i].text = e.target.value; setTestimonials(c); }} />
            </div>
          ))}
          {testimonials.length === 0 && <p className="text-xs text-[rgb(var(--fg-muted))] text-center py-6">Nenhum depoimento ainda</p>}
        </div>
      </div>

      {/* Save sticky */}
      <div style={{ position: 'sticky', bottom: 0, padding: 14, background: 'rgb(var(--surface))', borderTop: '1px solid rgb(var(--border))', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button onClick={save} disabled={saving} className="btn-primary" style={{ borderRadius: 12, padding: '10px 24px' }}>
          {saving ? 'Salvando…' : 'Salvar alterações'}
        </button>
      </div>
    </div>
  );
}
