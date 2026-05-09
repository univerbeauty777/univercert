'use client';

// UniverCert · Templates Gallery GODMODE 2.0
// Layout limpo, hierarquia clara, preview com skeleton, sem glass blur agressivo.

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { saveBrandKitAction } from './actions';
import { duplicateTemplateAction, deleteTemplateAction } from './editor/actions';

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
  const [savedFeedback, setSavedFeedback] = useState<{ tone: 'success' | 'error'; msg: string } | null>(null);
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
        setSavedFeedback({ tone: 'success', msg: `Template "${activeVariant}" salvo como ativo` });
        setTimeout(() => setSavedFeedback(null), 4000);
      } else {
        setSavedFeedback({ tone: 'error', msg: result.error ?? 'Erro ao salvar' });
      }
    });
  };

  return (
    <>
      {/* Editor de cores ----------------------------------------------------- */}
      <div className="card mb-6 sticky top-3 z-30 animate-fade-in">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold mb-1">Personalize as cores</h3>
            <p className="text-xs text-[rgb(var(--fg-muted))]">
              Aplica imediatamente nos previews. Salve no template ativo pra todos os certs futuros usarem.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <ColorField label="Primary" value={primary} onChange={setPrimary} />
            <ColorField label="Accent" value={accent} onChange={setAccent} />
            <button
              onClick={saveActiveTemplate}
              disabled={isPending}
              className="btn-primary btn-sm whitespace-nowrap"
            >
              {isPending ? 'Salvando…' : `Salvar "${activeVariant}"`}
            </button>
          </div>
        </div>

        {/* Paletas */}
        <div className="mt-4 pt-4 border-t border-[rgb(var(--border))] flex items-center gap-2 flex-wrap">
          <span className="text-[10px] uppercase tracking-wider font-semibold text-[rgb(var(--fg-subtle))] mr-1">
            Paletas
          </span>
          {PRESET_PALETTES.map((p) => {
            const isActive = p.primary.toLowerCase() === primary.toLowerCase() && p.accent.toLowerCase() === accent.toLowerCase();
            return (
              <button
                key={p.name}
                onClick={() => applyPalette(p)}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs transition border ${
                  isActive
                    ? 'border-[rgb(var(--brand))] bg-[rgb(var(--brand-soft))] text-[rgb(var(--brand))]'
                    : 'border-[rgb(var(--border))] hover:bg-[rgb(var(--surface-2))] text-[rgb(var(--fg-muted))]'
                }`}
                title={`${p.primary} / ${p.accent}`}
              >
                <span className="flex">
                  <span className="w-3 h-3 rounded-full ring-1 ring-white/60" style={{ background: p.primary }} />
                  <span className="w-3 h-3 rounded-full ring-1 ring-white/60 -ml-1" style={{ background: p.accent }} />
                </span>
                <span>{p.name}</span>
              </button>
            );
          })}
        </div>

        {savedFeedback && (
          <div
            className={`mt-3 px-3 py-2 rounded-md text-sm font-medium animate-slide-up flex items-center gap-2 ${
              savedFeedback.tone === 'success'
                ? 'bg-[rgb(var(--success-soft))] text-[rgb(var(--success))]'
                : 'bg-[rgb(var(--danger-soft))] text-[rgb(var(--danger))]'
            }`}
          >
            <span>{savedFeedback.tone === 'success' ? '✓' : '✕'}</span>
            <span>{savedFeedback.msg}</span>
          </div>
        )}
      </div>

      {/* Templates customizados --------------------------------------------- */}
      {customTemplates.length > 0 && (
        <section className="mb-8">
          <SectionHead
            title="Seus templates customizados"
            count={customTemplates.length}
            action={<a href="/templates/editor" className="btn-secondary btn-sm">+ Novo</a>}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {customTemplates.map((t, i) => (
              <CustomTemplateCard key={t.id} t={t} delay={i * 40} />
            ))}
          </div>
        </section>
      )}

      {/* Variantes prontas -------------------------------------------------- */}
      <section>
        <SectionHead title="Variantes prontas" count={variants.length} />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {variants.map((v, i) => {
            const active = activeVariant === v.id;
            return (
              <article
                key={v.id}
                onClick={() => setActiveVariant(v.id)}
                className={`card-hover relative overflow-hidden p-0 animate-slide-up ${
                  active ? 'ring-2 ring-[rgb(var(--brand))] border-[rgb(var(--brand))]' : ''
                }`}
                style={{ animationDelay: `${i * 40}ms` }}
              >
                {active && <Badge variant="active" />}
                <PreviewFrame src={previewUrl(v.id)} title={v.name} />
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-sm">{v.name}</h3>
                      <p className="text-[11px] uppercase tracking-wider text-[rgb(var(--fg-subtle))] font-medium mt-0.5">
                        {v.tagline}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-0.5 shrink-0">
                      <span className="w-4 h-4 rounded-full ring-1 ring-white/60" style={{ background: primary }} />
                      <span className="w-4 h-4 rounded-full ring-1 ring-white/60 -mt-1" style={{ background: accent }} />
                    </div>
                  </div>
                  <p className="text-xs text-[rgb(var(--fg-muted))] mt-2 leading-relaxed line-clamp-2">{v.desc}</p>
                  <div className="mt-3 flex gap-2">
                    <a
                      href={previewUrl(v.id)}
                      target="_blank"
                      rel="noopener"
                      onClick={(e) => e.stopPropagation()}
                      className="btn-secondary btn-sm flex-1 justify-center"
                    >
                      Tela cheia
                    </a>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveVariant(v.id);
                      }}
                      className={`btn-sm flex-1 justify-center ${
                        active ? 'btn-primary' : 'btn-secondary'
                      }`}
                    >
                      {active ? '✓ Selecionado' : 'Selecionar'}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Footer hint ---------------------------------------------------------- */}
      <div className="mt-8 card text-sm">
        <h3 className="font-semibold mb-1.5">Como aplicar nos certificados emitidos</h3>
        <p className="text-[rgb(var(--fg-muted))] text-xs leading-relaxed">
          Após salvar, todo cert novo usará o template ativo + suas cores. Pra forçar um cert atual ao
          template novo, abre direto:
        </p>
        <code className="mt-2 inline-block px-2 py-1 rounded text-[11px] font-mono bg-[rgb(var(--surface-2))] text-[rgb(var(--fg))]">
          /api/v1/credentials/&lt;id&gt;/pdf?variant={activeVariant}
        </code>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------------- */

function CustomTemplateCard({ t, delay }: { t: CustomTpl; delay: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleDuplicate = async () => {
    setBusy(true);
    try {
      const r = await duplicateTemplateAction(t.id);
      if (r.ok) {
        setFeedback(`Duplicado · abrindo editor…`);
        setTimeout(() => router.push(`/templates/editor?id=${r.templateId}`), 600);
      } else {
        setFeedback('Erro: ' + r.error);
        setBusy(false);
      }
    } catch (e) {
      setFeedback('Erro: ' + (e as Error).message);
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Apagar "${t.name}"? Não dá pra desfazer.`)) return;
    setBusy(true);
    try {
      const r = await deleteTemplateAction(t.id);
      if (r.ok) router.refresh();
      else { setFeedback('Erro: ' + r.error); setBusy(false); }
    } catch (e) {
      setFeedback('Erro: ' + (e as Error).message);
      setBusy(false);
    }
  };

  return (
    <article
      className="card-hover relative overflow-hidden p-0 animate-slide-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <Badge variant="custom" />
      <PreviewFrame src={`/api/v1/templates/custom/${t.id}/preview`} title={t.name} />
      <div className="p-4">
        <h3 className="font-semibold text-sm">{t.name}</h3>
        <p className="text-[11px] uppercase tracking-wider text-[rgb(var(--fg-subtle))] font-medium mt-0.5">{t.vertical}</p>
        {feedback && (
          <p className="text-xs text-[rgb(var(--fg-muted))] mt-2">{feedback}</p>
        )}
        <div className="mt-3 grid grid-cols-2 gap-2">
          <a href={`/templates/editor?id=${t.id}`} className="btn-primary btn-sm justify-center">
            ✎ Editar
          </a>
          <button onClick={handleDuplicate} disabled={busy} className="btn-secondary btn-sm justify-center">
            ⎘ Duplicar
          </button>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <a
            href={`/api/v1/templates/custom/${t.id}/preview`}
            target="_blank"
            rel="noopener"
            className="btn-ghost btn-sm justify-center"
          >
            Tela cheia
          </a>
          <button onClick={handleDelete} disabled={busy} className="btn-ghost btn-sm justify-center text-[rgb(var(--danger))]">
            Apagar
          </button>
        </div>
      </div>
    </article>
  );
}

function SectionHead({ title, count, action }: { title: string; count?: number; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <h2 className="text-base font-semibold">{title}</h2>
        {typeof count === 'number' && (
          <span className="text-xs text-[rgb(var(--fg-subtle))] font-num">{count}</span>
        )}
      </div>
      {action}
    </div>
  );
}

function Badge({ variant }: { variant: 'custom' | 'active' }) {
  if (variant === 'custom') {
    return (
      <div className="absolute top-3 right-3 z-10 badge badge-gold backdrop-blur-sm bg-white/90 dark:bg-black/60">
        Custom
      </div>
    );
  }
  return (
    <div className="absolute top-3 right-3 z-10 badge badge-brand backdrop-blur-sm bg-white/90 dark:bg-black/60">
      ✓ Ativo
    </div>
  );
}

function PreviewFrame({ src, title }: { src: string; title: string }) {
  return (
    <div className="relative aspect-[297/210] bg-[rgb(var(--surface-2))] overflow-hidden">
      {/* Skeleton enquanto iframe carrega */}
      <div className="absolute inset-0 skeleton" />
      <iframe
        src={src}
        title={`Preview ${title}`}
        className="relative inset-0 w-[297mm] h-[210mm] origin-top-left pointer-events-none border-0 bg-white"
        style={{ transform: 'scale(0.36)' }}
        loading="lazy"
        sandbox="allow-same-origin"
      />
    </div>
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
      <label className="text-[10px] font-semibold uppercase tracking-wider text-[rgb(var(--fg-subtle))] whitespace-nowrap">
        {label}
      </label>
      <div className="flex items-center gap-1 bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded-md px-1 py-0.5 hover:border-[rgb(var(--brand))] transition">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-6 h-6 rounded border-0 cursor-pointer p-0 bg-transparent"
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
          className="w-20 text-xs font-mono bg-transparent outline-none text-[rgb(var(--fg))]"
        />
      </div>
    </div>
  );
}
