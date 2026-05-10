'use client';

// UniverCert · Template Editor V2 — GODMODE polish (S22b)
// Recursos: undo/redo · resize 8-handles · drag · atalhos teclado · z-index ·
// font upload · duplicate · lock toggle · snap guides centro/edges.

import { useState, useRef, useEffect, useCallback } from 'react';
import type { LayoutV2, LayoutField, FieldType, FieldStyle, Orientation, PageSizeName } from '@/lib/layout-v2';
import { getPageDimensions } from '@/lib/layout-v2';
import { pdfFileToPngBlob, detectOrientation } from '@/lib/pdf-to-png';
import { useLayoutHistory } from '@/lib/editor-history';
import AssetLibraryModal from '@/components/AssetLibraryModal';

const SAMPLE = {
  recipientName: 'Maria Aparecida da Silva',
  courseName: 'Coloração Avançada Profissional',
  courseHours: '32 horas',
  cpf: '123.456.789-00',
  date: '8 de maio de 2026',
  city: 'Belo Horizonte',
  workspaceName: 'UniverHair',
  verifyUrl: 'https://univercert.net/v/cred_DEMO',
  credentialId: 'cred_DEMO',
};

const BUILTIN_FONTS = [
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

type CustomFont = { family: string; url: string };

type Props = {
  initialLayout?: LayoutV2;
  templateId?: string;
  templateName?: string;
  onSave: (layout: LayoutV2, name: string) => Promise<{ ok: boolean; error?: string; templateId?: string }>;
};

export default function TemplateEditorV2({ initialLayout, templateId, templateName, onSave }: Props) {
  const initial = initialLayout ?? defaultLayout();
  const history = useLayoutHistory<LayoutV2>(initial);
  const layout = history.state;
  const setLayout = history.setState;
  const commit = history.commit;

  const [name, setName] = useState(templateName ?? 'Meu template');
  const [primaryId, setPrimaryId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bgUploading, setBgUploading] = useState(false);
  const [bgStage, setBgStage] = useState('');
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [zoom, setZoom] = useState<number>(0.5);
  const [customFonts, setCustomFonts] = useState<CustomFont[]>([]);
  const [snapLines, setSnapLines] = useState<{ x?: number; y?: number }>({});
  const [marquee, setMarquee] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [libraryOpen, setLibraryOpen] = useState<null | { kind: 'background' | 'logo'; onPick: (key: string, url: string) => void }>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const selected = primaryId ? layout.fields.find((f) => f.id === primaryId) ?? null : null;
  const setSelectedId = (id: string | null) => {
    setPrimaryId(id);
    setSelectedIds(new Set(id ? [id] : []));
  };
  const handleFieldClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (e.shiftKey || e.metaKey || e.ctrlKey) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
      setPrimaryId(id);
    } else {
      setSelectedId(id);
    }
  };
  const allSelectedIds = (): string[] => Array.from(selectedIds);

  /* -------------------- INJECT CUSTOM FONTS -------------------- */
  useEffect(() => {
    const styleId = 'uc-editor-fonts';
    let el = document.getElementById(styleId) as HTMLStyleElement | null;
    if (!el) {
      el = document.createElement('style');
      el.id = styleId;
      document.head.appendChild(el);
    }
    el.textContent = customFonts
      .map((f) => `@font-face { font-family: '${f.family}'; src: url('${f.url}'); font-display: swap; }`)
      .join('\n');
  }, [customFonts]);

  /* -------------------- BG UPLOAD -------------------- */
  const handleBackgroundUpload = async (file: File) => {
    setBgUploading(true);
    setErrorMsg(null);
    try {
      let uploadFile: File | Blob = file;
      let detectedOrientation: Orientation | null = null;
      let importedFromLabel = file.name.toLowerCase().split('.').pop() ?? 'file';

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
        orientation: detectedOrientation ?? l.orientation,
        background: { type: isSvg ? 'svg' : 'image', src: data.url, cover: false },
        meta: { ...l.meta, importedFrom: importedFromLabel },
      }));
      commit();
    } catch (e) {
      setErrorMsg('Falha no upload: ' + (e as Error).message);
    } finally {
      setBgUploading(false);
      setBgStage('');
    }
  };

  /* -------------------- FONT UPLOAD -------------------- */
  const handleFontUpload = async (file: File) => {
    const baseName = file.name.replace(/\.(ttf|otf|woff2?|eot)$/i, '').replace(/[_-]+/g, ' ').trim();
    const family = prompt(`Nome da família (ex: "${baseName}"):`, baseName) || baseName;
    if (!family) return;
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('family', family);
      const r = await fetch('/api/internal/fonts/upload', { method: 'POST', body: fd });
      const data = await r.json();
      if (!data.ok) throw new Error(data.error);
      setCustomFonts((f) => [...f.filter((x) => x.family !== data.family), { family: data.family, url: data.url }]);
    } catch (e) {
      setErrorMsg('Falha font: ' + (e as Error).message);
    }
  };

  /* -------------------- FIELD ACTIONS -------------------- */
  const addField = (type: FieldType) => {
    const tmpl = FIELD_TEMPLATES.find((t) => t.type === type)!;
    const newField: LayoutField = {
      id: `f-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`,
      type,
      x: 30, y: 40, w: 40, h: type === 'qr' ? 16 : 8,
      style: tmpl.defaultStyle,
      content: type === 'text' ? 'Texto livre' : undefined,
    };
    setLayout((l) => ({ ...l, fields: [...l.fields, newField] }));
    setSelectedId(newField.id);
    commit();
  };

  const updateField = useCallback((id: string, patch: Partial<LayoutField>) => {
    setLayout((l) => ({
      ...l,
      fields: l.fields.map((f) => (f.id === id ? { ...f, ...patch, style: { ...f.style, ...patch.style } } : f)),
    }));
  }, [setLayout]);

  const deleteField = useCallback((id: string) => {
    setLayout((l) => ({ ...l, fields: l.fields.filter((f) => f.id !== id) }));
    setSelectedId(null);
    commit();
  }, [setLayout, commit]);

  const duplicateField = useCallback((id: string) => {
    setLayout((l) => {
      const orig = l.fields.find((f) => f.id === id);
      if (!orig) return l;
      const dup: LayoutField = {
        ...orig,
        id: `f-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`,
        x: Math.min(95, orig.x + 3),
        y: Math.min(95, orig.y + 3),
        locked: false,
      };
      return { ...l, fields: [...l.fields, dup] };
    });
    commit();
  }, [setLayout, commit]);

  /* -------------------- ALIGN / DISTRIBUTE (multi-select) -------------------- */
  type AlignDir = 'left' | 'centerH' | 'right' | 'top' | 'centerV' | 'bottom' | 'distH' | 'distV';
  const alignFields = useCallback((dir: AlignDir) => {
    const ids = Array.from(selectedIds);
    if (ids.length < 2) return;
    setLayout((l) => {
      const targets = l.fields.filter((f) => ids.includes(f.id) && !f.locked);
      if (targets.length < 2) return l;
      let xs = targets.map((f) => f.x);
      let ys = targets.map((f) => f.y);
      let xMaxs = targets.map((f) => f.x + f.w);
      let yMaxs = targets.map((f) => f.y + f.h);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xMaxs);
      const minY = Math.min(...ys);
      const maxY = Math.max(...yMaxs);
      const cx = (minX + maxX) / 2;
      const cy = (minY + maxY) / 2;

      let updated = l.fields;
      if (dir === 'distH' || dir === 'distV') {
        // Distribui igualmente entre min e max
        const sorted = [...targets].sort((a, b) => (dir === 'distH' ? a.x - b.x : a.y - b.y));
        const totalSize = dir === 'distH'
          ? sorted.reduce((s, f) => s + f.w, 0)
          : sorted.reduce((s, f) => s + f.h, 0);
        const span = dir === 'distH' ? maxX - minX : maxY - minY;
        const gap = (span - totalSize) / Math.max(1, sorted.length - 1);
        let cursor = dir === 'distH' ? minX : minY;
        const updates = new Map<string, { x?: number; y?: number }>();
        sorted.forEach((f, i) => {
          if (i === 0) {
            cursor += dir === 'distH' ? f.w : f.h;
            return;
          }
          if (i === sorted.length - 1) return;
          cursor += gap;
          updates.set(f.id, dir === 'distH' ? { x: cursor } : { y: cursor });
          cursor += dir === 'distH' ? f.w : f.h;
        });
        updated = l.fields.map((f) => updates.has(f.id) ? { ...f, ...updates.get(f.id)! } : f);
      } else {
        updated = l.fields.map((f) => {
          if (!ids.includes(f.id) || f.locked) return f;
          if (dir === 'left') return { ...f, x: minX };
          if (dir === 'right') return { ...f, x: maxX - f.w };
          if (dir === 'centerH') return { ...f, x: cx - f.w / 2 };
          if (dir === 'top') return { ...f, y: minY };
          if (dir === 'bottom') return { ...f, y: maxY - f.h };
          if (dir === 'centerV') return { ...f, y: cy - f.h / 2 };
          return f;
        });
      }
      return { ...l, fields: updated };
    });
    commit();
  }, [selectedIds, setLayout, commit]);

  const moveZ = useCallback((id: string, delta: 'forward' | 'backward' | 'front' | 'back') => {
    setLayout((l) => {
      const max = Math.max(...l.fields.map((f) => f.z ?? 1));
      const min = Math.min(...l.fields.map((f) => f.z ?? 1));
      return {
        ...l,
        fields: l.fields.map((f) => {
          if (f.id !== id) return f;
          const cur = f.z ?? 1;
          let z = cur;
          if (delta === 'forward') z = cur + 1;
          if (delta === 'backward') z = Math.max(0, cur - 1);
          if (delta === 'front') z = max + 1;
          if (delta === 'back') z = Math.max(0, min - 1);
          return { ...f, z };
        }),
      };
    });
    commit();
  }, [setLayout, commit]);

  /* -------------------- SNAP GUIDES -------------------- */
  const computeSnap = (movingField: LayoutField, x: number, y: number): { x: number; y: number; lines: { x?: number; y?: number } } => {
    const SNAP = 1.0;  // % threshold
    const lines: { x?: number; y?: number } = {};
    let snappedX = x;
    let snappedY = y;
    const cx = x + movingField.w / 2;
    const cy = y + movingField.h / 2;
    // Snap to canvas center
    if (Math.abs(cx - 50) < SNAP) { snappedX = 50 - movingField.w / 2; lines.x = 50; }
    if (Math.abs(cy - 50) < SNAP) { snappedY = 50 - movingField.h / 2; lines.y = 50; }
    // Snap to other fields' x/y/center
    for (const f of layout.fields) {
      if (f.id === movingField.id) continue;
      const fcx = f.x + f.w / 2;
      const fcy = f.y + f.h / 2;
      if (Math.abs(cx - fcx) < SNAP) { snappedX = fcx - movingField.w / 2; lines.x = fcx; }
      if (Math.abs(x - f.x) < SNAP) { snappedX = f.x; lines.x = f.x; }
      if (Math.abs(cy - fcy) < SNAP) { snappedY = fcy - movingField.h / 2; lines.y = fcy; }
      if (Math.abs(y - f.y) < SNAP) { snappedY = f.y; lines.y = f.y; }
    }
    return { x: snappedX, y: snappedY, lines };
  };

  /* -------------------- DRAG -------------------- */
  const handleDrag = useCallback((id: string, ev: React.MouseEvent) => {
    ev.preventDefault();
    ev.stopPropagation();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const field = layout.fields.find((f) => f.id === id);
    if (!field || field.locked) return;

    // Multi-drag: se id está em selectedIds e há mais de 1 selecionado, move todos
    const isMulti = selectedIds.has(id) && selectedIds.size > 1;
    const movingIds = isMulti ? Array.from(selectedIds) : [id];
    const startStates = movingIds
      .map((mid) => layout.fields.find((f) => f.id === mid))
      .filter((f): f is LayoutField => !!f && !f.locked)
      .map((f) => ({ id: f.id, x: f.x, y: f.y, w: f.w, h: f.h }));

    const startMouseX = ev.clientX;
    const startMouseY = ev.clientY;

    const onMove = (e: MouseEvent) => {
      const dx = ((e.clientX - startMouseX) / rect.width) * 100;
      const dy = ((e.clientY - startMouseY) / rect.height) * 100;
      // Snap só aplica em single-drag pra evitar pulos no grupo
      let snapX = dx;
      let snapY = dy;
      let lines = {};
      if (!isMulti) {
        const rawX = startStates[0].x + dx;
        const rawY = startStates[0].y + dy;
        const snapped = computeSnap(field, rawX, rawY);
        snapX = snapped.x - startStates[0].x;
        snapY = snapped.y - startStates[0].y;
        lines = snapped.lines;
      }
      setLayout((l) => ({
        ...l,
        fields: l.fields.map((f) => {
          const ss = startStates.find((s) => s.id === f.id);
          if (!ss) return f;
          const nx = clamp(ss.x + snapX, 0, 100 - ss.w);
          const ny = clamp(ss.y + snapY, 0, 100 - ss.h);
          return { ...f, x: nx, y: ny };
        }),
      }));
      setSnapLines(lines);
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      setSnapLines({});
      commit();
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [layout.fields, selectedIds, setLayout, commit]);

  /* -------------------- RESIZE -------------------- */
  type ResizeDir = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';
  const handleResize = useCallback((id: string, dir: ResizeDir, ev: React.MouseEvent) => {
    ev.preventDefault();
    ev.stopPropagation();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const field = layout.fields.find((f) => f.id === id);
    if (!field || field.locked) return;
    const startMouseX = ev.clientX;
    const startMouseY = ev.clientY;
    const start = { x: field.x, y: field.y, w: field.w, h: field.h };

    const onMove = (e: MouseEvent) => {
      const dx = ((e.clientX - startMouseX) / rect.width) * 100;
      const dy = ((e.clientY - startMouseY) / rect.height) * 100;
      let nx = start.x, ny = start.y, nw = start.w, nh = start.h;
      if (dir.includes('e')) nw = Math.max(2, start.w + dx);
      if (dir.includes('s')) nh = Math.max(2, start.h + dy);
      if (dir.includes('w')) { nx = start.x + dx; nw = Math.max(2, start.w - dx); if (nw === 2) nx = start.x + start.w - 2; }
      if (dir.includes('n')) { ny = start.y + dy; nh = Math.max(2, start.h - dy); if (nh === 2) ny = start.y + start.h - 2; }
      // Clamp
      nx = clamp(nx, 0, 100); ny = clamp(ny, 0, 100);
      nw = clamp(nw, 2, 100 - nx); nh = clamp(nh, 2, 100 - ny);
      setLayout((l) => ({
        ...l,
        fields: l.fields.map((f) => (f.id === id ? { ...f, x: nx, y: ny, w: nw, h: nh } : f)),
      }));
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      commit();
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [layout.fields, setLayout, commit]);

  /* -------------------- KEYBOARD SHORTCUTS -------------------- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      // Ignora se ta digitando em input/textarea
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable) return;

      const meta = e.metaKey || e.ctrlKey;

      if (meta && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault();
        if (e.shiftKey) history.redo();
        else history.undo();
        return;
      }
      if (meta && (e.key === 'y' || e.key === 'Y')) {
        e.preventDefault(); history.redo(); return;
      }
      const ids = Array.from(selectedIds);
      if (ids.length > 0 && (e.key === 'Delete' || e.key === 'Backspace')) {
        e.preventDefault(); ids.forEach((id) => deleteField(id)); return;
      }
      if (ids.length > 0 && meta && (e.key === 'd' || e.key === 'D')) {
        e.preventDefault(); ids.forEach((id) => duplicateField(id)); return;
      }
      if (primaryId && meta && e.key === ']') {
        e.preventDefault(); moveZ(primaryId, e.shiftKey ? 'front' : 'forward'); return;
      }
      if (primaryId && meta && e.key === '[') {
        e.preventDefault(); moveZ(primaryId, e.shiftKey ? 'back' : 'backward'); return;
      }
      if (ids.length > 0 && (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
        e.preventDefault();
        const step = e.shiftKey ? 5 : 1;
        const dx = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0;
        const dy = e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0;
        ids.forEach((id) => {
          const f = layout.fields.find((x) => x.id === id);
          if (f && !f.locked) {
            updateField(id, { x: clamp(f.x + dx, 0, 100 - f.w), y: clamp(f.y + dy, 0, 100 - f.h) });
          }
        });
        commit();
      }
      // Escape limpa seleção
      if (e.key === 'Escape' && ids.length > 0) {
        e.preventDefault();
        setSelectedId(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [primaryId, selectedIds, history, deleteField, duplicateField, moveZ, layout.fields, updateField, commit]);

  /* -------------------- SAVE -------------------- */
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

  /* -------------------- ORIENTATION -------------------- */
  const toggleOrientation = () => {
    setLayout((l) => ({ ...l, orientation: l.orientation === 'landscape' ? 'portrait' : 'landscape' }));
    commit();
  };

  const isLandscape = layout.orientation === 'landscape';
  const pageDims = getPageDimensions(layout);
  const canvasStyle: React.CSSProperties = {
    width: pageDims.w * zoom * 3.78,
    height: pageDims.h * zoom * 3.78,
  };

  const allFonts = [...BUILTIN_FONTS, ...customFonts.map((f) => f.family)];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr_300px] gap-3 h-[calc(100vh-160px)]">
      {/* LEFT */}
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
          <button
            onClick={() => setLibraryOpen({
              kind: 'background',
              onPick: (key, url) => {
                setLayout((l) => ({ ...l, background: { type: 'image', src: url, cover: false } }));
                commit();
              },
            })}
            className="btn-secondary btn-sm w-full mt-2 text-xs"
          >
            📁 Da biblioteca…
          </button>
          {layout.background?.type !== 'color' && (
            <button
              onClick={() => { setLayout((l) => ({ ...l, background: { type: 'color', src: '#ffffff' } })); commit(); }}
              className="btn-ghost btn-sm w-full mt-2 text-xs"
            >
              Remover background
            </button>
          )}
        </div>

        <div className="mt-5 pt-4 border-t border-[rgb(var(--border))]">
          <h3 className="text-sm font-semibold mb-2">Fontes customizadas</h3>
          <FileDropZone
            label="Subir TTF/OTF/WOFF2"
            accept=".ttf,.otf,.woff,.woff2,font/*,application/octet-stream"
            onFile={handleFontUpload}
          />
          {customFonts.length > 0 && (
            <ul className="mt-2 space-y-1">
              {customFonts.map((f) => (
                <li key={f.family} className="text-[11px] text-[rgb(var(--fg-muted))] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[rgb(var(--success))]" />
                  <span style={{ fontFamily: f.family }}>{f.family}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-5 pt-4 border-t border-[rgb(var(--border))]">
          <h3 className="text-sm font-semibold mb-2">Tamanho da página</h3>
          <select
            className="input w-full text-xs mb-2"
            value={layout.pageSize ?? 'A4'}
            onChange={(e) => {
              const pageSize = e.target.value as PageSizeName;
              setLayout((l) => ({ ...l, pageSize }));
              commit();
            }}
          >
            <option value="A4">A4 (297×210mm)</option>
            <option value="Letter">Letter (279×216mm)</option>
            <option value="A3">A3 (420×297mm)</option>
            <option value="Square">Quadrado (210×210mm)</option>
            <option value="Custom">Custom…</option>
          </select>

          {layout.pageSize === 'Custom' && (
            <div className="grid grid-cols-2 gap-2 mb-2">
              <label className="block">
                <span className="text-[10px] text-[rgb(var(--fg-muted))]">Largura mm</span>
                <input
                  type="number"
                  className="input text-xs w-full"
                  value={layout.customWidth ?? 210}
                  onChange={(e) => { setLayout((l) => ({ ...l, customWidth: Number(e.target.value) || 210 })); }}
                  onBlur={commit}
                />
              </label>
              <label className="block">
                <span className="text-[10px] text-[rgb(var(--fg-muted))]">Altura mm</span>
                <input
                  type="number"
                  className="input text-xs w-full"
                  value={layout.customHeight ?? 297}
                  onChange={(e) => { setLayout((l) => ({ ...l, customHeight: Number(e.target.value) || 297 })); }}
                  onBlur={commit}
                />
              </label>
            </div>
          )}

          {layout.pageSize !== 'Square' && layout.pageSize !== 'Custom' && (
            <button onClick={toggleOrientation} className="btn-secondary btn-sm w-full text-xs">
              {isLandscape ? '↻ Landscape' : '↻ Portrait'}
            </button>
          )}

          {templateId && (
            <a
              href={`/api/v1/templates/custom/${templateId}/preview`}
              target="_blank"
              rel="noopener"
              className="btn-secondary btn-sm w-full text-xs mt-2 justify-center"
            >
              👁 Preview real
            </a>
          )}
        </div>

        <div className="mt-5 pt-4 border-t border-[rgb(var(--border))]">
          <h3 className="text-sm font-semibold mb-2">Atalhos</h3>
          <ul className="text-[11px] text-[rgb(var(--fg-muted))] space-y-1 leading-relaxed">
            <li><kbd className="kbd">⌘Z</kbd> desfazer</li>
            <li><kbd className="kbd">⌘⇧Z</kbd> refazer</li>
            <li><kbd className="kbd">⌫</kbd> apagar</li>
            <li><kbd className="kbd">⌘D</kbd> duplicar</li>
            <li><kbd className="kbd">←↑→↓</kbd> mover (1%)</li>
            <li><kbd className="kbd">⇧+seta</kbd> mover (5%)</li>
            <li><kbd className="kbd">⌘]</kbd> trazer pra frente</li>
            <li><kbd className="kbd">⌘[</kbd> mandar pra trás</li>
          </ul>
        </div>
      </aside>

      {/* CANVAS */}
      <main className="card !p-3 overflow-auto bg-[rgb(var(--surface-2))]">
        <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input w-56 text-sm"
            placeholder="Nome do template"
          />
          <div className="flex items-center gap-2">
            <button onClick={history.undo} disabled={!history.canUndo} className="btn-ghost btn-sm" title="Desfazer (⌘Z)">↶</button>
            <button onClick={history.redo} disabled={!history.canRedo} className="btn-ghost btn-sm" title="Refazer (⌘⇧Z)">↷</button>
            <span className="mx-1 h-5 w-px bg-[rgb(var(--border))]" />
            <ZoomBtn label="−" onClick={() => setZoom((z) => Math.max(0.2, z - 0.1))} />
            <span className="text-xs font-num w-12 text-center">{Math.round(zoom * 100)}%</span>
            <ZoomBtn label="+" onClick={() => setZoom((z) => Math.min(1.2, z + 0.1))} />
            <span className="mx-1 h-5 w-px bg-[rgb(var(--border))]" />
            <button onClick={handleSave} disabled={saveState === 'saving'} className="btn-primary btn-sm">
              {saveState === 'saving' ? 'Salvando…' : saveState === 'saved' ? '✓ Salvo' : 'Salvar template'}
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-3 px-3 py-2 bg-[rgb(var(--danger-soft))] text-[rgb(var(--danger))] text-sm rounded-md">{errorMsg}</div>
        )}

        {/* ALIGN/DISTRIBUTE TOOLBAR — só aparece com 2+ selecionados */}
        {selectedIds.size >= 2 && (
          <div className="mb-3 flex items-center gap-1 flex-wrap p-2 bg-[rgb(var(--brand-soft))] border border-[rgb(var(--brand))]/30 rounded-md">
            <span className="text-xs font-semibold text-[rgb(var(--brand))] mr-2">{selectedIds.size} selecionados</span>
            <button onClick={() => alignFields('left')} className="btn-secondary btn-sm" title="Alinhar à esquerda">⫷</button>
            <button onClick={() => alignFields('centerH')} className="btn-secondary btn-sm" title="Centralizar horizontal">↔</button>
            <button onClick={() => alignFields('right')} className="btn-secondary btn-sm" title="Alinhar à direita">⫸</button>
            <span className="mx-1 h-5 w-px bg-[rgb(var(--border))]" />
            <button onClick={() => alignFields('top')} className="btn-secondary btn-sm" title="Alinhar topo">⊤</button>
            <button onClick={() => alignFields('centerV')} className="btn-secondary btn-sm" title="Centralizar vertical">↕</button>
            <button onClick={() => alignFields('bottom')} className="btn-secondary btn-sm" title="Alinhar base">⊥</button>
            <span className="mx-1 h-5 w-px bg-[rgb(var(--border))]" />
            {selectedIds.size >= 3 && (
              <>
                <button onClick={() => alignFields('distH')} className="btn-secondary btn-sm" title="Distribuir horizontal">⊜H</button>
                <button onClick={() => alignFields('distV')} className="btn-secondary btn-sm" title="Distribuir vertical">⊜V</button>
              </>
            )}
            <button onClick={() => setSelectedId(null)} className="btn-ghost btn-sm ml-auto">Limpar</button>
          </div>
        )}

        <div className="flex items-start justify-center min-h-full">
          <div
            ref={canvasRef}
            onClick={(e) => { if (e.target === e.currentTarget) setSelectedId(null); }}
            onMouseDown={(e) => {
              if (e.target !== e.currentTarget) return;
              const canvas = canvasRef.current;
              if (!canvas) return;
              const rect = canvas.getBoundingClientRect();
              const startX = ((e.clientX - rect.left) / rect.width) * 100;
              const startY = ((e.clientY - rect.top) / rect.height) * 100;
              setMarquee({ x: startX, y: startY, w: 0, h: 0 });
              const onMove = (ev: MouseEvent) => {
                const cx = ((ev.clientX - rect.left) / rect.width) * 100;
                const cy = ((ev.clientY - rect.top) / rect.height) * 100;
                const x = Math.min(startX, cx);
                const y = Math.min(startY, cy);
                const w = Math.abs(cx - startX);
                const h = Math.abs(cy - startY);
                setMarquee({ x, y, w, h });
              };
              const onUp = (ev: MouseEvent) => {
                const cx = ((ev.clientX - rect.left) / rect.width) * 100;
                const cy = ((ev.clientY - rect.top) / rect.height) * 100;
                const x = Math.min(startX, cx);
                const y = Math.min(startY, cy);
                const w = Math.abs(cx - startX);
                const h = Math.abs(cy - startY);
                window.removeEventListener('mousemove', onMove);
                window.removeEventListener('mouseup', onUp);
                setMarquee(null);
                if (w < 1 && h < 1) return;
                // Seleciona todos fields que intersectam
                const inside = layout.fields.filter((f) =>
                  !(f.x + f.w < x || f.x > x + w || f.y + f.h < y || f.y > y + h)
                ).map((f) => f.id);
                if (inside.length > 0) {
                  setSelectedIds(new Set(inside));
                  setPrimaryId(inside[0]);
                }
              };
              window.addEventListener('mousemove', onMove);
              window.addEventListener('mouseup', onUp);
            }}
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
            {/* Snap lines */}
            {snapLines.x != null && (
              <div style={{ position: 'absolute', left: `${snapLines.x}%`, top: 0, bottom: 0, width: 1, background: '#06B6D4', pointerEvents: 'none', zIndex: 1000 }} />
            )}
            {snapLines.y != null && (
              <div style={{ position: 'absolute', top: `${snapLines.y}%`, left: 0, right: 0, height: 1, background: '#06B6D4', pointerEvents: 'none', zIndex: 1000 }} />
            )}

            {layout.fields.map((f) => (
              <FieldOnCanvas
                key={f.id}
                field={f}
                selected={selectedIds.has(f.id)}
                primary={primaryId === f.id}
                onClick={(e) => handleFieldClick(f.id, e)}
                onDragStart={(e) => handleDrag(f.id, e)}
                onResizeStart={(dir, e) => handleResize(f.id, dir as any, e)}
                onInlineEdit={(content) => { updateField(f.id, { content }); commit(); }}
              />
            ))}

            {/* Marquee selection box */}
            {marquee && (marquee.w > 0.5 || marquee.h > 0.5) && (
              <div
                style={{
                  position: 'absolute',
                  left: `${marquee.x}%`,
                  top: `${marquee.y}%`,
                  width: `${marquee.w}%`,
                  height: `${marquee.h}%`,
                  border: '1.5px dashed #1B2D5E',
                  background: 'rgba(27,45,94,0.06)',
                  pointerEvents: 'none',
                  zIndex: 1100,
                }}
              />
            )}
          </div>
        </div>
      </main>

      {/* ASSET LIBRARY MODAL */}
      <AssetLibraryModal
        open={!!libraryOpen}
        kindFilter={libraryOpen?.kind}
        onClose={() => setLibraryOpen(null)}
        onSelect={(key, url) => libraryOpen?.onPick(key, url)}
        onUploadNew={async (file) => {
          const fd = new FormData();
          fd.append('file', file);
          fd.append('kind', libraryOpen?.kind ?? 'misc');
          const r = await fetch('/api/internal/assets/upload', { method: 'POST', body: fd });
          const data = await r.json();
          return data.ok ? { key: data.key, url: data.url } : null;
        }}
      />

      {/* RIGHT INSPECTOR */}
      <aside className="card overflow-y-auto">
        {!selected ? (
          <div className="text-sm text-[rgb(var(--fg-muted))] text-center py-8">
            Clique num campo no canvas pra editar.
          </div>
        ) : (
          <FieldInspector
            field={selected}
            allFonts={allFonts}
            onChange={(patch) => updateField(selected.id, patch)}
            onCommit={commit}
            onDelete={() => deleteField(selected.id)}
            onDuplicate={() => duplicateField(selected.id)}
            onMoveZ={(dir) => moveZ(selected.id, dir)}
            onToggleLock={() => { updateField(selected.id, { locked: !selected.locked }); commit(); }}
          />
        )}
      </aside>
    </div>
  );
}

/* ============================================================ */

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
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
  field, selected, primary = false, onClick, onDragStart, onResizeStart, onInlineEdit,
}: {
  field: LayoutField;
  selected: boolean;
  primary?: boolean;
  onClick: (e: React.MouseEvent) => void;
  onDragStart: (e: React.MouseEvent) => void;
  onResizeStart: (dir: string, e: React.MouseEvent) => void;
  onInlineEdit?: (newContent: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const sample = previewContent(field);
  const isHidden = field.style?.hidden;
  // AutoFit: usa CSS clamp via cqh (container query height) — sempre cabe na altura
  const autoFitCss: React.CSSProperties = field.style?.autoFit
    ? { fontSize: 'clamp(6px, 60cqh, 200px)', lineHeight: 1 }
    : { fontSize: field.style?.fontSize ? `${field.style.fontSize}pt` : '12pt' };

  const css: React.CSSProperties = {
    position: 'absolute',
    left: `${field.x}%`,
    top: `${field.y}%`,
    width: `${field.w}%`,
    height: `${field.h}%`,
    containerType: 'size',                           // habilita cqh
    border: primary ? '2px solid #1B2D5E' : selected ? '2px solid #06B6D4' : isHidden ? '1px dashed rgba(0,0,0,0.08)' : '1px dashed rgba(0,0,0,0.18)',
    background: selected ? 'rgba(27,45,94,0.05)' : 'transparent',
    opacity: isHidden ? 0.4 : 1,
    cursor: field.locked ? 'not-allowed' : 'move',
    display: 'flex',
    alignItems: 'center',
    justifyContent: field.style?.align === 'right' ? 'flex-end' : field.style?.align === 'left' ? 'flex-start' : 'center',
    fontFamily: field.style?.fontFamily ?? 'Inter',
    ...autoFitCss,
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
    userSelect: editing ? 'text' : 'none',
  };

  const inner = field.type === 'qr' ? (
    <div style={{ width: '100%', height: '100%', border: '1px solid #ccc', background: '#fff', display: 'grid', placeItems: 'center', fontFamily: 'monospace', fontSize: 9, color: '#666' }}>QR</div>
  ) : field.type === 'image' ? (
    field.src
      ? <img src={field.src} alt="" style={{ width: '100%', height: '100%', objectFit: field.style?.fit ?? 'contain' }} />
      : <span style={{ fontSize: 11, color: '#999' }}>(imagem · upload no painel direito)</span>
  ) : editing && field.type === 'text' ? (
    <input
      autoFocus
      defaultValue={field.content ?? ''}
      onBlur={(e) => { onInlineEdit?.(e.currentTarget.value); setEditing(false); }}
      onKeyDown={(e) => { if (e.key === 'Enter') (e.currentTarget as HTMLInputElement).blur(); if (e.key === 'Escape') setEditing(false); }}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      style={{ width: '100%', background: '#fff', border: '1px solid #1B2D5E', padding: '2px 4px', fontSize: 'inherit', fontFamily: 'inherit', fontWeight: 'inherit', color: 'inherit', textAlign: field.style?.align ?? 'center' }}
    />
  ) : (
    <span style={{ width: '100%' }}>{sample}</span>
  );

  return (
    <div
      style={css}
      onClick={onClick}
      onMouseDown={editing ? undefined : (field.locked ? undefined : onDragStart)}
      onDoubleClick={(e) => {
        if (field.type === 'text' && !field.locked) {
          e.stopPropagation();
          setEditing(true);
        }
      }}
    >
      {inner}
      {primary && !field.locked && (
        <>
          {(['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'] as const).map((dir) => (
            <ResizeHandle key={dir} dir={dir} onMouseDown={(e) => onResizeStart(dir, e)} />
          ))}
        </>
      )}
      {field.locked && (
        <span style={{ position: 'absolute', top: 2, right: 2, fontSize: 9, color: '#6B7280', pointerEvents: 'none' }}>🔒</span>
      )}
    </div>
  );
}

function ResizeHandle({ dir, onMouseDown }: { dir: string; onMouseDown: (e: React.MouseEvent) => void }) {
  const positions: Record<string, React.CSSProperties> = {
    nw: { left: -4, top: -4, cursor: 'nwse-resize' },
    n:  { left: '50%', top: -4, transform: 'translateX(-50%)', cursor: 'ns-resize' },
    ne: { right: -4, top: -4, cursor: 'nesw-resize' },
    e:  { right: -4, top: '50%', transform: 'translateY(-50%)', cursor: 'ew-resize' },
    se: { right: -4, bottom: -4, cursor: 'nwse-resize' },
    s:  { left: '50%', bottom: -4, transform: 'translateX(-50%)', cursor: 'ns-resize' },
    sw: { left: -4, bottom: -4, cursor: 'nesw-resize' },
    w:  { left: -4, top: '50%', transform: 'translateY(-50%)', cursor: 'ew-resize' },
  };
  return (
    <div
      onMouseDown={(e) => { e.stopPropagation(); onMouseDown(e); }}
      style={{
        position: 'absolute',
        width: 8, height: 8,
        background: '#1B2D5E',
        border: '1px solid #fff',
        borderRadius: 1,
        zIndex: 1001,
        ...positions[dir],
      }}
    />
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
  field, allFonts, onChange, onCommit, onDelete, onDuplicate, onMoveZ, onToggleLock,
}: {
  field: LayoutField;
  allFonts: string[];
  onChange: (patch: Partial<LayoutField>) => void;
  onCommit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onMoveZ: (dir: 'forward' | 'backward' | 'front' | 'back') => void;
  onToggleLock: () => void;
}) {
  return (
    <div className="space-y-3 text-sm">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-semibold">Editar campo</h3>
        <div className="flex items-center gap-1">
          <button onClick={onToggleLock} className="btn-ghost btn-sm text-xs" title={field.locked ? 'Desbloquear' : 'Bloquear'}>
            {field.locked ? '🔒' : '🔓'}
          </button>
          <button onClick={onDuplicate} className="btn-ghost btn-sm text-xs" title="Duplicar (⌘D)">⎘</button>
          <button
            onClick={() => {
              if (confirm('Apagar esse campo?')) onDelete();
            }}
            className="btn-ghost btn-sm text-xs text-[rgb(var(--danger))]"
            title="Apagar (⌫)"
          >×</button>
        </div>
      </div>

      <div className="text-[11px] text-[rgb(var(--fg-subtle))] uppercase tracking-wider">{field.type}{field.locked && ' · bloqueado'}</div>

      {field.type === 'text' && (
        <Section label="Texto">
          <textarea className="input w-full" rows={2} value={field.content ?? ''} onChange={(e) => onChange({ content: e.target.value })} onBlur={onCommit} />
        </Section>
      )}

      {field.type === 'image' && (
        <Section label="Upload imagem">
          <FileDropZone
            label="Subir PNG/SVG"
            accept="image/png,image/svg+xml,image/jpeg,image/webp"
            kind="logo"
            onUploadDone={(url) => { onChange({ src: url }); onCommit(); }}
          />
          {field.src && (
            <div className="mt-2 text-[10px] text-[rgb(var(--fg-subtle))] truncate">{field.src}</div>
          )}
        </Section>
      )}

      <Section label="Posição & tamanho">
        <div className="grid grid-cols-2 gap-2">
          <NumField label="X %" value={field.x} onChange={(v) => onChange({ x: v })} onCommit={onCommit} />
          <NumField label="Y %" value={field.y} onChange={(v) => onChange({ y: v })} onCommit={onCommit} />
          <NumField label="W %" value={field.w} onChange={(v) => onChange({ w: v })} onCommit={onCommit} />
          <NumField label="H %" value={field.h} onChange={(v) => onChange({ h: v })} onCommit={onCommit} />
        </div>
      </Section>

      <Section label="Camadas">
        <div className="grid grid-cols-2 gap-1">
          <button onClick={() => onMoveZ('front')} className="btn-secondary btn-sm text-xs">⤒ Frente</button>
          <button onClick={() => onMoveZ('forward')} className="btn-secondary btn-sm text-xs">↑ +1</button>
          <button onClick={() => onMoveZ('backward')} className="btn-secondary btn-sm text-xs">↓ -1</button>
          <button onClick={() => onMoveZ('back')} className="btn-secondary btn-sm text-xs">⤓ Fundo</button>
        </div>
      </Section>

      <Section label="Visibilidade & ajuste">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => { onChange({ style: { ...field.style, hidden: !field.style?.hidden } }); onCommit(); }}
            className={`btn-sm flex-1 ${field.style?.hidden ? 'btn-primary' : 'btn-secondary'} text-xs`}
            title="Esconder no canvas e no PDF final"
          >
            {field.style?.hidden ? '○ Oculto' : '● Visível'}
          </button>
          {field.type !== 'qr' && field.type !== 'image' && (
            <button
              onClick={() => { onChange({ style: { ...field.style, autoFit: !field.style?.autoFit } }); onCommit(); }}
              className={`btn-sm flex-1 ${field.style?.autoFit ? 'btn-primary' : 'btn-secondary'} text-xs`}
              title="Auto-fit: texto ajusta automático ao tamanho da caixa"
            >
              {field.style?.autoFit ? '⤢ Auto-fit' : '⤢ Auto-fit'}
            </button>
          )}
        </div>
      </Section>

      {field.type !== 'qr' && field.type !== 'image' && (
        <>
          <Section label="Tipografia">
            <select
              className="input w-full"
              value={field.style?.fontFamily ?? 'Inter'}
              onChange={(e) => { onChange({ style: { ...field.style, fontFamily: e.target.value } }); onCommit(); }}
              style={{ fontFamily: field.style?.fontFamily ?? 'Inter' }}
            >
              {allFonts.map((f) => <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>)}
            </select>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <NumField label="Tamanho pt" value={field.style?.fontSize ?? 12} onChange={(v) => onChange({ style: { ...field.style, fontSize: v } })} onCommit={onCommit} />
              <NumField label="Peso" value={(field.style?.fontWeight as number) ?? 400} onChange={(v) => onChange({ style: { ...field.style, fontWeight: v } })} onCommit={onCommit} step={100} min={100} max={900} />
            </div>
            <div className="flex items-center gap-2 mt-2">
              <input
                type="color"
                value={field.style?.color ?? '#000000'}
                onChange={(e) => onChange({ style: { ...field.style, color: e.target.value } })}
                onBlur={onCommit}
                className="w-8 h-8 rounded border border-[rgb(var(--border))] cursor-pointer"
              />
              <input
                type="text"
                value={field.style?.color ?? '#000000'}
                onChange={(e) => onChange({ style: { ...field.style, color: e.target.value } })}
                onBlur={onCommit}
                className="input flex-1 font-mono text-xs"
              />
            </div>
          </Section>

          <Section label="Alinhamento">
            <div className="flex gap-1">
              {(['left', 'center', 'right'] as const).map((a) => (
                <button
                  key={a}
                  onClick={() => { onChange({ style: { ...field.style, align: a } }); onCommit(); }}
                  className={`btn-sm flex-1 ${field.style?.align === a ? 'btn-primary' : 'btn-secondary'}`}
                >
                  {a === 'left' ? '⬅' : a === 'center' ? '⬌' : '➡'}
                </button>
              ))}
            </div>
          </Section>

          <Section label="Estilo">
            <div className="flex flex-wrap gap-1">
              <ToggleBtn active={!!field.style?.italic} onClick={() => { onChange({ style: { ...field.style, italic: !field.style?.italic } }); onCommit(); }}>I</ToggleBtn>
              <ToggleBtn active={!!field.style?.uppercase} onClick={() => { onChange({ style: { ...field.style, uppercase: !field.style?.uppercase } }); onCommit(); }}>AA</ToggleBtn>
              <ToggleBtn active={!!field.style?.underline} onClick={() => { onChange({ style: { ...field.style, underline: !field.style?.underline } }); onCommit(); }}>U</ToggleBtn>
            </div>
          </Section>
        </>
      )}
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider font-semibold text-[rgb(var(--fg-subtle))] mb-1.5">{label}</div>
      {children}
    </div>
  );
}

function NumField({ label, value, onChange, onCommit, step = 1, min, max }: { label: string; value: number; onChange: (v: number) => void; onCommit?: () => void; step?: number; min?: number; max?: number }) {
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
        onBlur={onCommit}
        className="input w-full text-xs"
      />
    </label>
  );
}

function ToggleBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={`btn-sm ${active ? 'btn-primary' : 'btn-secondary'}`} style={{ minWidth: 36 }}>
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
          if (inputRef.current) inputRef.current.value = '';
        }}
      />
    </div>
  );
}
