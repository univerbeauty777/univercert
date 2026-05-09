// UniverCert · Layout V2 (S21)
// Spec do layoutJson novo usado pelo TemplateEditorV2.
//
// Filosofia "import-first":
//   - Background = imagem/PDF/SVG do design ja pronto
//   - Fields = blocos de texto/imagem posicionados em cima
//   - QR sempre obrigatorio (forcado mesmo se editor remover)
//
// Coordenadas: % da pagina (0..100). Permite responsivo entre A4/Letter.

export type Orientation = 'landscape' | 'portrait';

export type LayoutBackground = {
  type: 'image' | 'svg' | 'pdf' | 'color';
  /** Pra image/svg/pdf: URL do asset (rota /api/v1/assets/<key>). Pra color: '#hex' ou rgb(). */
  src: string;
  /** Opacity 0..1 (default 1) */
  opacity?: number;
  /** Se true, background cobre 100% da pagina (object-fit: cover); senao contain. */
  cover?: boolean;
};

export type FieldType =
  | 'text'              // texto livre
  | 'recipientName'     // {{recipientName}}
  | 'courseName'        // {{courseName}}
  | 'courseHours'       // {{courseHours}} horas
  | 'cpf'               // CPF formatado
  | 'date'              // data emissao
  | 'city'              // cidade (config workspace)
  | 'workspaceName'     // nome da escola
  | 'verifyUrl'         // URL pra verificacao
  | 'credentialId'      // ID curto
  | 'qr'                // QR code (auto-renderizado, OBRIGATORIO 1+ no template)
  | 'image';            // logo/signature/seal (asset url)

export type Alignment = 'left' | 'center' | 'right';

export type FieldStyle = {
  fontFamily?: string;            // 'Inter', 'Cormorant Garamond', 'Playfair Display', etc
  fontSize?: number;              // pt
  fontWeight?: number | 'normal' | 'bold';
  color?: string;                 // #hex
  align?: Alignment;
  letterSpacing?: number;         // em
  lineHeight?: number;
  italic?: boolean;
  uppercase?: boolean;
  underline?: boolean;
  /** Pra image fields: object-fit (default contain) */
  fit?: 'contain' | 'cover' | 'fill';
};

export type LayoutField = {
  id: string;
  type: FieldType;
  /** Posicao % (0..100) e tamanho % */
  x: number; y: number; w: number; h: number;
  /** Conteudo: pra text use string; pra image use URL/key; demais sao auto */
  content?: string;
  /** Pra image fields */
  src?: string;
  /** Estilo */
  style?: FieldStyle;
  /** z-index simples (default = posicao no array) */
  z?: number;
  /** Permite locked (nao move no editor) */
  locked?: boolean;
};

export type LayoutV2 = {
  version: 2;
  orientation: Orientation;
  pageSize?: 'A4' | 'Letter';     // default A4
  background?: LayoutBackground;
  fields: LayoutField[];
  /** Metadata pra editor */
  meta?: {
    name?: string;
    notes?: string;
    importedFrom?: string;        // 'png' | 'pdf' | 'svg' | 'figma' | 'canva' | 'manual'
  };
};

/* ============================================================
 * RENDERER
 * Gera HTML A4 com background + fields posicionados absolute.
 * ============================================================ */

import { formatCpf, formatDate, escapeHtml, type CertArgs } from '@/lib/cert-template-shared';

export type { CertArgs };

/** Resolve o conteudo de um field a partir dos dados do certificado */
function resolveContent(field: LayoutField, args: CertArgs): string {
  if (field.type === 'text') return field.content ?? '';
  if (field.type === 'recipientName') return args.recipientName;
  if (field.type === 'courseName') return args.courseName;
  if (field.type === 'courseHours') return args.courseHours ? `${args.courseHours} horas` : '';
  if (field.type === 'cpf') return formatCpf(args.cpf) ?? '';
  if (field.type === 'date') return formatDate(args.issuedAt);
  if (field.type === 'city') return args.city ?? '';
  if (field.type === 'workspaceName') return args.workspaceName;
  if (field.type === 'verifyUrl') return args.verifyUrl;
  if (field.type === 'credentialId') return args.credentialId;
  return '';
}

function styleString(s?: FieldStyle): string {
  if (!s) return '';
  const out: string[] = [];
  if (s.fontFamily) out.push(`font-family: '${s.fontFamily}', serif`);
  if (s.fontSize) out.push(`font-size: ${s.fontSize}pt`);
  if (s.fontWeight) out.push(`font-weight: ${s.fontWeight}`);
  if (s.color) out.push(`color: ${s.color}`);
  if (s.align) out.push(`text-align: ${s.align}`);
  if (s.letterSpacing) out.push(`letter-spacing: ${s.letterSpacing}em`);
  if (s.lineHeight) out.push(`line-height: ${s.lineHeight}`);
  if (s.italic) out.push(`font-style: italic`);
  if (s.uppercase) out.push(`text-transform: uppercase`);
  if (s.underline) out.push(`text-decoration: underline`);
  return out.join('; ');
}

function fieldHtml(field: LayoutField, args: CertArgs): string {
  const pos = `position:absolute; left:${field.x}%; top:${field.y}%; width:${field.w}%; height:${field.h}%; z-index:${field.z ?? 1};`;

  if (field.type === 'qr') {
    const src = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&format=png&margin=2&data=${encodeURIComponent(args.verifyUrl)}`;
    return `<div style="${pos} display:flex; align-items:center; justify-content:center;">
      <img src="${src}" alt="QR" style="width:100%; height:100%; object-fit:contain;" />
    </div>`;
  }

  if (field.type === 'image') {
    const src = field.src ?? '';
    const fit = field.style?.fit ?? 'contain';
    return `<div style="${pos}"><img src="${escapeHtml(src)}" alt="" style="width:100%; height:100%; object-fit:${fit}; display:block;" /></div>`;
  }

  const content = resolveContent(field, args);
  const css = styleString(field.style);
  const flexAlign = field.style?.align === 'center' ? 'center' : field.style?.align === 'right' ? 'flex-end' : 'flex-start';
  return `<div style="${pos} display:flex; align-items:center; justify-content:${flexAlign}; ${css}; box-sizing:border-box; padding:0 4px; word-break:break-word;">
    <span style="display:inline-block; width:100%;">${escapeHtml(content)}</span>
  </div>`;
}

/** Garante QR obrigatorio. Se o user removeu, adiciona um padrao no canto inferior direito. */
function ensureQr(layout: LayoutV2): LayoutV2 {
  const hasQr = layout.fields.some((f) => f.type === 'qr');
  if (hasQr) return layout;
  const qrField: LayoutField = {
    id: 'auto-qr',
    type: 'qr',
    x: 86, y: 80, w: 12, h: 18,
    z: 999,
    locked: true,
  };
  return { ...layout, fields: [...layout.fields, qrField] };
}

/** Renderiza HTML completo do certificado a partir do layout V2 */
export function renderLayoutV2(rawLayout: LayoutV2, args: CertArgs): string {
  const layout = ensureQr(rawLayout);
  const isLandscape = layout.orientation === 'landscape';
  const pageSize = layout.pageSize ?? 'A4';
  const dims = isLandscape ? '297mm 210mm' : '210mm 297mm';
  const w = isLandscape ? '297mm' : '210mm';
  const h = isLandscape ? '210mm' : '297mm';

  const bg = layout.background;
  let bgStyle = 'background: #ffffff;';
  if (bg) {
    if (bg.type === 'color') {
      bgStyle = `background: ${bg.src};`;
    } else if (bg.type === 'image' || bg.type === 'svg') {
      const fit = bg.cover ? 'cover' : 'contain';
      bgStyle = `background: #fff url('${escapeHtml(bg.src)}') no-repeat center center / ${fit}; ${bg.opacity ? `opacity:${bg.opacity};` : ''}`;
    } else if (bg.type === 'pdf') {
      // PDF embedded — usa <object>; fallback white
      bgStyle = 'background: #fff;';
    }
  }

  const sortedFields = [...layout.fields].sort((a, b) => (a.z ?? 1) - (b.z ?? 1));

  return `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="UTF-8">
<title>Certificado · ${escapeHtml(args.recipientName)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Inter:wght@300;400;500;600;700;800&family=Playfair+Display:wght@400;500;600;700;800&family=Cinzel:wght@500;700&family=Archivo+Black&family=JetBrains+Mono&family=Dancing+Script&display=swap" rel="stylesheet">
<style>
@page { size: ${pageSize} ${isLandscape ? 'landscape' : 'portrait'}; margin: 0; }
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { width: ${w}; height: ${h}; }
body { font-family: 'Inter', sans-serif; color: #0A0E1A; position: relative; overflow: hidden; -webkit-font-smoothing: antialiased; ${bgStyle} }
.page-bg { position: absolute; inset: 0; z-index: 0; }
.field-layer { position: absolute; inset: 0; z-index: 10; }
${bg && bg.type === 'pdf' ? `
.pdf-bg { position: absolute; inset: 0; z-index: 0; pointer-events: none; }
.pdf-bg object, .pdf-bg embed { width: 100%; height: 100%; }
` : ''}
</style></head>
<body>
${bg && bg.type === 'pdf' ? `<div class="pdf-bg"><object data="${escapeHtml(bg.src)}" type="application/pdf"></object></div>` : ''}
<div class="field-layer">
  ${sortedFields.map((f) => fieldHtml(f, args)).join('\n  ')}
</div>
</body></html>`;
}

/** Layout default pro editor — cabecalho/recipiente/curso/data/QR base */
export function blankLayout(orientation: Orientation = 'landscape'): LayoutV2 {
  return {
    version: 2,
    orientation,
    pageSize: 'A4',
    background: { type: 'color', src: '#ffffff' },
    fields: [
      { id: 'f-title', type: 'text', content: 'CERTIFICADO', x: 10, y: 10, w: 80, h: 12, style: { fontFamily: 'Playfair Display', fontSize: 36, fontWeight: 700, align: 'center', color: '#1B2D5E' } },
      { id: 'f-pre', type: 'text', content: 'Certificamos que', x: 10, y: 30, w: 80, h: 6, style: { fontSize: 12, align: 'center', color: '#6B7280' } },
      { id: 'f-recipient', type: 'recipientName', x: 10, y: 38, w: 80, h: 14, style: { fontFamily: 'Cormorant Garamond', fontSize: 36, fontWeight: 600, align: 'center', color: '#0A0E1A' } },
      { id: 'f-pre2', type: 'text', content: 'concluiu o curso de', x: 10, y: 56, w: 80, h: 6, style: { fontSize: 12, align: 'center', color: '#6B7280' } },
      { id: 'f-course', type: 'courseName', x: 10, y: 64, w: 80, h: 10, style: { fontFamily: 'Cormorant Garamond', fontSize: 22, fontWeight: 600, align: 'center', color: '#1B2D5E' } },
      { id: 'f-hours', type: 'courseHours', x: 10, y: 76, w: 80, h: 6, style: { fontSize: 11, align: 'center', color: '#6B7280' } },
      { id: 'f-date', type: 'date', x: 10, y: 86, w: 60, h: 5, style: { fontSize: 10, align: 'center', color: '#6B7280' } },
      { id: 'f-qr', type: 'qr', x: 86, y: 80, w: 12, h: 18, locked: true, z: 999 },
    ],
  };
}
