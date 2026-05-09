'use client';

// UniverCert · AssetLibraryModal (S22d)
// Modal pra reutilizar uploads anteriores em vez de subir tudo de novo.

import { useState, useEffect, useRef } from 'react';

type Asset = {
  id: string;
  key: string;
  url: string;
  kind: string;
  contentType: string | null;
  size: number | null;
  name: string | null;
  createdAt: number;
};

type Props = {
  open: boolean;
  kindFilter?: string;
  onClose: () => void;
  onSelect: (key: string, url: string) => void;
  /** Callback opcional pra subir novo arquivo (modal chama de volta após sucesso) */
  onUploadNew?: (file: File) => Promise<{ key: string; url: string } | null>;
};

const KINDS: { value: string; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'background', label: 'Fundos' },
  { value: 'logo', label: 'Logos' },
  { value: 'signature', label: 'Assinaturas' },
  { value: 'seal', label: 'Selos' },
  { value: 'misc', label: 'Outros' },
];

export default function AssetLibraryModal({ open, kindFilter, onClose, onSelect, onUploadNew }: Props) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState(kindFilter ?? 'all');
  const [search, setSearch] = useState('');
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true); setError(null);
    const url = filter === 'all'
      ? '/api/internal/assets/list?limit=120'
      : `/api/internal/assets/list?kind=${encodeURIComponent(filter)}&limit=120`;
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) setAssets(data.assets ?? []);
        else setError(data.error ?? 'erro');
      })
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, [open, filter]);

  if (!open) return null;

  const visible = search.trim()
    ? assets.filter((a) => (a.name ?? '').toLowerCase().includes(search.toLowerCase()) || a.kind.includes(search.toLowerCase()))
    : assets;

  const handleUpload = async (file: File) => {
    if (!onUploadNew) return;
    setUploading(true); setError(null);
    try {
      const r = await onUploadNew(file);
      if (r) {
        onSelect(r.key, r.url);
        onClose();
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
        zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[rgb(var(--surface))] rounded-xl shadow-lg border border-[rgb(var(--border))] flex flex-col"
        style={{ width: '100%', maxWidth: 880, maxHeight: '85vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-[rgb(var(--border))]">
          <div>
            <h2 className="text-base font-semibold">Biblioteca de uploads</h2>
            <p className="text-xs text-[rgb(var(--fg-muted))]">Reutilize fundos, logos e arquivos enviados antes.</p>
          </div>
          <button onClick={onClose} className="btn-icon" aria-label="Fechar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-2 px-5 py-3 border-b border-[rgb(var(--border))] flex-wrap">
          <select className="input text-xs" value={filter} onChange={(e) => setFilter(e.target.value)}>
            {KINDS.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
          </select>
          <input
            type="text"
            placeholder="Buscar por nome…"
            className="input text-xs flex-1 min-w-[180px]"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {onUploadNew && (
            <>
              <button onClick={() => inputRef.current?.click()} disabled={uploading} className="btn-primary btn-sm">
                {uploading ? 'Enviando…' : '+ Subir novo'}
              </button>
              <input
                ref={inputRef}
                type="file"
                className="hidden"
                accept="image/*,application/pdf"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); if (inputRef.current) inputRef.current.value = ''; }}
              />
            </>
          )}
        </div>

        {error && (
          <div className="mx-5 my-3 px-3 py-2 bg-[rgb(var(--danger-soft))] text-[rgb(var(--danger))] text-sm rounded-md">{error}</div>
        )}

        {/* Grid */}
        <div className="flex-1 overflow-auto p-5">
          {loading ? (
            <div className="text-center py-12 text-sm text-[rgb(var(--fg-muted))]">Carregando…</div>
          ) : visible.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-2">📁</div>
              <p className="text-sm text-[rgb(var(--fg-muted))]">
                {assets.length === 0 ? 'Nenhum upload ainda. Suba um agora.' : 'Sem resultado pra essa busca.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {visible.map((a) => (
                <button
                  key={a.id}
                  onClick={() => { onSelect(a.key, a.url); onClose(); }}
                  className="border border-[rgb(var(--border))] hover:border-[rgb(var(--brand))] rounded-md overflow-hidden bg-[rgb(var(--surface-2))] hover:shadow-md transition group text-left"
                >
                  <div className="aspect-square bg-[rgb(var(--surface))] overflow-hidden grid place-items-center">
                    {a.contentType?.startsWith('image/') ? (
                      <img src={a.url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition" loading="lazy" />
                    ) : (
                      <div className="text-3xl text-[rgb(var(--fg-subtle))]">
                        {a.contentType?.includes('pdf') ? '📄' : '📁'}
                      </div>
                    )}
                  </div>
                  <div className="p-2">
                    <div className="text-[11px] font-medium truncate">{a.name ?? a.key.split('/').pop()}</div>
                    <div className="text-[10px] text-[rgb(var(--fg-subtle))] flex items-center justify-between">
                      <span>{a.kind}</span>
                      {a.size && <span>{Math.round(a.size / 1024)}KB</span>}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
