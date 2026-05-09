'use client';

// UniverCert · Templates Gallery + Editor (Sprint 12)

import { useState, useTransition } from 'react';
import { saveBrandKitAction } from './actions';

type Variant = {
  id: string;
  name: string;
  tagline: string;
  desc: string;
  defaultPrimary: string;
  defaultAccent: string;
};

const PRESET_PALETTES = [
  { name: 'Navy + Gold', primary: '#1B2D5E', accent: '#D4A937' },
  { name: 'Black + Gold', primary: '#0A0E1A', accent: '#D4A937' },
  { name: 'Indigo + Pink', primary: '#6366F1', accent: '#EC4899' },
  { name: 'Emerald + Mint', primary: '#065F46', accent: '#34D399' },
  { name: 'Burgundy + Rose', primary: '#7C2D12', accent: '#FB7185' },
  { name: 'Steel + Cyan', primary: '#1F2937', accent: '#06B6D4' },
  { name: 'Royal + Cream', primary: '#1E3A8A', accent: '#FCD34D' },
  { name: 'Black + White', primary: '#0A0E1A', accent: '#1B2D5E' },
];

type CustomTpl = { id: string; name: string; vertical: string };

export default function TemplatesGalleryClient({
  variants,
  customTemplates = [],
  initialPrimary,
  initialAccent,
  workspaceName,
}: {
  variants: Variant[];
  customTemplates?: CustomTpl[];
  initialPrimary: string;
  initialAccent: string;
  workspaceName: string;
}) {
  const [primary, setPrimary] = useState(initialPrimary);
  const [accent, setAccent] = useState(initialAccent);
  const [activeVariant, setActiveVariant] = useState<string>('classic');
  const [savedFeedback, setSavedFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const previewUrl = (id: string) => {
    const params = new URLSearchParams({
      primary,
      accent,
      workspace: workspaceName,
    });
    return `/api/v1/templates/${id}/preview?${params.toString()}`;
  };

  const applyPalette = (p: { primary: string; accent: string }) => {
    setPrimary(p.primary);
    setAccent(p.accent);
  };

  const saveActiveTemplate = () => {
    startTransition(async () => {
      const result = await saveBrandKitAction({
        primaryColor: primary,
        secondaryColor: accent,
        activeTemplate: activeVariant,
      });
      if (result.ok) {
        setSavedFeedback(`✓ Template "${activeVariant}" salvo como ativo`);
        setTimeout(() => setSavedFeedback(null), 4000);
      } else {
        setSavedFeedback(`✗ ${result.error}`);
      }
    });
  };

  return (
    <>
      {/* Editor de cores — sticky no topo */}
      <div className="card !p-5 mb-6 sticky top-20 z-30 backdrop-blur-xl bg-white/85 animate-fade-in stagger-1">
        <div className="flex flex-col lg:flex-row lg:items-center gap-5">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-base tracking-tight mb-1">🎨 Personalize suas cores</h3>
            <p className="text-xs text-ink-500">
              As cores aplicam imediatamente nos previews abaixo. Salve no template ativo pra todos os certs futuros usarem.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <ColorField label="Primary" value={primary} onChange={setPrimary} />
            <ColorField label="Accent" value={accent} onChange={setAccent} />
            <button
              onClick={saveActiveTemplate}
              disabled={isPending}
              className="btn-primary text-sm whitespace-nowrap"
            >
              {isPending ? 'Salvando...' : `Salvar "${activeVariant}" como ativo`}
            </button>
          </div>
        </div>

        {/* Presets */}
        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-3 flex-wrap">
          <span className="text-[10px] uppercase tracking-widest font-bold text-ink-500">Paletas:</span>
          {PRESET_PALETTES.map((p) => (
            <button
              key={p.name}
              onClick={() => applyPalette(p)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs hover:bg-gray-100 transition border border-gray-200"
              title={`${p.primary} / ${p.accent}`}
            >
              <span className="flex">
                <span className="w-3 h-3 rounded-full border border-white shadow-sm" style={{ background: p.primary }} />
                <span className="w-3 h-3 rounded-full border border-white shadow-sm -ml-1" style={{ background: p.accent }} />
              </span>
              <span className="font-medium">{p.name}</span>
            </button>
          ))}
        </div>

        {savedFeedback && (
          <div
            className={`mt-3 p-2.5 rounded-xl text-sm font-medium animate-slide-up ${
              savedFeedback.startsWith('✓')
                ? 'bg-success/10 text-success border border-success/20'
                : 'bg-danger/10 text-danger border border-danger/20'
            }`}
          >
            {savedFeedback}
          </div>
        )}
      </div>

      {/* Templates customizados (do workspace) */}
      {customTemplates.length > 0 && (
        <>
          <div className="flex items-center justify-between mb-4 mt-2">
            <h2 className="font-display text-xl font-semibold tracking-tight">✏ Seus templates customizados</h2>
            <a href="/templates/new" className="btn-secondary text-xs">+ Criar mais</a>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 mb-10">
            {customTemplates.map((t, i) => (
              <article
                key={t.id}
                className="card-hover relative overflow-hidden p-0 animate-slide-up !p-0 border-2 border-accent/30"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="absolute top-3 right-3 z-10 px-2.5 py-1 bg-accent text-white text-[10px] font-bold uppercase tracking-widest rounded-full shadow-md">
                  Custom
                </div>
                <div className="relative aspect-[297/210] bg-gray-100 overflow-hidden">
                  <iframe
                    src={`/api/v1/templates/custom/${t.id}/preview`}
                    title={`Preview ${t.name}`}
                    className="absolute inset-0 w-[297mm] h-[210mm] origin-top-left pointer-events-none"
                    style={{ transform: 'scale(0.36)' }}
                    loading="lazy"
                    sandbox="allow-same-origin"
                  />
                </div>
                <div className="p-5">
                  <h3 className="font-display text-xl font-semibold tracking-tight">{t.name}</h3>
                  <p className="text-[11px] uppercase tracking-widest text-ink-500 font-bold mt-0.5">{t.vertical}</p>
                  <div className="mt-4 flex gap-2 pt-4 border-t border-gray-100">
                    <a href={`/api/v1/templates/custom/${t.id}/preview`} target="_blank" rel="noopener" className="btn-secondary text-xs flex-1 justify-center">
                      Abrir em tela cheia
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </>
      )}

      {/* Galeria de variantes prontas */}
      <h2 className="font-display text-xl font-semibold tracking-tight mb-4">🎨 Variantes prontas</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {variants.map((v, i) => (
          <article
            key={v.id}
            onClick={() => setActiveVariant(v.id)}
            className={`card-hover cursor-pointer relative overflow-hidden p-0 animate-slide-up !p-0 ${
              activeVariant === v.id ? 'border-2 border-primary shadow-glow-primary' : ''
            }`}
            style={{ animationDelay: `${i * 60}ms` }}
          >
            {activeVariant === v.id && (
              <div className="absolute top-3 right-3 z-10 px-2.5 py-1 bg-primary text-white text-[10px] font-bold uppercase tracking-widest rounded-full shadow-md">
                ✓ Ativo
              </div>
            )}

            {/* Preview iframe */}
            <div className="relative aspect-[297/210] bg-gray-100 overflow-hidden">
              <iframe
                src={previewUrl(v.id)}
                title={`Preview ${v.name}`}
                className="absolute inset-0 w-[297mm] h-[210mm] origin-top-left pointer-events-none"
                style={{ transform: 'scale(0.36)' }}
                loading="lazy"
                sandbox="allow-same-origin"
              />
            </div>

            <div className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-display text-xl font-semibold tracking-tight leading-tight">{v.name}</h3>
                  <p className="text-[11px] uppercase tracking-widest text-ink-500 font-bold mt-0.5">
                    {v.tagline}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-0.5">
                  <span className="w-5 h-5 rounded-full border-2 border-white shadow" style={{ background: primary }} />
                  <span className="w-5 h-5 rounded-full border-2 border-white shadow -mt-1" style={{ background: accent }} />
                </div>
              </div>

              <p className="text-sm text-ink-500 mt-3 leading-relaxed">{v.desc}</p>

              <div className="mt-4 flex gap-2 pt-4 border-t border-gray-100">
                <a
                  href={previewUrl(v.id)}
                  target="_blank"
                  rel="noopener"
                  onClick={(e) => e.stopPropagation()}
                  className="btn-secondary text-xs flex-1 justify-center"
                >
                  Abrir em tela cheia
                </a>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveVariant(v.id);
                  }}
                  className={`text-xs flex-1 justify-center ${
                    activeVariant === v.id ? 'btn-primary' : 'btn-ghost'
                  } btn`}
                >
                  {activeVariant === v.id ? '✓ Selecionado' : 'Selecionar'}
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="card mt-7 bg-gradient-to-br from-primary-soft via-white to-accent/5 border-primary/20 p-5 animate-fade-in stagger-3">
        <h3 className="font-bold mb-2 tracking-tight">💡 Como aplicar nos certificados emitidos</h3>
        <p className="text-sm text-ink-500 leading-relaxed mb-3">
          Após salvar, todo certificado novo usará o template ativo + suas cores. Pra ver um cert atual com o template novo, abre direto:{' '}
          <code className="bg-primary-soft px-1.5 py-0.5 rounded font-mono text-xs">/api/v1/credentials/&lt;id&gt;/pdf?variant={activeVariant}</code>
        </p>
        <p className="text-xs text-ink-500">
          Próximo: Sprint 13 trará upload de logo + assinatura digital + campos custom.
        </p>
      </div>
    </>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-[10px] font-bold uppercase tracking-widest text-ink-500 whitespace-nowrap">
        {label}
      </label>
      <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1 hover:border-primary/40 transition">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-7 h-7 rounded border-0 cursor-pointer p-0 bg-transparent"
          style={{ appearance: 'none' }}
        />
        <input
          type="text"
          value={value.toUpperCase()}
          onChange={(e) => {
            const v = e.target.value;
            if (/^#[0-9A-Fa-f]{0,6}$/.test(v)) onChange(v);
          }}
          maxLength={7}
          className="w-20 text-xs font-mono text-ink-900 bg-transparent outline-none"
        />
      </div>
    </div>
  );
}
