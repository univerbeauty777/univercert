'use client';

// UniverCert · Editor visual de templates · Sprint 14
// Canvas A4 landscape · drag-and-drop CSS-only · sem dep client-heavy

import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Logo from '@/components/Logo';
import { saveCustomTemplateAction } from './actions';

// ============================================================
// TIPOS
// ============================================================
type ElementType = 'text' | 'field' | 'image' | 'shape' | 'qr';
type FieldKey = 'recipientName' | 'courseName' | 'courseHours' | 'cpf' | 'issuedAt' | 'workspaceName' | 'verifyUrl' | 'credentialId';

type Element = {
  id: string;
  type: ElementType;
  x: number; // mm
  y: number; // mm
  w: number; // mm
  h: number; // mm
  // text/field props
  text?: string;
  field?: FieldKey;
  fontFamily?: 'Inter' | 'Cormorant Garamond' | 'Playfair Display' | 'JetBrains Mono';
  fontSize?: number; // pt
  fontWeight?: 400 | 600 | 700 | 800;
  color?: string;
  textAlign?: 'left' | 'center' | 'right';
  italic?: boolean;
  letterSpacing?: number; // em
  // shape/image
  fill?: string;
  borderRadius?: number;
  imageUrl?: string;
  // background
  zIndex?: number;
};

type Layout = {
  v: 1;
  pageColor: string;
  width: number; // mm (297 default)
  height: number; // mm (210 default)
  elements: Element[];
};

const A4_W = 297;
const A4_H = 210;

const FIELD_LABELS: Record<FieldKey, string> = {
  recipientName: 'Nome do aluno',
  courseName: 'Nome do curso',
  courseHours: 'Carga horária',
  cpf: 'CPF',
  issuedAt: 'Data de emissão',
  workspaceName: 'Nome da escola',
  verifyUrl: 'URL verify',
  credentialId: 'ID do cert',
};

const FIELD_PREVIEWS: Record<FieldKey, string> = {
  recipientName: 'Maria Aparecida da Silva',
  courseName: 'Alisamento Profissional',
  courseHours: '40 horas',
  cpf: '123.456.789-00',
  issuedAt: '8 de maio de 2026',
  workspaceName: 'UniverCert',
  verifyUrl: 'univercert.net/v/abc',
  credentialId: 'cred_ABC123',
};

const DEFAULT_LAYOUT: Layout = {
  v: 1,
  pageColor: '#FFFEF7',
  width: A4_W,
  height: A4_H,
  elements: [
    { id: 'bg-stripe', type: 'shape', x: 0, y: 0, w: A4_W, h: 4, fill: '#1B2D5E', zIndex: 1 },
    { id: 'workspace', type: 'field', field: 'workspaceName', x: 22, y: 18, w: 80, h: 8, fontFamily: 'Inter', fontSize: 11, fontWeight: 700, color: '#1B2D5E', textAlign: 'left', letterSpacing: 0.06, zIndex: 5 },
    { id: 'label', type: 'text', text: 'CERTIFICADO DE CONCLUSÃO', x: 22, y: 60, w: 253, h: 8, fontFamily: 'Inter', fontSize: 10, fontWeight: 700, color: '#D4A937', textAlign: 'center', letterSpacing: 0.4, zIndex: 5 },
    { id: 'pre', type: 'text', text: 'conferimos a', x: 22, y: 78, w: 253, h: 8, fontFamily: 'Cormorant Garamond', fontSize: 13, fontWeight: 400, color: '#6B7280', textAlign: 'center', italic: true, zIndex: 5 },
    { id: 'recipient', type: 'field', field: 'recipientName', x: 22, y: 88, w: 253, h: 30, fontFamily: 'Cormorant Garamond', fontSize: 56, fontWeight: 600, color: '#0A0E1A', textAlign: 'center', zIndex: 5 },
    { id: 'desc', type: 'text', text: 'por concluir com aproveitamento o curso de', x: 22, y: 130, w: 253, h: 8, fontFamily: 'Inter', fontSize: 12, fontWeight: 400, color: '#4B5563', textAlign: 'center', zIndex: 5 },
    { id: 'course', type: 'field', field: 'courseName', x: 22, y: 142, w: 253, h: 16, fontFamily: 'Cormorant Garamond', fontSize: 28, fontWeight: 600, color: '#1B2D5E', textAlign: 'center', zIndex: 5 },
    { id: 'date', type: 'field', field: 'issuedAt', x: 22, y: 175, w: 80, h: 8, fontFamily: 'Inter', fontSize: 10, fontWeight: 600, color: '#0A0E1A', textAlign: 'left', zIndex: 5 },
    { id: 'hours', type: 'field', field: 'courseHours', x: 195, y: 175, w: 80, h: 8, fontFamily: 'Inter', fontSize: 10, fontWeight: 600, color: '#0A0E1A', textAlign: 'right', zIndex: 5 },
  ],
};

// ============================================================
// COMPONENT
// ============================================================
export default function TemplateEditor() {
  const router = useRouter();
  const [layout, setLayout] = useState<Layout>(DEFAULT_LAYOUT);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tplName, setTplName] = useState('Meu template');
  const [zoom, setZoom] = useState(1.6);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const selected = layout.elements.find((el) => el.id === selectedId) ?? null;

  // Adjust zoom on window resize
  useEffect(() => {
    const onResize = () => {
      if (typeof window === 'undefined') return;
      const w = window.innerWidth;
      if (w < 768) setZoom(0.9);
      else if (w < 1280) setZoom(1.4);
      else setZoom(1.8);
    };
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // ============================================================
  // DRAG handler
  // ============================================================
  const handleMouseDown = useCallback(
    (e: React.MouseEvent, elId: string) => {
      e.stopPropagation();
      setSelectedId(elId);
      const el = layout.elements.find((x) => x.id === elId);
      if (!el) return;

      const startX = e.clientX;
      const startY = e.clientY;
      const startElX = el.x;
      const startElY = el.y;
      const mmPerPx = 1 / (3.78 * zoom); // 1mm = ~3.78px @ 96dpi, dividido pelo zoom

      const onMove = (ev: MouseEvent) => {
        const dx = (ev.clientX - startX) * mmPerPx;
        const dy = (ev.clientY - startY) * mmPerPx;
        setLayout((prev) => ({
          ...prev,
          elements: prev.elements.map((x) =>
            x.id === elId
              ? {
                  ...x,
                  x: Math.max(0, Math.min(layout.width - x.w, startElX + dx)),
                  y: Math.max(0, Math.min(layout.height - x.h, startElY + dy)),
                }
              : x,
          ),
        }));
      };
      const onUp = () => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
      };
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    },
    [layout, zoom],
  );

  // ============================================================
  // HELPERS
  // ============================================================
  const updateSelected = (patch: Partial<Element>) => {
    if (!selectedId) return;
    setLayout((prev) => ({
      ...prev,
      elements: prev.elements.map((x) => (x.id === selectedId ? { ...x, ...patch } : x)),
    }));
  };

  const addElement = (type: ElementType) => {
    const id = `el_${Math.random().toString(36).slice(2, 8)}`;
    const base: Element = {
      id,
      type,
      x: layout.width / 2 - 30,
      y: layout.height / 2 - 5,
      w: 60,
      h: 10,
      zIndex: 10,
    };
    const newEl: Element = type === 'text'
      ? { ...base, text: 'Novo texto', fontFamily: 'Inter', fontSize: 14, fontWeight: 400, color: '#0A0E1A', textAlign: 'center' }
      : type === 'field'
      ? { ...base, field: 'recipientName', fontFamily: 'Inter', fontSize: 14, fontWeight: 600, color: '#0A0E1A', textAlign: 'center' }
      : type === 'shape'
      ? { ...base, fill: '#D4A937', h: 4, w: 80, borderRadius: 0 }
      : type === 'qr'
      ? { ...base, w: 22, h: 22 }
      : { ...base, w: 25, h: 25, imageUrl: '' };
    setLayout((prev) => ({ ...prev, elements: [...prev.elements, newEl] }));
    setSelectedId(id);
  };

  const removeSelected = () => {
    if (!selectedId) return;
    setLayout((prev) => ({ ...prev, elements: prev.elements.filter((x) => x.id !== selectedId) }));
    setSelectedId(null);
  };

  const duplicateSelected = () => {
    if (!selected) return;
    const id = `el_${Math.random().toString(36).slice(2, 8)}`;
    setLayout((prev) => ({
      ...prev,
      elements: [...prev.elements, { ...selected, id, x: selected.x + 5, y: selected.y + 5 }],
    }));
    setSelectedId(id);
  };

  const moveZ = (dir: 'up' | 'down') => {
    if (!selected) return;
    updateSelected({ zIndex: (selected.zIndex ?? 1) + (dir === 'up' ? 1 : -1) });
  };

  const handleSave = async () => {
    if (!tplName.trim()) {
      setFeedback('Dê um nome ao template');
      return;
    }
    setSaving(true);
    setFeedback(null);
    try {
      const result = await saveCustomTemplateAction({
        name: tplName.trim(),
        layoutJson: JSON.stringify(layout),
      });
      if (result.ok) {
        setFeedback('✓ Template salvo. Redirecionando…');
        setTimeout(() => router.push('/templates'), 1200);
      } else {
        setFeedback(`✗ ${result.error}`);
        setSaving(false);
      }
    } catch (e) {
      setFeedback(`✗ ${(e as Error).message}`);
      setSaving(false);
    }
  };

  // ============================================================
  // RENDER
  // ============================================================
  const sortedElements = useMemo(
    () => [...layout.elements].sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0)),
    [layout.elements],
  );

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Topbar */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 backdrop-blur-xl">
        <div className="px-5 h-14 flex items-center gap-4">
          <a href="/templates" className="flex items-center gap-2 text-sm text-ink-700 hover:text-primary font-medium">
            <Logo size={28} /> ← Templates
          </a>
          <div className="flex-1 flex items-center gap-2 max-w-md">
            <input
              value={tplName}
              onChange={(e) => setTplName(e.target.value)}
              className="input !py-1.5 !px-3 text-sm font-bold"
              placeholder="Nome do template"
            />
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setZoom((z) => Math.max(0.5, z - 0.2))} className="btn-ghost text-sm !px-3">−</button>
            <span className="text-xs text-ink-500 font-mono w-12 text-center">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom((z) => Math.min(3, z + 0.2))} className="btn-ghost text-sm !px-3">+</button>
            <a href={`#preview`} className="btn-secondary text-sm" onClick={(e) => { e.preventDefault(); window.open(`data:text/html;charset=utf-8,${encodeURIComponent(renderPreviewHtml(layout))}`); }}>
              👁 Preview
            </a>
            <button onClick={handleSave} disabled={saving} className="btn-primary text-sm">
              {saving ? 'Salvando…' : '💾 Salvar template'}
            </button>
          </div>
        </div>
        {feedback && (
          <div
            className={`px-5 py-2 text-xs font-medium ${
              feedback.startsWith('✓') ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
            }`}
          >
            {feedback}
          </div>
        )}
      </header>

      <div className="flex" style={{ height: 'calc(100vh - 56px)' }}>
        {/* Sidebar esquerda — adicionar */}
        <aside className="w-56 border-r border-gray-200 bg-white p-4 overflow-y-auto">
          <h3 className="text-[10px] uppercase tracking-widest text-ink-500 font-bold mb-3">Adicionar elementos</h3>
          <div className="space-y-1.5">
            <SidebarButton onClick={() => addElement('text')} icon="T" label="Texto livre" />
            <SidebarButton onClick={() => addElement('field')} icon="{ }" label="Campo dinâmico" />
            <SidebarButton onClick={() => addElement('shape')} icon="▭" label="Linha / forma" />
            <SidebarButton onClick={() => addElement('image')} icon="🖼" label="Imagem (logo)" />
            <SidebarButton onClick={() => addElement('qr')} icon="▦" label="QR code" />
          </div>

          <h3 className="text-[10px] uppercase tracking-widest text-ink-500 font-bold mt-7 mb-3">Página</h3>
          <div className="space-y-2">
            <ColorRow label="Cor de fundo" value={layout.pageColor} onChange={(v) => setLayout((p) => ({ ...p, pageColor: v }))} />
          </div>

          <h3 className="text-[10px] uppercase tracking-widest text-ink-500 font-bold mt-7 mb-3">Camadas</h3>
          <div className="space-y-1 text-xs">
            {sortedElements.slice().reverse().map((el) => (
              <button
                key={el.id}
                onClick={() => setSelectedId(el.id)}
                className={`w-full text-left px-2 py-1.5 rounded-lg flex items-center gap-2 ${
                  selectedId === el.id ? 'bg-primary-soft text-primary-dark font-bold' : 'hover:bg-gray-100 text-ink-700'
                }`}
              >
                <span className="font-mono text-[10px] opacity-60">{el.type[0].toUpperCase()}</span>
                <span className="truncate">
                  {el.type === 'field' && el.field ? FIELD_LABELS[el.field] : el.type === 'text' ? `"${el.text?.slice(0, 14)}…"` : el.id}
                </span>
              </button>
            ))}
          </div>
        </aside>

        {/* Canvas central */}
        <div className="flex-1 overflow-auto bg-gray-100 p-8 flex items-start justify-center" onClick={() => setSelectedId(null)}>
          <div
            ref={canvasRef}
            className="relative shadow-card-lift"
            style={{
              width: `${layout.width * 3.78 * zoom}px`,
              height: `${layout.height * 3.78 * zoom}px`,
              background: layout.pageColor,
            }}
          >
            {sortedElements.map((el) => (
              <ElementBox
                key={el.id}
                el={el}
                zoom={zoom}
                selected={selectedId === el.id}
                onMouseDown={(e) => handleMouseDown(e, el.id)}
              />
            ))}
          </div>
        </div>

        {/* Inspector direito — props do selected */}
        <aside className="w-72 border-l border-gray-200 bg-white p-4 overflow-y-auto">
          {!selected ? (
            <div className="text-xs text-ink-500 text-center py-12 px-4 leading-relaxed">
              Clique num elemento do canvas pra editar suas propriedades.
              <br /><br />
              Ou adicione novos elementos pela barra esquerda.
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-[10px] uppercase tracking-widest text-ink-500 font-bold">
                  {selected.type === 'field' ? 'Campo dinâmico' : selected.type === 'text' ? 'Texto' : selected.type === 'shape' ? 'Forma' : selected.type === 'qr' ? 'QR Code' : 'Imagem'}
                </h3>
                <div className="flex gap-1">
                  <button onClick={duplicateSelected} title="Duplicar" className="text-ink-500 hover:text-primary p-1 text-sm">⎘</button>
                  <button onClick={() => moveZ('up')} title="Pra frente" className="text-ink-500 hover:text-primary p-1 text-sm">↑</button>
                  <button onClick={() => moveZ('down')} title="Pra trás" className="text-ink-500 hover:text-primary p-1 text-sm">↓</button>
                  <button onClick={removeSelected} title="Excluir" className="text-ink-500 hover:text-danger p-1 text-sm">✕</button>
                </div>
              </div>

              {selected.type === 'text' && (
                <div>
                  <label className="label">Texto</label>
                  <textarea value={selected.text ?? ''} onChange={(e) => updateSelected({ text: e.target.value })} className="input text-sm" rows={3} />
                </div>
              )}

              {selected.type === 'field' && (
                <div>
                  <label className="label">Campo</label>
                  <select value={selected.field} onChange={(e) => updateSelected({ field: e.target.value as FieldKey })} className="input text-sm">
                    {Object.entries(FIELD_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                  <p className="text-[10px] text-ink-500 mt-1">Preview: <em>{selected.field ? FIELD_PREVIEWS[selected.field] : ''}</em></p>
                </div>
              )}

              {(selected.type === 'text' || selected.type === 'field') && (
                <>
                  <div>
                    <label className="label">Fonte</label>
                    <select value={selected.fontFamily ?? 'Inter'} onChange={(e) => updateSelected({ fontFamily: e.target.value as any })} className="input text-sm">
                      <option value="Inter">Inter (sans)</option>
                      <option value="Cormorant Garamond">Cormorant Garamond (serif)</option>
                      <option value="Playfair Display">Playfair Display (serif bold)</option>
                      <option value="JetBrains Mono">JetBrains Mono (mono)</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <NumberRow label="Tamanho (pt)" value={selected.fontSize ?? 12} onChange={(v) => updateSelected({ fontSize: v })} min={6} max={120} />
                    <div>
                      <label className="label">Peso</label>
                      <select value={selected.fontWeight ?? 400} onChange={(e) => updateSelected({ fontWeight: Number(e.target.value) as any })} className="input text-sm">
                        <option value={400}>Regular</option>
                        <option value={600}>Semi-bold</option>
                        <option value={700}>Bold</option>
                        <option value={800}>Extra-bold</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="label">Alinhamento</label>
                    <div className="flex gap-1">
                      {(['left', 'center', 'right'] as const).map((a) => (
                        <button
                          key={a}
                          onClick={() => updateSelected({ textAlign: a })}
                          className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${
                            selected.textAlign === a ? 'bg-primary text-white' : 'bg-gray-100 text-ink-700 hover:bg-gray-200'
                          }`}
                        >
                          {a === 'left' ? '←' : a === 'center' ? '↔' : '→'}
                        </button>
                      ))}
                    </div>
                  </div>
                  <ColorRow label="Cor" value={selected.color ?? '#000000'} onChange={(v) => updateSelected({ color: v })} />
                </>
              )}

              {selected.type === 'shape' && <ColorRow label="Cor" value={selected.fill ?? '#000000'} onChange={(v) => updateSelected({ fill: v })} />}

              {selected.type === 'image' && (
                <div>
                  <label className="label">URL da imagem</label>
                  <input
                    type="url"
                    value={selected.imageUrl ?? ''}
                    onChange={(e) => updateSelected({ imageUrl: e.target.value })}
                    className="input text-sm"
                    placeholder="https://..."
                  />
                  <p className="text-[10px] text-ink-500 mt-1">Upload em S15 — por enquanto, cola URL pública.</p>
                </div>
              )}

              <div className="pt-4 border-t border-gray-100">
                <h4 className="text-[10px] uppercase tracking-widest text-ink-500 font-bold mb-2">Posição & tamanho</h4>
                <div className="grid grid-cols-2 gap-2">
                  <NumberRow label="X (mm)" value={Math.round(selected.x)} onChange={(v) => updateSelected({ x: v })} min={0} max={A4_W} />
                  <NumberRow label="Y (mm)" value={Math.round(selected.y)} onChange={(v) => updateSelected({ y: v })} min={0} max={A4_H} />
                  <NumberRow label="Largura" value={Math.round(selected.w)} onChange={(v) => updateSelected({ w: v })} min={1} max={A4_W} />
                  <NumberRow label="Altura" value={Math.round(selected.h)} onChange={(v) => updateSelected({ h: v })} min={1} max={A4_H} />
                </div>
              </div>
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}

// ============================================================
// SUBCOMPONENTS
// ============================================================
function ElementBox({ el, zoom, selected, onMouseDown }: { el: Element; zoom: number; selected: boolean; onMouseDown: (e: React.MouseEvent) => void }) {
  const px = 3.78 * zoom;
  const style: React.CSSProperties = {
    position: 'absolute',
    left: el.x * px,
    top: el.y * px,
    width: el.w * px,
    height: el.h * px,
    zIndex: el.zIndex ?? 1,
    cursor: 'move',
    border: selected ? '2px solid #1B2D5E' : '1px dashed transparent',
    outline: selected ? '2px solid rgba(212,169,55,0.4)' : 'none',
  };

  const inner: React.CSSProperties = {
    width: '100%',
    height: '100%',
    fontFamily: el.fontFamily ? `'${el.fontFamily}', sans-serif` : undefined,
    fontSize: el.fontSize ? `${el.fontSize * zoom * 1.0}pt` : undefined,
    fontWeight: el.fontWeight,
    color: el.color,
    textAlign: el.textAlign,
    fontStyle: el.italic ? 'italic' : 'normal',
    letterSpacing: el.letterSpacing ? `${el.letterSpacing}em` : undefined,
    lineHeight: 1.1,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
  };

  let content: React.ReactNode = null;
  if (el.type === 'text') content = <div style={inner}>{el.text}</div>;
  else if (el.type === 'field') content = <div style={inner}>{el.field ? FIELD_PREVIEWS[el.field] : '???'}</div>;
  else if (el.type === 'shape') content = <div style={{ ...inner, background: el.fill, borderRadius: el.borderRadius ?? 0 }} />;
  else if (el.type === 'image') content = el.imageUrl ? <img src={el.imageUrl} style={{ width: '100%', height: '100%', objectFit: 'contain' }} alt="" /> : <div style={{ ...inner, background: '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF', fontSize: 10 }}>🖼</div>;
  else if (el.type === 'qr') content = <div style={{ ...inner, background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 8 }}>▦ QR</div>;

  return (
    <div style={style} onMouseDown={onMouseDown}>
      {content}
    </div>
  );
}

function SidebarButton({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-primary-soft hover:text-primary transition text-sm text-ink-700 font-medium border border-gray-200 bg-white"
    >
      <span className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-xs font-mono font-bold">{icon}</span>
      <span>{label}</span>
    </button>
  );
}

function ColorRow({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="label">{label}</label>
      <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg p-1">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="w-8 h-8 rounded cursor-pointer p-0 bg-transparent border-0" />
        <input
          type="text"
          value={value.toUpperCase()}
          onChange={(e) => /^#[0-9A-Fa-f]{0,6}$/.test(e.target.value) && onChange(e.target.value)}
          maxLength={7}
          className="flex-1 text-xs font-mono text-ink-900 bg-transparent outline-none"
        />
      </div>
    </div>
  );
}

function NumberRow({ label, value, onChange, min, max }: { label: string; value: number; onChange: (v: number) => void; min: number; max: number }) {
  return (
    <div>
      <label className="label">{label}</label>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={(e) => onChange(Number(e.target.value))}
        className="input text-sm !py-2"
      />
    </div>
  );
}

// Preview HTML generator (pra abrir em nova aba)
function renderPreviewHtml(layout: Layout): string {
  const elements = layout.elements
    .slice()
    .sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0))
    .map((el) => {
      const style = `position:absolute;left:${el.x}mm;top:${el.y}mm;width:${el.w}mm;height:${el.h}mm;z-index:${el.zIndex ?? 1};`;
      if (el.type === 'text') return `<div style="${style}font-family:'${el.fontFamily}';font-size:${el.fontSize}pt;font-weight:${el.fontWeight};color:${el.color};text-align:${el.textAlign};${el.italic ? 'font-style:italic;' : ''}letter-spacing:${el.letterSpacing ?? 0}em;line-height:1.1;">${el.text ?? ''}</div>`;
      if (el.type === 'field') return `<div style="${style}font-family:'${el.fontFamily}';font-size:${el.fontSize}pt;font-weight:${el.fontWeight};color:${el.color};text-align:${el.textAlign};${el.italic ? 'font-style:italic;' : ''}letter-spacing:${el.letterSpacing ?? 0}em;line-height:1.1;">${el.field ? FIELD_PREVIEWS[el.field] : ''}</div>`;
      if (el.type === 'shape') return `<div style="${style}background:${el.fill};border-radius:${el.borderRadius ?? 0}mm;"></div>`;
      if (el.type === 'image' && el.imageUrl) return `<img src="${el.imageUrl}" style="${style}object-fit:contain;" />`;
      if (el.type === 'qr') return `<div style="${style}background:#000;display:flex;align-items:center;justify-content:center;color:#fff;font-family:monospace;">▦ QR</div>`;
      return '';
    })
    .join('');

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Preview</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Inter:wght@400;500;600;700;800&family=Playfair+Display:wght@500;600;700;800;900&family=JetBrains+Mono:wght@400&display=swap" rel="stylesheet">
<style>@page{size:A4 landscape;margin:0}*{box-sizing:border-box;margin:0;padding:0}html,body{width:${layout.width}mm;height:${layout.height}mm;background:${layout.pageColor};position:relative;overflow:hidden}</style>
</head><body>${elements}</body></html>`;
}
