'use client';

// UniverCert · Template Editor V2 — Canvas import-first com zones editaveis

import { useState, useRef, useEffect, useCallback } from 'react';
import type { LayoutV2, LayoutField, FieldType, FieldStyle, Orientation } from '@/lib/layout-v2';
import { pdfFileToPngBlob, detectOrientation } from '@/lib/pdf-to-png';

const SAMPLE = {
  recipientName: 'Maria Aparecida da Silva',
  courseName: 'Coloração Avançada Profissional',
  courseHours: '32 horas',
  cpf: '123.456.789-00',
  date: '8 de maio de 2026',
  city: 'Belo Horizonte',
  workspaceName: 'UniverHair',
  verifyUrl: 'https://univercert.com.br/v/cred_DEMO',
  credentialId: 'cred_DEMO',
};

const FONT_OPTIONS = [
  'Inter', 'Cormorant Garamond', 'Playfair Display', 'Cinzel',
  'Archivo Black', 'JetBrains Mono', 'Dancing Script', 'Patrick Hand',
];

const FIELD_TEMPLATES: { type: FieldType; label: string; icon: string; defaultStyle?: FieldStyle }[] = [
  { type: 'recipientName', label: 'Nome do aluno', icon: '👤', defaultStyle: { fontSize: 32, fontFamily: 'Cormorant Garamond', fontWeight: 600, align: 'center' } },
  { type: 'courseName', label: 'Nome do curso', icon: '🎓', defaultStyle: { fontSize: 20, fontFamily: 'Cormorant Garamond', fontWeight: 600, align: 'center' } },
  { type: 'courseHours', label: 'Carga horária', icon: '⏱', defaultStyle: { fontSize: 12, align: 'center' } },
  { type: 'cpf', label: 'CPF', icon: '🪪', defaultStyle: { fontSize: 11, align: 'center' } },
  { type: 'date', label: 'Data emissão', icon: '📅', defaultStyle: { fontSize: 11, align: 'center' } },
  { type: 'city', label: 'Cidade', icon: '🏙', defaultStyle: { fontSize: 11, align: 'center' } },
  { type: 'workspaceName', label: 'Escola', icon: '🏫', defaultStyle: { fontSize: 14, fontWeight: 700, align: 'center' } },
  { type: 'credentialId', label: 'ID curto', icon: '🆔', defaultStyle: { fontSize: 9, fontFamily: 'JetBrains Mono', align: 'center' } },
  { type: 'verifyUrl', label: 'URL de verificação', icon: '🔗', defaultStyle: { fontSize: 9, align: 'center' } },
  { type: 'text', label: 'Texto livre', icon: 'T', defaultStyle: { fontSize: 12, align: 'center' } },
  { type: 'qr', label: 'QR code', icon: '▦' },
  { type: 'image', label: 'Imagem (logo/assinatura)', icon: '🖼' },
];

type Props = {
  initialLayout?: LayoutV2;
  templateId?: string;
  templateName?: string;
  onSave: (layout: LayoutV2, name: string) => Promise<{ ok: boolean; error?: string; templateId?: string }>;
};

export default function TemplateEditorV2({ initialLayout, templateId, templateName, onSave }: Props) {
  const [layout, setLayout] = useState<LayoutV2>(initialLayout ?? defaultLayout());
  const [name, setName] = useState(templateName ?? 'Meu template');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [bgUploading, setBgUploading] = useState(false);
  const [bgStage, setBgStage] = useState<string>('');
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [zoom, setZoom] = useState<number>(0.5);
  const canvasRef = useRef<HTMLDivElement>(null);

  const selected = layout.fields.find((f) => f.id === selectedId) ?? null;

  /* ---- Background upload ---- */
  const handleBackgroundUpload = async (file: File) => {
    setBgUploading(true);
    setErrorMsg(null);
    try {
      let uploadFile: File | Blob = file;
      let detectedOrientation: Orientation | null = null;
      let importedFromLabel = file.name.toLowerCase().split('.').pop() ?? 'file';

      // Sprint 21b: PDF -> PNG client-side via pdf.js
      if (file.type === 'application/pdf') {
        setBgStage('Carregando pdf.js…');
        const conv = await pdfFileToPngBlob(file, 2.5);
        setBgStage('Convertendo página 1…');
        uploadFile = new File([conv.blob], file.name.replace(/\.pdf$/i, '.png'), { type: 'image/png' });
        detectedOrientation = detectOrientation(conv.width, conv.height);
        importedFromLabel = `pdf-pg1-of-${conv.pageCount}`;
      }
      setBgStage('Subindo pra R2…');

      const fd = new FormData();
      fd.append('file', uploadFile, (uploadFile as File).name ?? 'background.png');
      fd.append('kind', 'background');
      if (templateId) fd.append('templateId', templateId);
      const r = await fetch('/api/internal/assets/upload', { method: 'POST', body: fd });
      const data = await r.json();
      if (!data.ok) throw new Error(data.error);

      const isSvg = file.type === 'image/svg+xml';

      setLayout((l) => ({
        ...l,
        // Auto-detecta orientation do PDF (caso seja portrait, vira layout portrait)
        orientation: detectedOrientation ?? l.orientation,
        background: {
          type: isSvg ? 'svg' : 'image',     // PDF agora vira image apos conversao
          src: data.url,
          cover: false,
        },
        meta: { ...l.meta, importedFrom: importedFromLabel },
      }));
    } catch (e) {
      setErrorMsg('Falha no upload: ' + (e as Error).message);
    } finally {
      setBgUploading(false);
      setBgStage('');
    }
  };

  /* ---- Field actions ---- */
  const addField = (type: FieldType) => {
    const tmpl = FIELD_TEMPLATES.find((t) => t.type === type)!;
    const newField: LayoutField = {
      id: `f-${Date.now().toString(36)}`,
      type,
      x: 30, y: 40, w: 40, h: type === 'qr' ? 16 : 8,
      style: tmpl.defaultStyle,
      content: type === 'text' ? 'Texto livre' : undefined,
    };
    setLayout((l) => ({ ...l, fields: [...l.fields, newField] }));
    setSelectedId(newField.id);
  };

  const updateField = (id: string, patch: Partial<LayoutField>) => {
    setLayout((l) => ({
      ...l,
      fields: l.fields.map((f) => (f.id === id ? { ...f, ...patch, style: { ...f.style, ...patch.style } } : f)),
    }));
  };

  const deleteField = (id: string) => {
    setLayout((l) => ({ ...l, fields: l.fields.filter((f) => f.id !== id) }));
    setSelectedId(null);
  };

  /* ---- Drag handler ---- */
  const handleDrag = useCallback((id: string, startX: number, startY: number, ev: React.MouseEvent) => {
    ev.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const startPctX = ((ev.clientX - rect.left) / rect.width) * 100;
    const startPctY = ((ev.clientY - rect.top) / rect.height) * 100;
    const offsetX = startPctX - startX;
    const offsetY = startPctY - startY;

    const onMove = (e: MouseEvent) => {
      const px = ((e.clientX - rect.left) / rect.width) * 100 - offsetX;
      const py = ((e.clientY - rect.top) / rect.height) * 100 - offsetY;
      updateField(id, {
        x: Math.max(0, Math.min(95, snap(px))),
        y: Math.max(0, Math.min(95, snap(py))),
      });
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, []);

  /* ---- Save ---- */
  const handleSave = async () => {
    setSaveState('saving');
    setErrorMsg(null);
    try {
      const r = await onSave(layout, name);
      if (r && r.ok) {
        setSaveState('saved');
        setTimeout(() => setSaveState('idle'), 2500);
      } else {
        setSaveState('error');
        setErrorMsg((r && r.error) ?? 'erro ao salvar (resposta vazia)');
      }
    } catch (e) {
      setSaveState('error');
      setErrorMsg((e as Error)?.message ?? 'erro desconhecido');
    }
  };

  /* ---- Orientation toggle ---- */
  const toggleOrientation = () => {
    setLayout((l) => ({ ...l, orientation: l.orientation === 'landscape' ? 'portrait' : 'landscape' }));
  };

  const isLandscape = layout.orientation === 'landscape';
  const canvasStyle: React.CSSProperties = isLandscape
    ? { width: 297 * zoom * 3.78, height: 210 * zoom * 3.78 }     // 1mm = 3.78px
    : { width: 210 * zoom * 3.78, height: 297 * zoom * 3.78 };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr_300px] gap-3 h-[calc(100vh-160px)]">
      {/* LEFT PANEL · Add fields */}
      <aside className="card overflow-y-auto">
        <h3 className="text-sm font-semibold mb-3">Adicionar campo</h3>
        <div className="grid grid-cols-2 gap-2">
          {FIELD_TEMPLATES.map((t) => (
            <button
              key={t.type}
              onClick={() => addField(t.type)}
              className="flex flex-col items-center gap-1 p-2 rounded-md border border-[rgb(var(--border))] hover:bg-[rgb(var(--surface-2))] hover:border-[rgb(var(--brand))] transition text-xs"
            >
              <span className="text-base">{t.icon}</span>
              <span className="text-[11px] leading-tight text-center">{t.label}</span>
            </button>
          ))}
        </div>

        <div className="mt-5 pt-4 border-t border-[rgb(var(--border))]">
          <h3 className="text-sm font-semibold mb-2">Background</h3>
          <FileDropZone
            label={bgUploading ? (bgStage || 'Enviando…') : layout.background?.type === 'image' || layout.background?.type === 'svg' ? 'Trocar imagem/PDF' : 'Subir PNG/JPG/PDF/SVG'}
            accept="image/png,image/jpeg,image/svg+xml,image/webp,application/pdf"
            disabled={bgUploading}
            onFile={handleBackgroundUpload}
          />
          {layout.background?.type !== 'color' && (
            <button
              onClick={() => setLayout((l) => ({ ...l, background: { type: 'color', src: '#ffffff' } }))}
              className="btn-ghost btn-sm w-full mt-2 text-xs"
            >
              Remover background
            </button>
          )}
        </div>

        <div className="mt-5 pt-4 border-t border-[rgb(var(--border))]">
          <h3 className="text-sm font-semibold mb-2">Layout</h3>
          <button onClick={toggleOrientation} className="btn-secondary btn-sm w-full text-xs">
            {isLandscape ? '↻ Landscape (A4)' : '↻ Portrait (A4)'}
          </button>
        </div>
      </aside>

      {/* CANVAS */}
      <main className="card !p-3 overflow-auto bg-[rgb(var(--surface-2))]">
        {/* Toolbar */}
        <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input w-56 text-sm"
            placeholder="Nome do template"
          />
          <div className="flex items-center gap-2">
            <ZoomBtn label="−" onClick={() => setZoom((z) => Math.max(0.2, z - 0.1))} />
            <span className="text-xs font-num w-12 text-center">{Math.round(zoom * 100)}%</span>
            <ZoomBtn label="+" onClick={() => setZoom((z) => Math.min(1.2, z + 0.1))} />
            <span className="mx-2 h-5 w-px bg-[rgb(var(--border))]" />
            <button onClick={handleSave} disabled={saveState === 'saving'} className="btn-primary btn-sm">
              {saveState === 'saving' ? 'Salvando…' : saveState === 'saved' ? '✓ Salvo' : 'Salvar template'}
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-3 px-3 py-2 bg-[rgb(var(--danger-soft))] text-[rgb(var(--danger))] text-sm rounded-md">{errorMsg}</div>
        )}

        {/* Canvas */}
        <div className="flex items-start justify-center min-h-full">
          <div
            ref={canvasRef}
            onClick={(e) => { if (e.target === e.currentTarget) setSelectedId(null); }}
            style={{
              ...canvasStyle,
              background: layout.background?.type === 'color'
                ? layout.background.src
                : layout.background?.type === 'image' || layout.background?.type === 'svg'
                  ? `#fff url('${layout.background.src}') no-repeat center / ${layout.background.cover ? 'cover' : 'contain'}`
                  : '#fff',
              position: 'relative',
              boxShadow: '0 6px 20px rgba(0,0,0,0.10)',
              borderRadius: 4,
              flexShrink: 0,
            }}
          >
            {layout.background?.type === 'pdf' && (
              <object
                data={layout.background.src}
                type="application/pdf"
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
              />
            )}

            {layout.fields.map((f) => (
              <FieldOnCanvas
                key={f.id}
                field={f}
                selected={selectedId === f.id}
                onClick={(e) => { e.stopPropagation(); setSelectedId(f.id); }}
                onMouseDown={(e) => handleDrag(f.id, f.x, f.y, e)}
              />
            ))}
          </div>
        </div>
      </main>

      {/* RIGHT PANEL · Style */}
      <aside className="card overflow-y-auto">
        {!selected ? (
          <div className="text-sm text-[rgb(var(--fg-muted))] text-center py-8">
            Clique num campo no canvas pra editar.
          </div>
        ) : (
          <FieldInspector
            field={selected}
            onChange={(patch) => updateField(selected.id, patch)}
            onDelete={() => deleteField(selected.id)}
          />
        )}
      </aside>
    </div>
  );
}

/* ============================================================ */

function snap(n: number): number {
  return Math.round(n * 2) / 2;
}

function defaultLayout(): LayoutV2 {
  return {
    version: 2,
    orientation: 'landscape',
    pageSize: 'A4',
    background: { type: 'color', src: '#ffffff' },
    fields: [
      { id: 'f-1', type: 'text', content: 'CERTIFICADO', x: 10, y: 8, w: 80, h: 12, style: { fontFamily: 'Playfair Display', fontSize: 36, fontWeight: 700, align: 'center', color: '#1B2D5E' } },
      { id: 'f-2', type: 'recipientName', x: 10, y: 38, w: 80, h: 14, style: { fontFamily: 'Cormorant Garamond', fontSize: 36, fontWeight: 600, align: 'center' } },
      { id: 'f-3', type: 'courseName', x: 10, y: 60, w: 80, h: 10, style: { fontFamily: 'Cormorant Garamond', fontSize: 22, align: 'center', color: '#1B2D5E' } },
      { id: 'f-4', type: 'date', x: 10, y: 86, w: 60, h: 5, style: { fontSize: 10, align: 'center', color: '#6B7280' } },
      { id: 'f-qr', type: 'qr', x: 86, y: 80, w: 12, h: 18, locked: true, z: 999 },
    ],
  };
}

function FieldOnCanvas({
  field, selected, onClick, onMouseDown,
}: {
  field: LayoutField;
  selected: boolean;
  onClick: (e: React.MouseEvent) => void;
  onMouseDown: (e: React.MouseEvent) => void;
}) {
  const sample = previewContent(field);
  const css: React.CSSProperties = {
    position: 'absolute',
    left: `${field.x}%`,
    top: `${field.y}%`,
    width: `${field.w}%`,
    height: `${field.h}%`,
    border: selected ? '2px solid #1B2D5E' : '1px dashed rgba(0,0,0,0.18)',
    background: selected ? 'rgba(27,45,94,0.05)' : 'transparent',
    cursor: field.locked ? 'not-allowed' : 'move',
    display: 'flex',
    alignItems: 'center',
    justifyContent: field.style?.align === 'right' ? 'flex-end' : field.style?.align === 'left' ? 'flex-start' : 'center',
    fontFamily: field.style?.fontFamily ?? 'Inter',
    fontSize: field.style?.fontSize ? `${field.style.fontSize}pt` : '12pt',
    fontWeight: field.style?.fontWeight ?? 400,
    color: field.style?.color ?? '#000',
    fontStyle: field.style?.italic ? 'italic' : 'normal',
    textTransform: field.style?.uppercase ? 'uppercase' : 'none',
    textDecoration: field.style?.underline ? 'underline' : 'none',
    letterSpacing: field.style?.letterSpacing ? `${field.style.letterSpacing}em` : 'normal',
    overflow: 'hidden',
    padding: '0 4px',
    boxSizing: 'border-box',
    zIndex: field.z ?? 1,
    userSelect: 'none',
  };
  if (field.type === 'qr') {
    return (
      <div style={css} onClick={onClick} onMouseDown={field.locked ? undefined : onMouseDown}>
        <div style={{
          width: '100%',
          height: '100%',
          border: '1px solid #ccc',
          background: '#fff',
          display: 'grid',
          placeItems: 'center',
          fontFamily: 'monospace',
          fontSize: 9,
          color: '#666',
        }}>
          QR
        </div>
      </div>
    );
  }
  if (field.type === 'image') {
    return (
      <div style={css} onClick={onClick} onMouseDown={field.locked ? undefined : onMouseDown}>
        {field.src
          ? <img src={field.src} alt="" style={{ width: '100%', height: '100%', objectFit: field.style?.fit ?? 'contain' }} />
          : <span style={{ fontSize: 11, color: '#999' }}>(imagem · upload no painel direito)</span>}
      </div>
    );
  }
  return (
    <div style={css} onClick={onClick} onMouseDown={field.locked ? undefined : onMouseDown}>
      <span style={{ width: '100%' }}>{sample}</span>
    </div>
  );
}

function previewContent(field: LayoutField): string {
  if (field.type === 'text') return field.content || 'Texto';
  if (field.type === 'recipientName') return SAMPLE.recipientName;
  if (field.type === 'courseName') return SAMPLE.courseName;
  if (field.type === 'courseHours') return SAMPLE.courseHours;
  if (field.type === 'cpf') return SAMPLE.cpf;
  if (field.type === 'date') return SAMPLE.date;
  if (field.type === 'city') return SAMPLE.city;
  if (field.type === 'workspaceName') return SAMPLE.workspaceName;
  if (field.type === 'verifyUrl') return SAMPLE.verifyUrl;
  if (field.type === 'credentialId') return SAMPLE.credentialId;
  return '';
}

function FieldInspector({
  field, onChange, onDelete,
}: {
  field: LayoutField;
  onChange: (patch: Partial<LayoutField>) => void;
  onDelete: () => void;
}) {
  return (
    <div className="space-y-3 text-sm">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Editar campo</h3>
        {!field.locked && (
          <button onClick={onDelete} className="text-[rgb(var(--danger))] text-xs hover:underline">
            Apagar
          </button>
        )}
      </div>

      <div className="text-[11px] text-[rgb(var(--fg-subtle))] uppercase tracking-wider">{field.type}</div>

      {field.type === 'text' && (
        <Section label="Texto">
          <textarea
            className="input w-full"
            rows={2}
            value={field.content ?? ''}
            onChange={(e) => onChange({ content: e.target.value })}
          />
        </Section>
      )}

      {field.type === 'image' && (
        <Section label="Upload imagem">
          <FileDropZone
            label="Subir PNG/SVG"
            accept="image/png,image/svg+xml,image/jpeg,image/webp"
            kind="logo"
            onUploadDone={(url) => onChange({ src: url })}
          />
          {field.src && (
            <div className="mt-2 text-[10px] text-[rgb(var(--fg-subtle))] truncate">{field.src}</div>
          )}
        </Section>
      )}

      <Section label="Posição & tamanho">
        <div className="grid grid-cols-2 gap-2">
          <NumField label="X %" value={field.x} onChange={(v) => onChange({ x: v })} />
          <NumField label="Y %" value={field.y} onChange={(v) => onChange({ y: v })} />
          <NumField label="W %" value={field.w} onChange={(v) => onChange({ w: v })} />
          <NumField label="H %" value={field.h} onChange={(v) => onChange({ h: v })} />
        </div>
      </Section>

      {field.type !== 'qr' && field.type !== 'image' && (
        <>
          <Section label="Tipografia">
            <select
              className="input w-full"
              value={field.style?.fontFamily ?? 'Inter'}
              onChange={(e) => onChange({ style: { ...field.style, fontFamily: e.target.value } })}
            >
              {FONT_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <NumField label="Tamanho pt" value={field.style?.fontSize ?? 12} onChange={(v) => onChange({ style: { ...field.style, fontSize: v } })} />
              <NumField label="Peso" value={(field.style?.fontWeight as number) ?? 400} onChange={(v) => onChange({ style: { ...field.style, fontWeight: v } })} step={100} min={100} max={900} />
            </div>
            <div className="flex items-center gap-2 mt-2">
              <input
                type="color"
                value={field.style?.color ?? '#000000'}
                onChange={(e) => onChange({ style: { ...field.style, color: e.target.value } })}
                className="w-8 h-8 rounded border border-[rgb(var(--border))] cursor-pointer"
              />
              <input
                type="text"
                value={field.style?.color ?? '#000000'}
                onChange={(e) => onChange({ style: { ...field.style, color: e.target.value } })}
                className="input flex-1 font-mono text-xs"
              />
            </div>
          </Section>

          <Section label="Alinhamento">
            <div className="flex gap-1">
              {(['left', 'center', 'right'] as const).map((a) => (
                <button
                  key={a}
                  onClick={() => onChange({ style: { ...field.style, align: a } })}
                  className={`btn-sm flex-1 ${field.style?.align === a ? 'btn-primary' : 'btn-secondary'}`}
                >
                  {a === 'left' ? '⬅' : a === 'center' ? '⬌' : '➡'}
                </button>
              ))}
            </div>
          </Section>

          <Section label="Estilo">
            <div className="flex flex-wrap gap-1">
              <ToggleBtn active={!!field.style?.italic} onClick={() => onChange({ style: { ...field.style, italic: !field.style?.italic } })}>I</ToggleBtn>
              <ToggleBtn active={!!field.style?.uppercase} onClick={() => onChange({ style: { ...field.style, uppercase: !field.style?.uppercase } })}>AA</ToggleBtn>
              <ToggleBtn active={!!field.style?.underline} onClick={() => onChange({ style: { ...field.style, underline: !field.style?.underline } })}>U</ToggleBtn>
            </div>
          </Section>
        </>
      )}
    </div>
  );
}

/* ===== small components ===== */

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider font-semibold text-[rgb(var(--fg-subtle))] mb-1.5">{label}</div>
      {children}
    </div>
  );
}

function NumField({ label, value, onChange, step = 1, min, max }: { label: string; value: number; onChange: (v: number) => void; step?: number; min?: number; max?: number }) {
  return (
    <label className="block">
      <span className="text-[10px] text-[rgb(var(--fg-muted))]">{label}</span>
      <input
        type="number"
        value={value}
        step={step}
        min={min}
        max={max}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="input w-full text-xs"
      />
    </label>
  );
}

function ToggleBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`btn-sm ${active ? 'btn-primary' : 'btn-secondary'}`}
      style={{ minWidth: 36 }}
    >
      {children}
    </button>
  );
}

function ZoomBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="btn-secondary btn-sm" style={{ minWidth: 30 }}>{label}</button>
  );
}

function FileDropZone({
  label, accept, disabled, kind, onFile, onUploadDone,
}: {
  label: string;
  accept?: string;
  disabled?: boolean;
  kind?: string;
  onFile?: (file: File) => void;
  onUploadDone?: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState(false);

  const handle = async (file: File) => {
    if (onFile) return onFile(file);
    if (onUploadDone) {
      setBusy(true);
      try {
        const fd = new FormData();
        fd.append('file', file);
        if (kind) fd.append('kind', kind);
        const r = await fetch('/api/internal/assets/upload', { method: 'POST', body: fd });
        const data = await r.json();
        if (data.ok) onUploadDone(data.url);
      } finally {
        setBusy(false);
      }
    }
  };

  return (
    <div
      onClick={() => !disabled && !busy && inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault(); setDrag(false);
        const f = e.dataTransfer.files[0];
        if (f) handle(f);
      }}
      className={`border-2 border-dashed rounded-md p-3 text-center text-xs cursor-pointer transition ${
        drag ? 'border-[rgb(var(--brand))] bg-[rgb(var(--brand-soft))]' : 'border-[rgb(var(--border))] hover:border-[rgb(var(--border-strong))]'
      } ${disabled || busy ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <div className="text-[rgb(var(--fg-muted))]">{busy ? 'Enviando…' : label}</div>
      <input
        type="file"
        ref={inputRef}
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handle(f);
        }}
      />
    </div>
  );
}
