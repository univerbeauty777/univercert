// UniverCert · cert template · Sprint 11 GODMODE
// Layout editorial premium · A4 landscape · 2 variantes (classic, modern)

type Args = {
  recipientName: string;
  cpf: string | null;
  courseName: string;
  courseHours: number | null;
  issuedAt: number;
  credentialId: string;
  hashSha256?: string;
  workspaceName: string;
  verifyUrl: string;
  primaryColor?: string;
  accentColor?: string;
  variant?: 'classic' | 'modern' | 'gold' | 'minimal' | 'executive' | 'creative' | 'botanical' | 'sunset' | 'notebook' | 'techgrid' | 'artdeco' | 'newspaper' | 'diploma' | 'holographic' | 'watermark' | 'coach' | 'custom';
  customLayoutJson?: string; // usado quando variant === 'custom'
};

// Catalogo público de variantes — usado pela galeria /templates
export const CERT_VARIANTS = [
  { id: 'classic', name: 'Classic', tagline: 'Editorial elegante', desc: 'Tipografia serifada, borda dupla ornamental, sensação de papel antigo. Ideal pra cursos livres e tradicionais.', defaultPrimary: '#1B2D5E', defaultAccent: '#D4A937' },
  { id: 'modern', name: 'Modern', tagline: 'Tech minimalista', desc: 'Banda lateral colorida, sans-serif bold. Pra cursos tech, marketing, design.', defaultPrimary: '#1B2D5E', defaultAccent: '#D4A937' },
  { id: 'gold', name: 'Gold', tagline: 'Luxo executive', desc: 'Dourado dominante, ornamentos art déco, papel cremoso. Pra cursos premium, estética, MBA.', defaultPrimary: '#0A1224', defaultAccent: '#D4A937' },
  { id: 'minimal', name: 'Minimal', tagline: 'Swiss style', desc: 'Branco absoluto, 1 acento de cor, geometria precisa. Pra cursos de design, arquitetura.', defaultPrimary: '#0A0E1A', defaultAccent: '#1B2D5E' },
  { id: 'executive', name: 'Executive', tagline: 'Corporate dark', desc: 'Fundo escuro premium, tipografia robusta, severo. Pra cursos de gestão, finanças, executivos.', defaultPrimary: '#0A1224', defaultAccent: '#D4A937' },
  { id: 'creative', name: 'Creative', tagline: 'Artistic gradient', desc: 'Gradient bold, tipografia oversized, vibrante. Pra cursos criativos, beleza, audiovisual.', defaultPrimary: '#1B2D5E', defaultAccent: '#EC4899' },
  { id: 'botanical', name: 'Botanical', tagline: 'Orgânico premium', desc: 'Bordas com folhagem SVG, paleta verde/dourada, serif elegante. Ideal pra bem-estar, yoga, cosmética natural.', defaultPrimary: '#1F4E3D', defaultAccent: '#C49C5C' },
  { id: 'sunset', name: 'Sunset', tagline: 'Vibrante moderno', desc: 'Gradient laranja → rosa → roxo, sans bold, energia geração Z. Pra cursos digitais e criadores de conteúdo.', defaultPrimary: '#FB923C', defaultAccent: '#A855F7' },
  { id: 'notebook', name: 'Notebook', tagline: 'Caderno escolar', desc: 'Linhas pautadas, fonte handwritten, vibe acadêmica. Pra educação infantil, professores, formação.', defaultPrimary: '#1E3A8A', defaultAccent: '#9CA3AF' },
  { id: 'techgrid', name: 'TechGrid', tagline: 'Cyberpunk dark', desc: 'Background grid neon, monospace, dark mode com cyan/magenta. Pra programação, IA, dados, tech.', defaultPrimary: '#06B6D4', defaultAccent: '#EC4899' },
  { id: 'artdeco', name: 'Art Déco', tagline: '1920s luxo', desc: 'Geometria art déco, ornamentos triangulares dourados, preto e ouro. Pra moda, joalheria, beleza luxo.', defaultPrimary: '#0A0A0A', defaultAccent: '#D4AF37' },
  { id: 'newspaper', name: 'Newspaper', tagline: 'Jornal vintage', desc: 'Tipografia jornal clássico, duas colunas, ornamentos. Pra jornalismo, literatura, oratória.', defaultPrimary: '#1A1A1A', defaultAccent: '#7A7A7A' },
  { id: 'diploma', name: 'Diploma', tagline: 'Universitário formal', desc: 'A4 retrato, brasão SVG, sépia, formato diploma. Pra graduações e diplomas formais.', defaultPrimary: '#3B2F1E', defaultAccent: '#A8843E' },
  { id: 'holographic', name: 'Holographic', tagline: 'Web3 futurista', desc: 'Gradient shimmer multicolor (purple→blue→green), futurista. Pra cursos online, NFTs, web3.', defaultPrimary: '#8B5CF6', defaultAccent: '#10B981' },
  { id: 'watermark', name: 'Watermark', tagline: 'Editorial soft', desc: 'Marca d’água gigante translúcida do nome do curso. Branco/cinza claro, contemplativo. Pra fotografia, arte.', defaultPrimary: '#1F2937', defaultAccent: '#9CA3AF' },
  { id: 'coach', name: 'Coach', tagline: 'Motivacional bold', desc: 'Tipografia gritante, gradient laranja/vermelho, alta energia. Pra coaching, desenvolvimento pessoal, mentoria.', defaultPrimary: '#DC2626', defaultAccent: '#F59E0B' },
] as const;

function formatCpf(cpf: string | null): string | null {
  if (!cpf) return null;
  const c = cpf.replace(/\D/g, '');
  if (c.length !== 11) return cpf;
  return `${c.slice(0, 3)}.${c.slice(3, 6)}.${c.slice(6, 9)}-${c.slice(9)}`;
}

function formatDate(unix: number): string {
  return new Date(unix * 1000).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric',
  });
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

export function renderCertificateHtml(args: Args): string {
  const variant = args.variant ?? 'classic';
  switch (variant) {
    case 'modern': return renderModern(args);
    case 'gold': return renderGold(args);
    case 'minimal': return renderMinimal(args);
    case 'executive': return renderExecutive(args);
    case 'creative': return renderCreative(args);
    case 'botanical': return renderBotanical(args);
    case 'sunset': return renderSunset(args);
    case 'notebook': return renderNotebook(args);
    case 'techgrid': return renderTechGrid(args);
    case 'artdeco': return renderArtDeco(args);
    case 'newspaper': return renderNewspaper(args);
    case 'diploma': return renderDiploma(args);
    case 'holographic': return renderHolographic(args);
    case 'watermark': return renderWatermark(args);
    case 'coach': return renderCoach(args);
    case 'custom': return renderCustom(args);
    case 'classic':
    default: return renderClassic(args);
  }
}

// ============================================================
// CUSTOM — renderer pra layouts criados no editor visual (Sprint 14)
// ============================================================
type CustomElement = {
  id: string;
  type: 'text' | 'field' | 'image' | 'shape' | 'qr';
  x: number; y: number; w: number; h: number;
  text?: string;
  field?: string;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: number;
  color?: string;
  textAlign?: string;
  italic?: boolean;
  letterSpacing?: number;
  fill?: string;
  borderRadius?: number;
  imageUrl?: string;
  zIndex?: number;
};

type CustomLayout = {
  v: 1;
  pageColor: string;
  width: number;
  height: number;
  elements: CustomElement[];
};

function renderCustom(args: Args): string {
  if (!args.customLayoutJson) return renderClassic(args); // fallback
  let layout: CustomLayout;
  try { layout = JSON.parse(args.customLayoutJson) as CustomLayout; }
  catch { return renderClassic(args); }

  const fieldValue = (key: string): string => {
    switch (key) {
      case 'recipientName': return escapeHtml(args.recipientName);
      case 'courseName': return escapeHtml(args.courseName);
      case 'courseHours': return args.courseHours ? `${args.courseHours} horas` : '—';
      case 'cpf': return formatCpf(args.cpf) ?? '—';
      case 'issuedAt': return formatDate(args.issuedAt);
      case 'workspaceName': return escapeHtml(args.workspaceName);
      case 'verifyUrl': return escapeHtml(args.verifyUrl);
      case 'credentialId': return escapeHtml(args.credentialId);
      default: return '';
    }
  };

  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&format=png&margin=2&data=${encodeURIComponent(args.verifyUrl)}`;

  const els = layout.elements
    .slice()
    .sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0))
    .map((el) => {
      const baseStyle = `position:absolute;left:${el.x}mm;top:${el.y}mm;width:${el.w}mm;height:${el.h}mm;z-index:${el.zIndex ?? 1};`;
      if (el.type === 'text') {
        const ts = `${baseStyle}font-family:'${el.fontFamily ?? 'Inter'}',sans-serif;font-size:${el.fontSize ?? 12}pt;font-weight:${el.fontWeight ?? 400};color:${el.color ?? '#000'};text-align:${el.textAlign ?? 'left'};${el.italic ? 'font-style:italic;' : ''}letter-spacing:${el.letterSpacing ?? 0}em;line-height:1.1;`;
        return `<div style="${ts}">${escapeHtml(el.text ?? '')}</div>`;
      }
      if (el.type === 'field') {
        const ts = `${baseStyle}font-family:'${el.fontFamily ?? 'Inter'}',sans-serif;font-size:${el.fontSize ?? 12}pt;font-weight:${el.fontWeight ?? 400};color:${el.color ?? '#000'};text-align:${el.textAlign ?? 'left'};${el.italic ? 'font-style:italic;' : ''}letter-spacing:${el.letterSpacing ?? 0}em;line-height:1.1;`;
        return `<div style="${ts}">${fieldValue(el.field ?? '')}</div>`;
      }
      if (el.type === 'shape') {
        return `<div style="${baseStyle}background:${el.fill ?? '#000'};border-radius:${el.borderRadius ?? 0}mm;"></div>`;
      }
      if (el.type === 'image' && el.imageUrl) {
        // Whitelist origins seguros
        const safe = /^https?:\/\/(api\.qrserver\.com|.*\.r2\.cloudflarestorage\.com|.*\.univercert\.com\.br|cdn\.univercert\.com\.br)\//.test(el.imageUrl);
        if (!safe) return '';
        return `<img src="${el.imageUrl}" style="${baseStyle}object-fit:contain;" alt="" />`;
      }
      if (el.type === 'qr') {
        return `<img src="${qrSrc}" style="${baseStyle}object-fit:contain;background:#fff;padding:1mm;" alt="QR" />`;
      }
      return '';
    })
    .join('');

  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8">
<title>Certificado · ${escapeHtml(args.recipientName)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Inter:wght@400;500;600;700;800&family=Playfair+Display:wght@500;600;700;800;900&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
@page { size: A4 landscape; margin: 0; }
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { width: ${layout.width}mm; height: ${layout.height}mm; background: ${layout.pageColor}; position: relative; overflow: hidden; -webkit-font-smoothing: antialiased; }
</style></head>
<body>${els}</body></html>`;
}

// Helper SVG do escudo (reutilizado por todas variantes)
function shieldSvg(primary: string, accent: string): string {
  return `<svg viewBox="0 0 100 110" xmlns="http://www.w3.org/2000/svg"><path d="M50 4 C50 4, 18 10, 12 14 L12 52 C12 76, 28 96, 50 106 C72 96, 88 76, 88 52 L88 14 C82 10, 50 4, 50 4 Z" fill="${primary}"/><circle cx="50" cy="56" r="32" fill="none" stroke="${accent}" stroke-width="2.5" opacity="0.55"/><circle cx="50" cy="56" r="24" fill="none" stroke="${accent}" stroke-width="2.5" opacity="0.75"/><circle cx="50" cy="56" r="14" fill="${primary}"/><path d="M42 56 L48 62 L60 50" stroke="${accent}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>`;
}

// ============================================================
// CLASSIC — Editorial elegante (Cormorant Garamond no nome)
// ============================================================
function renderClassic(args: Args): string {
  const cpfFormatted = formatCpf(args.cpf);
  const dateFormatted = formatDate(args.issuedAt);
  const primary = args.primaryColor ?? '#1B2D5E';
  const accent = args.accentColor ?? '#D4A937';
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&format=png&margin=2&data=${encodeURIComponent(args.verifyUrl)}`;
  const hashShort = args.hashSha256 ? args.hashSha256.slice(0, 16) + '…' + args.hashSha256.slice(-8) : '';

  return `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="UTF-8">
<title>Certificado · ${escapeHtml(args.recipientName)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
@page { size: A4 landscape; margin: 0; }
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { width: 297mm; height: 210mm; }
body { font-family: 'Inter', sans-serif; background: #FFFEF7; color: #0A0E1A; position: relative; overflow: hidden; -webkit-font-smoothing: antialiased; font-feature-settings: 'kern','liga'; }
.bg-mesh { position: absolute; inset: 0; pointer-events: none;
  background: radial-gradient(at 0% 0%, ${primary}10 0px, transparent 40%), radial-gradient(at 100% 0%, ${accent}10 0px, transparent 40%), radial-gradient(at 50% 100%, ${primary}08 0px, transparent 50%); }
.frame-outer { position: absolute; inset: 8mm; border: 1px solid ${primary}30; border-radius: 2mm; }
.frame-inner { position: absolute; inset: 11mm; border: 2px solid ${primary}; border-radius: 1.5mm; }
.frame-inner::before, .frame-inner::after { content: ''; position: absolute; width: 12mm; height: 12mm; border: 2px solid ${accent}; }
.frame-inner::before { top: -1px; left: -1px; border-right: none; border-bottom: none; border-radius: 1.5mm 0 0 0; }
.frame-inner::after { bottom: -1px; right: -1px; border-left: none; border-top: none; border-radius: 0 0 1.5mm 0; }
.top-stripe { position: absolute; top: 11mm; left: 11mm; right: 11mm; height: 6mm;
  background: linear-gradient(90deg, ${primary} 0%, ${accent} 100%); border-radius: 1.5mm 1.5mm 0 0; }
.content { position: absolute; inset: 11mm; padding: 18mm 22mm 16mm 22mm; display: flex; flex-direction: column; text-align: center; }
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14mm; }
.org-block { display: flex; align-items: center; gap: 3mm; }
.org-icon { width: 14mm; height: 14mm; background: ${primary}; border-radius: 3mm; display: flex; align-items: center; justify-content: center; box-shadow: 0 2mm 4mm ${primary}40; position: relative; }
.org-icon svg { width: 100%; height: 100%; }
.org-name { font-weight: 800; font-size: 11pt; color: ${primary}; letter-spacing: 0.06em; text-transform: uppercase; text-align: left; }
.org-tagline { font-size: 7.5pt; color: #6B7280; font-weight: 500; margin-top: 1mm; letter-spacing: 0.02em; }
.verified-seal { display: inline-flex; align-items: center; gap: 2mm; padding: 2.5mm 5mm;
  background: linear-gradient(135deg, #10B981, #059669); color: #fff; font-size: 8.5pt; font-weight: 700;
  border-radius: 999pt; text-transform: uppercase; letter-spacing: 0.08em; box-shadow: 0 1.5mm 4mm rgba(16,185,129,0.35); }
.verified-seal .check { width: 4mm; height: 4mm; background: #fff; color: #10B981; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 7pt; }
.cert-label { font-size: 9.5pt; letter-spacing: 0.4em; text-transform: uppercase; color: ${primary}; font-weight: 700; margin-bottom: 4mm; }
.cert-label::before, .cert-label::after { content: ''; display: inline-block; width: 18mm; height: 1px; background: ${primary}40; vertical-align: middle; margin: 0 6mm; }
.pre-name { font-family: 'Cormorant Garamond'; font-size: 13pt; font-style: italic; color: #6B7280; font-weight: 500; margin-bottom: 4mm; }
.recipient-name { font-family: 'Cormorant Garamond'; font-size: 56pt; font-weight: 600; letter-spacing: -0.02em; line-height: 1.05; margin: 2mm 0 8mm;
  background: linear-gradient(135deg, #0A0E1A 25%, ${primary} 100%); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; color: transparent; }
.description { font-size: 12pt; color: #4B5563; margin-bottom: 4mm; font-weight: 400; }
.course-name { font-family: 'Cormorant Garamond'; font-size: 28pt; font-weight: 600; color: ${primary}; letter-spacing: -0.01em; line-height: 1.15; margin-bottom: 14mm; padding: 0 12mm; }
.meta { display: flex; justify-content: center; gap: 14mm; padding-top: 6mm; border-top: 0.5px solid ${primary}30; font-size: 10pt; margin-top: auto; }
.meta-item .lbl { font-size: 7.5pt; color: #9CA3AF; text-transform: uppercase; letter-spacing: 0.12em; font-weight: 700; margin-bottom: 1.5mm; }
.meta-item .val { font-weight: 600; color: #0A0E1A; font-feature-settings: 'tnum'; }
.footer { position: absolute; bottom: 14mm; left: 22mm; right: 22mm; display: flex; justify-content: space-between; align-items: flex-end; font-size: 7.5pt; color: #6B7280; z-index: 3; }
.verify-line { font-size: 8pt; color: #4B5563; font-weight: 500; margin-bottom: 1.5mm; }
.verify-line strong { color: ${primary}; font-weight: 700; }
.id-line { font-family: 'JetBrains Mono', monospace; font-size: 7pt; color: #9CA3AF; }
.hash-line { font-family: 'JetBrains Mono', monospace; font-size: 6.5pt; color: #C0C5CC; margin-top: 0.5mm; }
.qr-block { text-align: center; }
.qr { width: 22mm; height: 22mm; background: #fff; padding: 1mm; border: 0.5px solid #E5E7EB; border-radius: 1.5mm; box-shadow: 0 1mm 3mm rgba(0,0,0,0.06); }
.qr img { width: 100%; height: 100%; display: block; }
.qr-label { font-size: 6pt; color: #9CA3AF; margin-top: 1mm; text-transform: uppercase; letter-spacing: 0.08em; font-weight: 600; }
.watermark { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-25deg); font-family: 'Cormorant Garamond'; font-size: 90pt; font-weight: 600; color: ${primary}06; letter-spacing: 0.4em; pointer-events: none; z-index: 1; text-transform: uppercase; }
</style></head>
<body>
<div class="bg-mesh"></div>
<div class="watermark">UniverCert</div>
<div class="frame-outer"></div>
<div class="frame-inner"></div>
<div class="top-stripe"></div>
<div class="content">
<div class="header">
  <div class="org-block">
    <div class="org-icon"><svg viewBox="0 0 100 110" xmlns="http://www.w3.org/2000/svg"><path d="M50 4 C50 4, 18 10, 12 14 L12 52 C12 76, 28 96, 50 106 C72 96, 88 76, 88 52 L88 14 C82 10, 50 4, 50 4 Z" fill="${primary}"/><circle cx="50" cy="56" r="32" fill="none" stroke="${accent}" stroke-width="2.5" opacity="0.55"/><circle cx="50" cy="56" r="24" fill="none" stroke="${accent}" stroke-width="2.5" opacity="0.75"/><circle cx="50" cy="56" r="14" fill="${primary}"/><path d="M42 56 L48 62 L60 50" stroke="${accent}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg></div>
    <div>
      <div class="org-name">${escapeHtml(args.workspaceName)}</div>
      <div class="org-tagline">Certificação Digital · Verificável 24/7</div>
    </div>
  </div>
  <div class="verified-seal"><span class="check">✓</span> Verificado</div>
</div>
<div class="cert-label">Certificado de Conclusão</div>
<div class="pre-name">conferimos a</div>
<h1 class="recipient-name">${escapeHtml(args.recipientName)}</h1>
<div class="description">por concluir com aproveitamento o curso de</div>
<div class="course-name">${escapeHtml(args.courseName)}</div>
<div class="meta">
  ${args.courseHours ? `<div class="meta-item"><div class="lbl">Carga horária</div><div class="val">${args.courseHours} horas</div></div>` : ''}
  ${cpfFormatted ? `<div class="meta-item"><div class="lbl">CPF</div><div class="val">${cpfFormatted}</div></div>` : ''}
  <div class="meta-item"><div class="lbl">Emitido em</div><div class="val">${dateFormatted}</div></div>
</div>
</div>
<div class="footer">
<div>
  <div class="verify-line">Verifique a autenticidade em <strong>${escapeHtml(args.verifyUrl)}</strong></div>
  <div class="id-line">ID: ${escapeHtml(args.credentialId)}</div>
  ${hashShort ? `<div class="hash-line">SHA-256: ${escapeHtml(hashShort)}</div>` : ''}
</div>
<div class="qr-block">
  <div class="qr"><img src="${qrSrc}" alt="QR" /></div>
  <div class="qr-label">Escaneie para verificar</div>
</div>
</div>
</body></html>`;
}

// ============================================================
// MODERN — Banda lateral, tech badge style
// ============================================================
function renderModern(args: Args): string {
  const cpfFormatted = formatCpf(args.cpf);
  const dateFormatted = formatDate(args.issuedAt);
  const primary = args.primaryColor ?? '#1B2D5E';
  const accent = args.accentColor ?? '#D4A937';
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&format=png&margin=2&data=${encodeURIComponent(args.verifyUrl)}`;

  return `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="UTF-8">
<title>Certificado · ${escapeHtml(args.recipientName)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
@page { size: A4 landscape; margin: 0; }
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { width: 297mm; height: 210mm; }
body { font-family: 'Inter', sans-serif; background: #FAFBFD; color: #0A0E1A; position: relative; overflow: hidden; }
.side-band { position: absolute; left: 0; top: 0; bottom: 0; width: 25mm; background: linear-gradient(180deg, ${primary} 0%, ${accent} 100%); }
.side-band-icon { position: absolute; top: 50%; left: 12.5mm; transform: translate(-50%, -50%); color: #fff; font-size: 36pt; font-weight: 800; writing-mode: vertical-rl; letter-spacing: 0.2em; }
.content { margin-left: 25mm; padding: 22mm 22mm 22mm 18mm; height: 210mm; display: flex; flex-direction: column; }
.top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 18mm; }
.org { font-weight: 800; font-size: 10pt; color: ${primary}; letter-spacing: 0.08em; text-transform: uppercase; }
.verified { display: inline-flex; align-items: center; gap: 2mm; padding: 2mm 4mm; background: rgba(16,185,129,0.1); color: #059669; font-size: 8pt; font-weight: 700; border-radius: 999pt; border: 1px solid rgba(16,185,129,0.3); }
.label-tag { display: inline-block; font-size: 9pt; font-weight: 800; color: ${primary}; letter-spacing: 0.3em; text-transform: uppercase; padding: 2mm 5mm; background: ${primary}10; border-radius: 999pt; margin-bottom: 8mm; }
.recipient-name { font-size: 60pt; font-weight: 800; line-height: 0.95; letter-spacing: -0.04em; color: #0A0E1A; margin-bottom: 8mm; }
.description { font-size: 13pt; color: #4B5563; margin-bottom: 4mm; }
.course-name { font-size: 22pt; font-weight: 700; color: ${primary}; margin-bottom: 14mm; line-height: 1.2; }
.meta { display: flex; gap: 14mm; margin-bottom: auto; padding-top: 6mm; border-top: 2px solid ${primary}15; }
.meta-item .lbl { font-size: 7pt; color: #9CA3AF; text-transform: uppercase; letter-spacing: 0.15em; font-weight: 700; margin-bottom: 1mm; }
.meta-item .val { font-weight: 700; color: #0A0E1A; font-size: 12pt; }
.footer { display: flex; justify-content: space-between; align-items: flex-end; padding-top: 8mm; border-top: 1px solid #E5E7EB; }
.verify-info { font-size: 8pt; color: #6B7280; }
.verify-info strong { color: ${primary}; }
.credential-id { font-family: 'JetBrains Mono', monospace; font-size: 7pt; color: #9CA3AF; margin-top: 1mm; }
.qr { width: 24mm; height: 24mm; background: #fff; padding: 1mm; border: 1px solid #E5E7EB; border-radius: 2mm; }
.qr img { width: 100%; height: 100%; }
</style></head>
<body>
<div class="side-band"><div class="side-band-icon">UNIVERCERT</div></div>
<div class="content">
<div class="top">
  <div class="org">${escapeHtml(args.workspaceName)}</div>
  <div class="verified">✓ Verified</div>
</div>
<div class="label-tag">Certificado de Conclusão</div>
<h1 class="recipient-name">${escapeHtml(args.recipientName)}</h1>
<div class="description">concluiu o curso de</div>
<div class="course-name">${escapeHtml(args.courseName)}</div>
<div class="meta">
  ${args.courseHours ? `<div class="meta-item"><div class="lbl">Carga</div><div class="val">${args.courseHours}h</div></div>` : ''}
  ${cpfFormatted ? `<div class="meta-item"><div class="lbl">CPF</div><div class="val">${cpfFormatted}</div></div>` : ''}
  <div class="meta-item"><div class="lbl">Data</div><div class="val">${dateFormatted}</div></div>
</div>
<div class="footer">
  <div>
    <div class="verify-info">Verifique em <strong>${escapeHtml(args.verifyUrl)}</strong></div>
    <div class="credential-id">${escapeHtml(args.credentialId)}</div>
  </div>
  <div class="qr"><img src="${qrSrc}" alt="QR" /></div>
</div>
</div>
</body></html>`;
}

// ============================================================
// GOLD — Luxo executive, dourado dominante, ornamentos art déco
// ============================================================
function renderGold(args: Args): string {
  const cpfFormatted = formatCpf(args.cpf);
  const dateFormatted = formatDate(args.issuedAt);
  const primary = args.primaryColor ?? '#0A1224';
  const accent = args.accentColor ?? '#D4A937';
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&format=png&margin=2&data=${encodeURIComponent(args.verifyUrl)}`;

  return `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="UTF-8">
<title>Certificado · ${escapeHtml(args.recipientName)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700;800;900&family=Cormorant+Garamond:wght@500;600&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<style>
@page { size: A4 landscape; margin: 0; }
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { width: 297mm; height: 210mm; }
body { font-family: 'Inter', sans-serif; background: #FAF6E8; color: ${primary}; position: relative; overflow: hidden; }
/* Papel cremoso com vinheta */
.paper-bg { position: absolute; inset: 0; background: radial-gradient(ellipse at center, #FFFCEF 0%, #FAF6E8 70%, #F0E8C8 100%); }
/* Borda dourada externa grossa */
.border-1 { position: absolute; inset: 8mm; border: 4px solid ${accent}; }
.border-2 { position: absolute; inset: 11mm; border: 1px solid ${accent}; }
.border-3 { position: absolute; inset: 13mm; border: 0.5px solid ${accent}80; }
/* Cantos ornamentais art déco */
.corner { position: absolute; width: 28mm; height: 28mm; }
.corner svg { width: 100%; height: 100%; }
.corner-tl { top: 9mm; left: 9mm; }
.corner-tr { top: 9mm; right: 9mm; transform: scaleX(-1); }
.corner-bl { bottom: 9mm; left: 9mm; transform: scaleY(-1); }
.corner-br { bottom: 9mm; right: 9mm; transform: scale(-1, -1); }

.content { position: absolute; inset: 18mm; padding: 12mm 14mm; display: flex; flex-direction: column; text-align: center; }
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8mm; }
.org { display: flex; align-items: center; gap: 3mm; }
.org-icon { width: 14mm; height: 14mm; }
.org-icon svg { width: 100%; height: 100%; }
.org-name { font-family: 'Playfair Display'; font-weight: 700; font-size: 12pt; color: ${primary}; letter-spacing: 0.04em; text-align: left; }
.verified { padding: 2mm 5mm; background: ${primary}; color: ${accent}; font-size: 8pt; font-weight: 700; border-radius: 999pt; text-transform: uppercase; letter-spacing: 0.15em; border: 1px solid ${accent}; }

.cert-label { font-family: 'Cormorant Garamond'; font-style: italic; font-size: 14pt; color: ${accent}; letter-spacing: 0.3em; text-transform: uppercase; margin-bottom: 4mm; }
.divider-ornament { display: flex; align-items: center; justify-content: center; gap: 4mm; margin-bottom: 6mm; }
.divider-ornament .line { flex: 0 1 60mm; height: 1px; background: linear-gradient(90deg, transparent, ${accent}, transparent); }
.divider-ornament .diamond { width: 4mm; height: 4mm; background: ${accent}; transform: rotate(45deg); }
.pre-name { font-family: 'Cormorant Garamond'; font-style: italic; font-size: 14pt; color: #6B5A2D; margin-bottom: 4mm; }
.recipient-name { font-family: 'Playfair Display'; font-weight: 800; font-size: 64pt; line-height: 1.0; color: ${primary}; margin: 4mm 0 8mm; letter-spacing: -0.02em; }
.description { font-family: 'Cormorant Garamond'; font-style: italic; font-size: 14pt; color: #4B3F1A; margin-bottom: 4mm; }
.course-name { font-family: 'Playfair Display'; font-weight: 700; font-size: 26pt; color: ${primary}; line-height: 1.2; margin-bottom: 12mm; padding: 0 16mm; }
.course-name::before, .course-name::after { content: '"'; color: ${accent}; }

.meta { display: flex; justify-content: center; gap: 16mm; padding-top: 6mm; border-top: 1px solid ${accent}40; margin-top: auto; }
.meta-item .lbl { font-size: 7.5pt; color: #6B5A2D; text-transform: uppercase; letter-spacing: 0.18em; font-weight: 600; margin-bottom: 1.5mm; font-family: 'Inter'; }
.meta-item .val { font-family: 'Playfair Display'; font-weight: 600; color: ${primary}; font-size: 12pt; }

.footer { position: absolute; bottom: 16mm; left: 24mm; right: 24mm; display: flex; justify-content: space-between; align-items: flex-end; font-size: 7.5pt; color: #6B5A2D; }
.verify-info strong { color: ${accent}; }
.qr { width: 22mm; height: 22mm; background: #fff; padding: 1mm; border: 2px solid ${accent}; }
.qr img { width: 100%; height: 100%; }

/* Watermark dourado sutil */
.watermark { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-family: 'Playfair Display'; font-size: 200pt; font-weight: 900; color: ${accent}06; letter-spacing: 0.05em; pointer-events: none; }
</style></head>
<body>
<div class="paper-bg"></div>
<div class="watermark">★</div>
<div class="border-1"></div>
<div class="border-2"></div>
<div class="border-3"></div>

<svg class="corner corner-tl" viewBox="0 0 100 100"><g fill="none" stroke="${accent}" stroke-width="1.5"><path d="M0 0 L80 0 M0 0 L0 80"/><path d="M10 0 L10 60" opacity="0.6"/><path d="M0 10 L60 10" opacity="0.6"/><circle cx="20" cy="20" r="6" stroke-width="1"/><path d="M30 30 L60 30 M30 30 L30 60" opacity="0.4"/></g></svg>
<svg class="corner corner-tr" viewBox="0 0 100 100"><g fill="none" stroke="${accent}" stroke-width="1.5"><path d="M0 0 L80 0 M0 0 L0 80"/><path d="M10 0 L10 60" opacity="0.6"/><path d="M0 10 L60 10" opacity="0.6"/><circle cx="20" cy="20" r="6" stroke-width="1"/></g></svg>
<svg class="corner corner-bl" viewBox="0 0 100 100"><g fill="none" stroke="${accent}" stroke-width="1.5"><path d="M0 0 L80 0 M0 0 L0 80"/><path d="M10 0 L10 60" opacity="0.6"/><path d="M0 10 L60 10" opacity="0.6"/><circle cx="20" cy="20" r="6" stroke-width="1"/></g></svg>
<svg class="corner corner-br" viewBox="0 0 100 100"><g fill="none" stroke="${accent}" stroke-width="1.5"><path d="M0 0 L80 0 M0 0 L0 80"/><path d="M10 0 L10 60" opacity="0.6"/><path d="M0 10 L60 10" opacity="0.6"/><circle cx="20" cy="20" r="6" stroke-width="1"/></g></svg>

<div class="content">
  <div class="header">
    <div class="org">
      <div class="org-icon">${shieldSvg(primary, accent)}</div>
      <div class="org-name">${escapeHtml(args.workspaceName)}</div>
    </div>
    <div class="verified">★ Verificado</div>
  </div>

  <div class="cert-label">Certificate of Achievement</div>
  <div class="divider-ornament">
    <span class="line"></span>
    <span class="diamond"></span>
    <span class="diamond"></span>
    <span class="diamond"></span>
    <span class="line"></span>
  </div>
  <div class="pre-name">presented to</div>
  <h1 class="recipient-name">${escapeHtml(args.recipientName)}</h1>
  <div class="description">in recognition of completion of</div>
  <div class="course-name">${escapeHtml(args.courseName)}</div>

  <div class="meta">
    ${args.courseHours ? `<div class="meta-item"><div class="lbl">Hours</div><div class="val">${args.courseHours}</div></div>` : ''}
    ${cpfFormatted ? `<div class="meta-item"><div class="lbl">ID</div><div class="val">${cpfFormatted}</div></div>` : ''}
    <div class="meta-item"><div class="lbl">Date</div><div class="val">${dateFormatted}</div></div>
  </div>
</div>

<div class="footer">
  <div>
    <div class="verify-info">Verify at <strong>${escapeHtml(args.verifyUrl)}</strong></div>
    <div style="font-family: monospace; font-size: 7pt; opacity: 0.7;">${escapeHtml(args.credentialId)}</div>
  </div>
  <div class="qr"><img src="${qrSrc}" alt="QR" /></div>
</div>
</body></html>`;
}

// ============================================================
// MINIMAL — Swiss style, branco absoluto, geometria precisa
// ============================================================
function renderMinimal(args: Args): string {
  const cpfFormatted = formatCpf(args.cpf);
  const dateFormatted = formatDate(args.issuedAt);
  const primary = args.primaryColor ?? '#0A0E1A';
  const accent = args.accentColor ?? '#1B2D5E';
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&format=png&margin=2&data=${encodeURIComponent(args.verifyUrl)}`;

  return `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="UTF-8">
<title>Certificado · ${escapeHtml(args.recipientName)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
@page { size: A4 landscape; margin: 0; }
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { width: 297mm; height: 210mm; }
body { font-family: 'Inter', sans-serif; background: #FFFFFF; color: ${primary}; position: relative; overflow: hidden; -webkit-font-smoothing: antialiased; }

/* Grid lines sutis (swiss) */
.grid { position: absolute; inset: 0; pointer-events: none; opacity: 0.05; background-image: linear-gradient(${accent} 1px, transparent 1px), linear-gradient(90deg, ${accent} 1px, transparent 1px); background-size: 20mm 20mm; }

.content { position: absolute; inset: 0; padding: 25mm 30mm; display: flex; flex-direction: column; }

.header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 8mm; border-bottom: 1px solid ${primary}; margin-bottom: 14mm; }
.brand { display: flex; align-items: center; gap: 4mm; }
.brand-icon { width: 12mm; height: 12mm; }
.brand-icon svg { width: 100%; height: 100%; }
.brand-meta { font-size: 8pt; color: #6B7280; letter-spacing: 0.06em; line-height: 1.4; }
.brand-meta strong { color: ${primary}; font-weight: 700; text-transform: uppercase; letter-spacing: 0.15em; display: block; }
.serial { font-family: 'JetBrains Mono'; font-size: 8pt; color: #9CA3AF; text-align: right; }
.serial strong { color: ${primary}; }

.label { font-size: 8pt; letter-spacing: 0.4em; text-transform: uppercase; color: #9CA3AF; font-weight: 600; margin-bottom: 6mm; }

.recipient-name { font-size: 72pt; font-weight: 800; line-height: 0.95; letter-spacing: -0.04em; color: ${primary}; margin-bottom: 8mm; max-width: 90%; }

.divider { width: 24mm; height: 4px; background: ${accent}; margin-bottom: 8mm; }

.description { font-size: 14pt; color: #4B5563; max-width: 80%; line-height: 1.5; margin-bottom: 4mm; }
.course-name { font-size: 24pt; font-weight: 700; color: ${accent}; margin-bottom: 12mm; line-height: 1.2; }

.meta-row { display: flex; gap: 16mm; padding-top: 8mm; border-top: 1px solid ${primary}20; margin-top: auto; }
.meta-item .lbl { font-size: 7pt; letter-spacing: 0.2em; text-transform: uppercase; color: #9CA3AF; font-weight: 700; margin-bottom: 1mm; }
.meta-item .val { font-size: 11pt; font-weight: 600; color: ${primary}; }

.footer { display: flex; justify-content: space-between; align-items: flex-end; padding-top: 6mm; }
.verify-info { font-size: 8pt; color: #6B7280; line-height: 1.5; }
.verify-info strong { color: ${accent}; font-weight: 700; }
.cred-id { font-family: 'JetBrains Mono'; font-size: 7pt; color: #9CA3AF; margin-top: 1mm; }
.qr { width: 22mm; height: 22mm; background: #fff; border: 1px solid ${primary}; padding: 1mm; }
.qr img { width: 100%; height: 100%; }
</style></head>
<body>
<div class="grid"></div>
<div class="content">
  <div class="header">
    <div class="brand">
      <div class="brand-icon">${shieldSvg(primary, accent)}</div>
      <div class="brand-meta">
        <strong>${escapeHtml(args.workspaceName)}</strong>
        Certificação Digital · ${dateFormatted}
      </div>
    </div>
    <div class="serial">
      <strong>Nº ${escapeHtml(args.credentialId.slice(-8))}</strong><br>
      ${dateFormatted}
    </div>
  </div>

  <div class="label">Certificado · 01</div>
  <h1 class="recipient-name">${escapeHtml(args.recipientName)}</h1>
  <div class="divider"></div>
  <div class="description">concluiu com aproveitamento o curso de</div>
  <div class="course-name">${escapeHtml(args.courseName)}</div>

  <div class="meta-row">
    ${args.courseHours ? `<div class="meta-item"><div class="lbl">Carga horária</div><div class="val">${args.courseHours} horas</div></div>` : ''}
    ${cpfFormatted ? `<div class="meta-item"><div class="lbl">CPF</div><div class="val">${cpfFormatted}</div></div>` : ''}
    <div class="meta-item"><div class="lbl">Emissão</div><div class="val">${dateFormatted}</div></div>
  </div>

  <div class="footer">
    <div>
      <div class="verify-info">Verifique em <strong>${escapeHtml(args.verifyUrl)}</strong></div>
      <div class="cred-id">${escapeHtml(args.credentialId)}</div>
    </div>
    <div class="qr"><img src="${qrSrc}" alt="QR" /></div>
  </div>
</div>
</body></html>`;
}

// ============================================================
// EXECUTIVE — Corporate dark, MBA-style, severo
// ============================================================
function renderExecutive(args: Args): string {
  const cpfFormatted = formatCpf(args.cpf);
  const dateFormatted = formatDate(args.issuedAt);
  const primary = args.primaryColor ?? '#0A1224';
  const accent = args.accentColor ?? '#D4A937';
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&format=png&margin=2&data=${encodeURIComponent(args.verifyUrl)}`;

  return `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="UTF-8">
<title>Certificado · ${escapeHtml(args.recipientName)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400&display=swap" rel="stylesheet">
<style>
@page { size: A4 landscape; margin: 0; }
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { width: 297mm; height: 210mm; }
body { font-family: 'Inter', sans-serif; background: ${primary}; color: #FFFFFF; position: relative; overflow: hidden; }

.bg-pattern { position: absolute; inset: 0; opacity: 0.06; background-image: linear-gradient(45deg, transparent 49%, ${accent} 49%, ${accent} 51%, transparent 51%); background-size: 12mm 12mm; }
.gradient-overlay { position: absolute; inset: 0; background: radial-gradient(circle at top right, ${accent}15 0%, transparent 60%); }
.gold-stripe-top { position: absolute; top: 0; left: 0; right: 0; height: 8mm; background: linear-gradient(90deg, ${accent} 0%, ${accent}90 50%, ${accent} 100%); }
.gold-stripe-bottom { position: absolute; bottom: 0; left: 0; right: 0; height: 8mm; background: linear-gradient(90deg, ${accent} 0%, ${accent}90 50%, ${accent} 100%); }

.content { position: absolute; inset: 14mm 22mm; display: flex; flex-direction: column; }
.header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16mm; padding-bottom: 6mm; border-bottom: 1px solid ${accent}40; }
.brand { display: flex; align-items: center; gap: 4mm; }
.brand-icon { width: 14mm; height: 14mm; }
.brand-icon svg { width: 100%; height: 100%; }
.brand-info .name { font-size: 12pt; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: ${accent}; }
.brand-info .sub { font-size: 8pt; color: #FFFFFF80; margin-top: 1mm; letter-spacing: 0.04em; }
.seal { padding: 3mm 6mm; border: 1.5px solid ${accent}; color: ${accent}; font-size: 9pt; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; }

.cert-label { font-family: 'Cormorant Garamond'; font-style: italic; font-size: 16pt; color: ${accent}; margin-bottom: 8mm; }
.recipient-name { font-family: 'Cormorant Garamond'; font-weight: 700; font-size: 64pt; line-height: 1.0; color: #FFFFFF; margin-bottom: 12mm; letter-spacing: -0.02em; }
.description { font-size: 13pt; color: #FFFFFFB0; max-width: 80%; margin-bottom: 6mm; line-height: 1.5; }
.course-name { font-family: 'Cormorant Garamond'; font-weight: 700; font-size: 32pt; color: ${accent}; line-height: 1.15; margin-bottom: 14mm; letter-spacing: -0.01em; }

.meta-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8mm; padding: 6mm 0; border-top: 1px solid ${accent}40; border-bottom: 1px solid ${accent}40; margin-top: auto; }
.meta-item { padding: 0 4mm; }
.meta-item .lbl { font-size: 7.5pt; letter-spacing: 0.2em; text-transform: uppercase; color: ${accent}; font-weight: 700; margin-bottom: 1.5mm; }
.meta-item .val { font-size: 13pt; font-weight: 600; color: #FFFFFF; }

.footer { display: flex; justify-content: space-between; align-items: flex-end; padding-top: 6mm; }
.verify-info { font-size: 8pt; color: #FFFFFF90; }
.verify-info strong { color: ${accent}; }
.cred-id { font-family: 'JetBrains Mono'; font-size: 7pt; color: #FFFFFF60; margin-top: 1mm; }
.qr { width: 22mm; height: 22mm; background: #fff; padding: 1mm; }
.qr img { width: 100%; height: 100%; }
</style></head>
<body>
<div class="bg-pattern"></div>
<div class="gradient-overlay"></div>
<div class="gold-stripe-top"></div>
<div class="gold-stripe-bottom"></div>

<div class="content">
  <div class="header">
    <div class="brand">
      <div class="brand-icon">${shieldSvg('#FFFFFF20', accent)}</div>
      <div class="brand-info">
        <div class="name">${escapeHtml(args.workspaceName)}</div>
        <div class="sub">Executive Education · Certified Program</div>
      </div>
    </div>
    <div class="seal">Verified</div>
  </div>

  <div class="cert-label">Certificate of Completion</div>
  <h1 class="recipient-name">${escapeHtml(args.recipientName)}</h1>
  <div class="description">has successfully completed all requirements and demonstrated proficiency in</div>
  <div class="course-name">${escapeHtml(args.courseName)}</div>

  <div class="meta-grid">
    <div class="meta-item"><div class="lbl">Course Hours</div><div class="val">${args.courseHours ? args.courseHours + ' hours' : '—'}</div></div>
    <div class="meta-item"><div class="lbl">Issued</div><div class="val">${dateFormatted}</div></div>
    <div class="meta-item"><div class="lbl">${cpfFormatted ? 'Document' : 'Reference'}</div><div class="val">${cpfFormatted ?? args.credentialId.slice(-8)}</div></div>
  </div>

  <div class="footer">
    <div>
      <div class="verify-info">Verify authenticity at <strong>${escapeHtml(args.verifyUrl)}</strong></div>
      <div class="cred-id">${escapeHtml(args.credentialId)}</div>
    </div>
    <div class="qr"><img src="${qrSrc}" alt="QR" /></div>
  </div>
</div>
</body></html>`;
}

// ============================================================
// CREATIVE — Gradient bold, oversized typography, vibrante
// ============================================================
function renderCreative(args: Args): string {
  const cpfFormatted = formatCpf(args.cpf);
  const dateFormatted = formatDate(args.issuedAt);
  const primary = args.primaryColor ?? '#1B2D5E';
  const accent = args.accentColor ?? '#EC4899';
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&format=png&margin=2&data=${encodeURIComponent(args.verifyUrl)}`;

  return `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="UTF-8">
<title>Certificado · ${escapeHtml(args.recipientName)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@500;700;800;900&family=JetBrains+Mono:wght@400&display=swap" rel="stylesheet">
<style>
@page { size: A4 landscape; margin: 0; }
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { width: 297mm; height: 210mm; }
body { font-family: 'Inter', sans-serif; background: #FFFFFF; color: ${primary}; position: relative; overflow: hidden; }

/* Mesh gradient bold */
.mesh { position: absolute; inset: 0; background:
  radial-gradient(at 0% 0%, ${primary}80 0px, transparent 50%),
  radial-gradient(at 100% 0%, ${accent}90 0px, transparent 50%),
  radial-gradient(at 100% 100%, ${primary}60 0px, transparent 50%),
  radial-gradient(at 0% 100%, ${accent}40 0px, transparent 50%);
}
/* Card branco interno */
.card-inner { position: absolute; inset: 14mm; background: #FFFFFF; border-radius: 6mm; box-shadow: 0 20px 60px rgba(0,0,0,0.15); overflow: hidden; }

.content { padding: 16mm 18mm; height: 100%; display: flex; flex-direction: column; position: relative; }

/* Confetti decorativo */
.confetti { position: absolute; pointer-events: none; }
.confetti.c1 { top: 8mm; right: 24mm; width: 14mm; height: 14mm; background: ${accent}; border-radius: 50%; opacity: 0.18; }
.confetti.c2 { top: 28mm; right: 10mm; width: 8mm; height: 8mm; background: ${primary}; transform: rotate(20deg); opacity: 0.15; }
.confetti.c3 { bottom: 16mm; right: 30mm; width: 18mm; height: 18mm; border: 3px solid ${accent}; border-radius: 50%; opacity: 0.2; }
.confetti.c4 { bottom: 30mm; left: 12mm; width: 10mm; height: 10mm; background: ${primary}; opacity: 0.12; transform: rotate(45deg); }

.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6mm; }
.brand { display: flex; align-items: center; gap: 3mm; }
.brand-icon { width: 13mm; height: 13mm; }
.brand-icon svg { width: 100%; height: 100%; }
.brand-name { font-weight: 800; font-size: 11pt; color: ${primary}; letter-spacing: 0.06em; text-transform: uppercase; }
.tag { padding: 2mm 5mm; background: linear-gradient(135deg, ${primary}, ${accent}); color: #fff; font-size: 8pt; font-weight: 800; border-radius: 999pt; text-transform: uppercase; letter-spacing: 0.15em; }

.kicker { font-size: 9pt; font-weight: 800; letter-spacing: 0.4em; text-transform: uppercase; color: ${accent}; margin-bottom: 4mm; margin-top: 4mm; }
.recipient-name { font-size: 84pt; font-weight: 900; line-height: 0.92; letter-spacing: -0.05em; margin-bottom: 6mm;
  background: linear-gradient(135deg, ${primary} 0%, ${accent} 100%);
  -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; color: transparent; }
.description { font-size: 14pt; color: #4B5563; margin-bottom: 4mm; font-weight: 500; }
.course-name { font-size: 32pt; font-weight: 800; color: ${primary}; line-height: 1.1; margin-bottom: 10mm; max-width: 90%; }

.meta { display: flex; gap: 6mm; flex-wrap: wrap; padding: 4mm 0; margin-bottom: auto; }
.chip { display: inline-flex; align-items: center; gap: 2mm; padding: 2.5mm 5mm; background: ${primary}10; color: ${primary}; font-size: 9pt; font-weight: 700; border-radius: 999pt; letter-spacing: 0.04em; }
.chip strong { font-weight: 900; }

.footer { display: flex; justify-content: space-between; align-items: flex-end; padding-top: 6mm; border-top: 2px solid ${accent}; }
.verify-info { font-size: 8.5pt; color: #4B5563; font-weight: 600; }
.verify-info strong { color: ${primary}; }
.cred-id { font-family: 'JetBrains Mono'; font-size: 7pt; color: #9CA3AF; margin-top: 1mm; }
.qr { width: 22mm; height: 22mm; background: #fff; border: 2px solid ${primary}; padding: 1mm; border-radius: 3mm; }
.qr img { width: 100%; height: 100%; }
</style></head>
<body>
<div class="mesh"></div>
<div class="card-inner">
<div class="content">
  <div class="confetti c1"></div>
  <div class="confetti c2"></div>
  <div class="confetti c3"></div>
  <div class="confetti c4"></div>

  <div class="header">
    <div class="brand">
      <div class="brand-icon">${shieldSvg(primary, accent)}</div>
      <div class="brand-name">${escapeHtml(args.workspaceName)}</div>
    </div>
    <div class="tag">✓ Conclusão</div>
  </div>

  <div class="kicker">Aluno em destaque</div>
  <h1 class="recipient-name">${escapeHtml(args.recipientName)}</h1>
  <div class="description">arrasou no curso de</div>
  <div class="course-name">${escapeHtml(args.courseName)}!</div>

  <div class="meta">
    ${args.courseHours ? `<span class="chip">⏱ <strong>${args.courseHours}h</strong></span>` : ''}
    ${cpfFormatted ? `<span class="chip">🆔 <strong>${cpfFormatted}</strong></span>` : ''}
    <span class="chip">📅 <strong>${dateFormatted}</strong></span>
  </div>

  <div class="footer">
    <div>
      <div class="verify-info">Verifique em <strong>${escapeHtml(args.verifyUrl)}</strong></div>
      <div class="cred-id">${escapeHtml(args.credentialId)}</div>
    </div>
    <div class="qr"><img src="${qrSrc}" alt="QR" /></div>
  </div>
</div>
</div>
</body></html>`;
}

// ============================================================
// BOTANICAL — Orgânico, ramos/folhas, bem-estar/yoga
// ============================================================
function renderBotanical(args: Args): string {
  const cpfFormatted = formatCpf(args.cpf);
  const dateFormatted = formatDate(args.issuedAt);
  const primary = args.primaryColor ?? '#5B7553';
  const accent = args.accentColor ?? '#F5E6D3';
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&format=png&margin=2&data=${encodeURIComponent(args.verifyUrl)}`;
  const hashShort = args.hashSha256 ? args.hashSha256.slice(0, 12) + '…' + args.hashSha256.slice(-6) : '';

  const leaf = (rot: number) => `<svg viewBox="0 0 80 200" xmlns="http://www.w3.org/2000/svg" style="transform:rotate(${rot}deg)"><g fill="none" stroke="${primary}" stroke-width="1.2" opacity="0.65"><path d="M40 10 Q40 100 40 190" stroke-width="1.5"/><path d="M40 30 Q15 40 8 60 Q22 60 40 50" fill="${primary}" opacity="0.45"/><path d="M40 30 Q65 40 72 60 Q58 60 40 50" fill="${primary}" opacity="0.45"/><path d="M40 70 Q12 82 4 105 Q22 102 40 90" fill="${primary}" opacity="0.5"/><path d="M40 70 Q68 82 76 105 Q58 102 40 90" fill="${primary}" opacity="0.5"/><path d="M40 115 Q14 128 6 152 Q24 148 40 135" fill="${primary}" opacity="0.55"/><path d="M40 115 Q66 128 74 152 Q56 148 40 135" fill="${primary}" opacity="0.55"/></g></svg>`;

  return `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="UTF-8">
<title>Certificado · ${escapeHtml(args.recipientName)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=Dancing+Script:wght@500;700&display=swap" rel="stylesheet">
<style>
@page { size: A4 landscape; margin: 0; }
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { width: 297mm; height: 210mm; }
body { font-family: 'Inter', sans-serif; background: ${accent}; color: #2C3A28; position: relative; overflow: hidden; }
.bg-tint { position: absolute; inset: 0; background: radial-gradient(ellipse at center, #FFFCF5 0%, ${accent} 75%); }
.leaf { position: absolute; opacity: 0.85; }
.leaf-tl { top: -10mm; left: -8mm; width: 60mm; height: 130mm; }
.leaf-tr { top: -10mm; right: -8mm; width: 60mm; height: 130mm; transform: scaleX(-1); }
.leaf-bl { bottom: -10mm; left: -8mm; width: 50mm; height: 110mm; transform: scaleY(-1); }
.leaf-br { bottom: -10mm; right: -8mm; width: 50mm; height: 110mm; transform: scale(-1,-1); }
.frame { position: absolute; inset: 12mm; border: 1px solid ${primary}55; border-radius: 4mm; }
.content { position: absolute; inset: 16mm; padding: 14mm 26mm; display: flex; flex-direction: column; align-items: center; text-align: center; }
.org { display: flex; align-items: center; gap: 3mm; margin-bottom: 10mm; }
.org-icon { width: 12mm; height: 12mm; border-radius: 50%; background: ${primary}; color: #fff; display: flex; align-items: center; justify-content: center; font-family: 'Cormorant Garamond'; font-weight: 700; font-size: 16pt; }
.org-name { font-family: 'Cormorant Garamond'; font-weight: 600; font-size: 13pt; color: ${primary}; letter-spacing: 0.06em; text-transform: uppercase; }
.kicker { font-family: 'Cormorant Garamond'; font-style: italic; font-size: 13pt; color: ${primary}; letter-spacing: 0.3em; text-transform: uppercase; margin-bottom: 4mm; }
.divider { display: flex; align-items: center; gap: 3mm; margin-bottom: 5mm; }
.divider .l { width: 30mm; height: 1px; background: ${primary}80; }
.divider .d { width: 8mm; height: 8mm; }
.divider .d svg { width: 100%; height: 100%; }
.pre { font-family: 'Cormorant Garamond'; font-style: italic; font-size: 13pt; color: #4A5544; margin-bottom: 3mm; }
.recipient { font-family: 'Dancing Script'; font-weight: 700; font-size: 64pt; color: ${primary}; line-height: 1.0; margin-bottom: 8mm; }
.desc { font-family: 'Cormorant Garamond'; font-size: 13pt; color: #4A5544; margin-bottom: 3mm; }
.course { font-family: 'Cormorant Garamond'; font-weight: 600; font-size: 24pt; color: ${primary}; line-height: 1.2; margin-bottom: 10mm; max-width: 80%; }
.meta { display: flex; gap: 14mm; padding-top: 5mm; border-top: 1px dashed ${primary}80; margin-top: auto; }
.m .lbl { font-size: 7.5pt; color: ${primary}; letter-spacing: 0.15em; text-transform: uppercase; font-weight: 600; margin-bottom: 1mm; }
.m .val { font-family: 'Cormorant Garamond'; font-weight: 600; font-size: 12pt; color: #2C3A28; }
.footer { position: absolute; bottom: 16mm; left: 24mm; right: 24mm; display: flex; justify-content: space-between; align-items: flex-end; font-size: 7.5pt; color: ${primary}; }
.qr { width: 22mm; height: 22mm; background: #fff; padding: 1mm; border-radius: 50%; border: 1px solid ${primary}; }
.qr img { width: 100%; height: 100%; border-radius: 50%; }
.id { font-family: monospace; font-size: 7pt; opacity: 0.7; margin-top: 1mm; }
</style></head>
<body>
<div class="bg-tint"></div>
<div class="leaf leaf-tl">${leaf(0)}</div>
<div class="leaf leaf-tr">${leaf(0)}</div>
<div class="leaf leaf-bl">${leaf(0)}</div>
<div class="leaf leaf-br">${leaf(0)}</div>
<div class="frame"></div>
<div class="content">
  <div class="org"><div class="org-icon">${escapeHtml(args.workspaceName.charAt(0))}</div><div class="org-name">${escapeHtml(args.workspaceName)}</div></div>
  <div class="kicker">Certificado de Conclusão</div>
  <div class="divider"><span class="l"></span><span class="d"><svg viewBox="0 0 20 20"><path d="M10 2 Q4 6 4 10 Q4 14 10 18 Q16 14 16 10 Q16 6 10 2 Z" fill="${primary}" opacity="0.7"/></svg></span><span class="l"></span></div>
  <div class="pre">conferimos com gratidão a</div>
  <h1 class="recipient">${escapeHtml(args.recipientName)}</h1>
  <div class="desc">por concluir a jornada de</div>
  <div class="course">${escapeHtml(args.courseName)}</div>
  <div class="meta">
    ${args.courseHours ? `<div class="m"><div class="lbl">Carga</div><div class="val">${args.courseHours} horas</div></div>` : ''}
    ${cpfFormatted ? `<div class="m"><div class="lbl">CPF</div><div class="val">${cpfFormatted}</div></div>` : ''}
    <div class="m"><div class="lbl">Emitido em</div><div class="val">${dateFormatted}</div></div>
  </div>
</div>
<div class="footer">
  <div>
    <div>Verifique em <strong style="color:${primary}">${escapeHtml(args.verifyUrl)}</strong></div>
    <div class="id">ID: ${escapeHtml(args.credentialId)}</div>
    ${hashShort ? `<div class="id">SHA-256: ${escapeHtml(hashShort)}</div>` : ''}
  </div>
  <div class="qr"><img src="${qrSrc}" alt="QR"/></div>
</div>
</body></html>`;
}

// ============================================================
// SUNSET — Gradient curve quente, geração Z, digital
// ============================================================
function renderSunset(args: Args): string {
  const cpfFormatted = formatCpf(args.cpf);
  const dateFormatted = formatDate(args.issuedAt);
  const primary = args.primaryColor ?? '#FF6B35';
  const accent = args.accentColor ?? '#F77F00';
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&format=png&margin=2&data=${encodeURIComponent(args.verifyUrl)}`;
  const hashShort = args.hashSha256 ? args.hashSha256.slice(0, 12) + '…' + args.hashSha256.slice(-6) : '';

  return `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="UTF-8">
<title>Certificado · ${escapeHtml(args.recipientName)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&family=Space+Grotesk:wght@500;700&display=swap" rel="stylesheet">
<style>
@page { size: A4 landscape; margin: 0; }
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { width: 297mm; height: 210mm; }
body { font-family: 'Inter', sans-serif; background: #FFF8F0; color: #1F1505; position: relative; overflow: hidden; }
.curve { position: absolute; top: 0; left: 0; right: 0; height: 95mm; background: linear-gradient(135deg, #FFD166 0%, ${accent} 35%, ${primary} 70%, #C2185B 100%); border-bottom-left-radius: 50% 30mm; border-bottom-right-radius: 50% 30mm; }
.sun { position: absolute; top: 12mm; right: 24mm; width: 30mm; height: 30mm; border-radius: 50%; background: radial-gradient(circle, #FFE066 0%, #FFD166 60%, transparent 100%); opacity: 0.7; }
.content { position: absolute; inset: 0; padding: 26mm 24mm; display: flex; flex-direction: column; }
.header { display: flex; justify-content: space-between; align-items: center; color: #fff; margin-bottom: 24mm; position: relative; z-index: 2; }
.brand { font-family: 'Space Grotesk'; font-weight: 700; font-size: 14pt; letter-spacing: 0.1em; text-transform: uppercase; }
.tag { padding: 2mm 5mm; background: rgba(255,255,255,0.25); backdrop-filter: blur(4px); border-radius: 999pt; font-size: 9pt; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; border: 1px solid rgba(255,255,255,0.5); }
.label { font-family: 'Space Grotesk'; font-size: 11pt; font-weight: 700; letter-spacing: 0.4em; text-transform: uppercase; color: ${primary}; margin-bottom: 4mm; }
.recipient { font-size: 76pt; font-weight: 900; line-height: 0.92; letter-spacing: -0.04em; color: #1F1505; margin-bottom: 8mm; }
.desc { font-size: 13pt; color: #4B3B1F; margin-bottom: 3mm; font-weight: 500; }
.course { font-size: 28pt; font-weight: 800; line-height: 1.1; margin-bottom: 10mm; max-width: 88%;
  background: linear-gradient(90deg, ${primary}, ${accent}); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; color: transparent; }
.chips { display: flex; gap: 4mm; margin-bottom: auto; flex-wrap: wrap; }
.chip { padding: 2.5mm 5mm; background: #fff; border: 2px solid ${primary}; color: ${primary}; font-weight: 700; font-size: 9.5pt; border-radius: 999pt; }
.chip strong { color: #1F1505; font-weight: 900; }
.footer { display: flex; justify-content: space-between; align-items: flex-end; padding-top: 6mm; border-top: 3px solid ${primary}; font-size: 8pt; color: #4B3B1F; }
.footer strong { color: ${primary}; }
.id { font-family: 'Space Grotesk'; font-size: 7pt; color: #9CA3AF; margin-top: 1mm; }
.qr { width: 22mm; height: 22mm; padding: 1mm; background: #fff; border: 2px solid ${primary}; border-radius: 4mm; }
.qr img { width: 100%; height: 100%; }
</style></head>
<body>
<div class="curve"></div>
<div class="sun"></div>
<div class="content">
  <div class="header">
    <div class="brand">${escapeHtml(args.workspaceName)}</div>
    <div class="tag">Verified</div>
  </div>
  <div class="label">You did it!</div>
  <h1 class="recipient">${escapeHtml(args.recipientName)}</h1>
  <div class="desc">acabou de concluir</div>
  <div class="course">${escapeHtml(args.courseName)}</div>
  <div class="chips">
    ${args.courseHours ? `<span class="chip">⏱ <strong>${args.courseHours}h</strong></span>` : ''}
    ${cpfFormatted ? `<span class="chip">ID <strong>${cpfFormatted}</strong></span>` : ''}
    <span class="chip">📅 <strong>${dateFormatted}</strong></span>
  </div>
  <div class="footer">
    <div>
      <div>Confirme em <strong>${escapeHtml(args.verifyUrl)}</strong></div>
      <div class="id">${escapeHtml(args.credentialId)}${hashShort ? ' · ' + escapeHtml(hashShort) : ''}</div>
    </div>
    <div class="qr"><img src="${qrSrc}" alt="QR"/></div>
  </div>
</div>
</body></html>`;
}

// ============================================================
// NOTEBOOK — Papel pautado, handwritten, escolar
// ============================================================
function renderNotebook(args: Args): string {
  const cpfFormatted = formatCpf(args.cpf);
  const dateFormatted = formatDate(args.issuedAt);
  const primary = args.primaryColor ?? '#1E3A8A';
  const accent = args.accentColor ?? '#DC2626';
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&format=png&margin=2&data=${encodeURIComponent(args.verifyUrl)}`;
  const hashShort = args.hashSha256 ? args.hashSha256.slice(0, 12) + '…' + args.hashSha256.slice(-6) : '';

  return `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="UTF-8">
<title>Certificado · ${escapeHtml(args.recipientName)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Caveat:wght@500;600;700&family=Inter:wght@400;500;600;700&family=Patrick+Hand&display=swap" rel="stylesheet">
<style>
@page { size: A4 landscape; margin: 0; }
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { width: 297mm; height: 210mm; }
body { font-family: 'Patrick Hand', cursive; background: #FFFEF6; color: #1F2937; position: relative; overflow: hidden;
  background-image: repeating-linear-gradient(180deg, transparent 0, transparent 7.5mm, ${primary}28 7.5mm, ${primary}28 7.6mm); }
.margin-line { position: absolute; left: 32mm; top: 0; bottom: 0; width: 1px; background: ${accent}; opacity: 0.6; }
.holes { position: absolute; left: 14mm; top: 0; bottom: 0; display: flex; flex-direction: column; justify-content: space-around; padding: 18mm 0; }
.hole { width: 6mm; height: 6mm; border-radius: 50%; background: #fff; border: 1px solid ${primary}40; box-shadow: inset 0 1px 2px rgba(0,0,0,0.1); }
.content { position: absolute; inset: 0; padding: 18mm 22mm 18mm 42mm; display: flex; flex-direction: column; }
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6mm; }
.brand { font-family: 'Caveat'; font-weight: 700; font-size: 22pt; color: ${primary}; }
.brand small { font-family: 'Inter'; font-size: 9pt; color: #6B7280; font-weight: 500; display: block; margin-top: -2mm; }
.stamp { color: ${accent}; border: 3px solid ${accent}; padding: 2mm 5mm; transform: rotate(-6deg); font-family: 'Caveat'; font-weight: 700; font-size: 16pt; letter-spacing: 0.1em; text-transform: uppercase; opacity: 0.85; }
.title-line { font-family: 'Caveat'; font-weight: 700; font-size: 30pt; color: ${primary}; margin-bottom: 4mm; }
.note { font-size: 18pt; color: #1F2937; margin-bottom: 6mm; }
.recipient { font-family: 'Caveat'; font-weight: 700; font-size: 64pt; color: ${accent}; line-height: 0.95; margin-bottom: 6mm; text-decoration: underline; text-decoration-color: ${primary}40; text-decoration-thickness: 1.5mm; text-underline-offset: 4mm; }
.body { font-size: 17pt; color: #1F2937; margin-bottom: 4mm; line-height: 1.4; }
.course-line { font-family: 'Caveat'; font-weight: 600; font-size: 32pt; color: ${primary}; margin-bottom: 8mm; line-height: 1.1; }
.meta-notes { display: flex; gap: 10mm; font-family: 'Caveat'; font-size: 18pt; color: #1F2937; margin-bottom: auto; padding: 4mm 0; }
.meta-notes b { color: ${accent}; }
.footer { display: flex; justify-content: space-between; align-items: flex-end; padding-top: 6mm; border-top: 2px dashed ${accent}; font-family: 'Inter'; font-size: 8pt; color: #6B7280; }
.footer strong { color: ${primary}; }
.id { font-family: monospace; font-size: 7pt; color: #9CA3AF; margin-top: 1mm; }
.qr { width: 22mm; height: 22mm; padding: 1mm; background: #fff; border: 2px solid ${primary}; }
.qr img { width: 100%; height: 100%; }
</style></head>
<body>
<div class="margin-line"></div>
<div class="holes"><div class="hole"></div><div class="hole"></div><div class="hole"></div><div class="hole"></div><div class="hole"></div></div>
<div class="content">
  <div class="header">
    <div class="brand">${escapeHtml(args.workspaceName)}<small>Caderno de Conquistas</small></div>
    <div class="stamp">Aprovado!</div>
  </div>
  <div class="title-line">Certificado de Conclusão</div>
  <div class="note">Hoje fica registrado neste caderno que…</div>
  <h1 class="recipient">${escapeHtml(args.recipientName)}</h1>
  <div class="body">concluiu com dedicação o curso de</div>
  <div class="course-line">${escapeHtml(args.courseName)}</div>
  <div class="meta-notes">
    ${args.courseHours ? `<div>⏱ <b>${args.courseHours}h</b></div>` : ''}
    ${cpfFormatted ? `<div>CPF: <b>${cpfFormatted}</b></div>` : ''}
    <div>📅 <b>${dateFormatted}</b></div>
  </div>
  <div class="footer">
    <div>
      <div>Verifique em <strong>${escapeHtml(args.verifyUrl)}</strong></div>
      <div class="id">${escapeHtml(args.credentialId)}${hashShort ? ' · ' + escapeHtml(hashShort) : ''}</div>
    </div>
    <div class="qr"><img src="${qrSrc}" alt="QR"/></div>
  </div>
</div>
</body></html>`;
}

// ============================================================
// TECHGRID — Cyberpunk dark, monospace, neon
// ============================================================
function renderTechGrid(args: Args): string {
  const cpfFormatted = formatCpf(args.cpf);
  const dateFormatted = formatDate(args.issuedAt);
  const primary = args.primaryColor ?? '#0A0E1A';
  const accent = args.accentColor ?? '#00FF9F';
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&format=png&margin=2&data=${encodeURIComponent(args.verifyUrl)}`;
  const hashShort = args.hashSha256 ? args.hashSha256.slice(0, 14) + '…' + args.hashSha256.slice(-8) : '';

  return `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="UTF-8">
<title>Certificado · ${escapeHtml(args.recipientName)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700;800&family=Inter:wght@400;600&display=swap" rel="stylesheet">
<style>
@page { size: A4 landscape; margin: 0; }
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { width: 297mm; height: 210mm; }
body { font-family: 'JetBrains Mono', monospace; background: ${primary}; color: ${accent}; position: relative; overflow: hidden; }
.grid { position: absolute; inset: 0; background-image: linear-gradient(${accent}22 1px, transparent 1px), linear-gradient(90deg, ${accent}22 1px, transparent 1px); background-size: 8mm 8mm; opacity: 0.4; }
.glow1 { position: absolute; top: -40mm; right: -40mm; width: 140mm; height: 140mm; background: radial-gradient(circle, ${accent}33 0%, transparent 70%); }
.glow2 { position: absolute; bottom: -40mm; left: -40mm; width: 140mm; height: 140mm; background: radial-gradient(circle, #FF00FF22 0%, transparent 70%); }
.scanline { position: absolute; left: 0; right: 0; height: 1px; background: ${accent}; box-shadow: 0 0 10px ${accent}; opacity: 0.4; top: 35%; }
.frame { position: absolute; inset: 12mm; border: 1px solid ${accent}66; }
.bracket { position: absolute; width: 14mm; height: 14mm; border: 2px solid ${accent}; }
.bt-tl { top: 11mm; left: 11mm; border-right: none; border-bottom: none; }
.bt-tr { top: 11mm; right: 11mm; border-left: none; border-bottom: none; }
.bt-bl { bottom: 11mm; left: 11mm; border-right: none; border-top: none; }
.bt-br { bottom: 11mm; right: 11mm; border-left: none; border-top: none; }
.content { position: absolute; inset: 18mm; padding: 8mm 14mm; display: flex; flex-direction: column; }
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12mm; padding-bottom: 4mm; border-bottom: 1px dashed ${accent}66; font-size: 9pt; }
.brand { color: ${accent}; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; }
.brand::before { content: '> '; }
.status { color: ${accent}; padding: 1.5mm 4mm; border: 1px solid ${accent}; font-weight: 700; font-size: 8.5pt; letter-spacing: 0.15em; }
.status::before { content: '● '; animation: blink 2s infinite; }
@keyframes blink { 0%,49%{opacity:1} 50%,100%{opacity:0.3} }
.label { font-size: 9pt; color: ${accent}99; letter-spacing: 0.3em; text-transform: uppercase; margin-bottom: 4mm; }
.label::before { content: '// '; }
.recipient { font-family: 'JetBrains Mono'; font-weight: 800; font-size: 60pt; color: #fff; line-height: 1.0; margin-bottom: 8mm; letter-spacing: -0.03em; text-shadow: 0 0 20px ${accent}66; }
.recipient::before { content: '> '; color: ${accent}; }
.desc { font-family: 'Inter'; font-size: 12pt; color: #fff; margin-bottom: 3mm; }
.course { font-family: 'JetBrains Mono'; font-weight: 700; font-size: 22pt; color: ${accent}; line-height: 1.2; margin-bottom: 10mm; padding: 4mm 6mm; background: ${accent}11; border-left: 4px solid ${accent}; }
.meta { display: flex; gap: 10mm; padding: 5mm 0; border-top: 1px dashed ${accent}66; border-bottom: 1px dashed ${accent}66; margin-top: auto; font-size: 9pt; }
.m { display: flex; flex-direction: column; gap: 1mm; }
.m .lbl { color: ${accent}99; letter-spacing: 0.15em; text-transform: uppercase; font-size: 7.5pt; }
.m .val { color: #fff; font-weight: 700; font-size: 11pt; }
.footer { display: flex; justify-content: space-between; align-items: flex-end; padding-top: 6mm; font-size: 8pt; color: ${accent}99; }
.footer .url { color: ${accent}; word-break: break-all; }
.id { color: #fff; margin-top: 1mm; font-size: 7.5pt; }
.qr { width: 22mm; height: 22mm; padding: 1mm; background: ${accent}; }
.qr img { width: 100%; height: 100%; filter: invert(1) hue-rotate(180deg); }
</style></head>
<body>
<div class="grid"></div>
<div class="glow1"></div>
<div class="glow2"></div>
<div class="scanline"></div>
<div class="frame"></div>
<div class="bracket bt-tl"></div><div class="bracket bt-tr"></div>
<div class="bracket bt-bl"></div><div class="bracket bt-br"></div>
<div class="content">
  <div class="header">
    <div class="brand">${escapeHtml(args.workspaceName)}.cert</div>
    <div class="status">VERIFIED</div>
  </div>
  <div class="label">cert.issue --type=completion</div>
  <h1 class="recipient">${escapeHtml(args.recipientName)}</h1>
  <div class="desc">completou com sucesso o módulo</div>
  <div class="course">${escapeHtml(args.courseName)}</div>
  <div class="meta">
    ${args.courseHours ? `<div class="m"><div class="lbl">duration</div><div class="val">${args.courseHours}h</div></div>` : ''}
    ${cpfFormatted ? `<div class="m"><div class="lbl">cpf</div><div class="val">${cpfFormatted}</div></div>` : ''}
    <div class="m"><div class="lbl">issued_at</div><div class="val">${dateFormatted}</div></div>
  </div>
  <div class="footer">
    <div>
      <div>verify <span class="url">${escapeHtml(args.verifyUrl)}</span></div>
      <div class="id">id: ${escapeHtml(args.credentialId)}</div>
      ${hashShort ? `<div class="id">sha256: ${escapeHtml(hashShort)}</div>` : ''}
    </div>
    <div class="qr"><img src="${qrSrc}" alt="QR"/></div>
  </div>
</div>
</body></html>`;
}

// ============================================================
// ARTDECO — Geometria 1920s, frames triangulares dourado/preto
// ============================================================
function renderArtDeco(args: Args): string {
  const cpfFormatted = formatCpf(args.cpf);
  const dateFormatted = formatDate(args.issuedAt);
  const primary = args.primaryColor ?? '#1A1A1A';
  const accent = args.accentColor ?? '#C9A961';
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&format=png&margin=2&data=${encodeURIComponent(args.verifyUrl)}`;
  const hashShort = args.hashSha256 ? args.hashSha256.slice(0, 12) + '…' + args.hashSha256.slice(-6) : '';

  const fan = `<svg viewBox="0 0 200 100" xmlns="http://www.w3.org/2000/svg"><g fill="none" stroke="${accent}" stroke-width="1.2"><path d="M100 100 L40 20 M100 100 L60 16 M100 100 L80 12 M100 100 L100 10 M100 100 L120 12 M100 100 L140 16 M100 100 L160 20"/><path d="M40 40 Q100 -20 160 40" stroke-width="1.5"/><path d="M55 50 Q100 0 145 50" stroke-width="1"/><circle cx="100" cy="100" r="6" fill="${accent}"/></g></svg>`;

  return `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="UTF-8">
<title>Certificado · ${escapeHtml(args.recipientName)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;900&family=Cormorant+Garamond:wght@500;600&family=Inter:wght@400;600&display=swap" rel="stylesheet">
<style>
@page { size: A4 landscape; margin: 0; }
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { width: 297mm; height: 210mm; }
body { font-family: 'Inter', sans-serif; background: ${primary}; color: ${accent}; position: relative; overflow: hidden; }
.frame-out { position: absolute; inset: 8mm; border: 3px solid ${accent}; }
.frame-in { position: absolute; inset: 12mm; border: 0.5px solid ${accent}80; }
.zigzag-top, .zigzag-bot { position: absolute; left: 12mm; right: 12mm; height: 6mm; background-image: linear-gradient(45deg, ${accent} 25%, transparent 25%), linear-gradient(-45deg, ${accent} 25%, transparent 25%); background-size: 6mm 6mm; opacity: 0.85; }
.zigzag-top { top: 12mm; }
.zigzag-bot { bottom: 12mm; transform: scaleY(-1); }
.fan { position: absolute; width: 50mm; height: 25mm; }
.fan-tl { top: 22mm; left: 18mm; }
.fan-tr { top: 22mm; right: 18mm; transform: scaleX(-1); }
.fan-bl { bottom: 22mm; left: 18mm; transform: scaleY(-1); }
.fan-br { bottom: 22mm; right: 18mm; transform: scale(-1,-1); }
.content { position: absolute; inset: 24mm 30mm; display: flex; flex-direction: column; align-items: center; text-align: center; padding-top: 14mm; }
.brand { font-family: 'Cinzel'; font-weight: 700; font-size: 11pt; color: ${accent}; letter-spacing: 0.4em; margin-bottom: 8mm; }
.brand::before, .brand::after { content: '◆'; margin: 0 4mm; font-size: 7pt; vertical-align: middle; }
.title { font-family: 'Cinzel'; font-weight: 900; font-size: 24pt; color: ${accent}; letter-spacing: 0.18em; margin-bottom: 2mm; }
.subtitle { font-family: 'Cormorant Garamond'; font-style: italic; font-size: 12pt; color: ${accent}99; letter-spacing: 0.25em; text-transform: uppercase; margin-bottom: 8mm; }
.recipient { font-family: 'Cinzel'; font-weight: 700; font-size: 48pt; color: #fff; letter-spacing: 0.04em; line-height: 1.1; margin-bottom: 8mm; padding: 0 4mm;
  border-top: 1px solid ${accent}; border-bottom: 1px solid ${accent}; padding-top: 5mm; padding-bottom: 5mm; }
.desc { font-family: 'Cormorant Garamond'; font-style: italic; font-size: 13pt; color: ${accent}; margin-bottom: 3mm; }
.course { font-family: 'Cinzel'; font-weight: 600; font-size: 20pt; color: ${accent}; letter-spacing: 0.06em; line-height: 1.2; margin-bottom: 10mm; }
.meta { display: flex; gap: 16mm; margin-top: auto; }
.m .lbl { font-family: 'Cinzel'; font-size: 7.5pt; color: ${accent}99; letter-spacing: 0.25em; margin-bottom: 1.5mm; }
.m .val { font-family: 'Cormorant Garamond'; font-weight: 600; font-size: 13pt; color: #fff; }
.footer { position: absolute; bottom: 22mm; left: 30mm; right: 30mm; display: flex; justify-content: space-between; align-items: flex-end; font-family: 'Inter'; font-size: 7.5pt; color: ${accent}99; }
.footer strong { color: ${accent}; }
.id { font-family: monospace; font-size: 7pt; margin-top: 1mm; opacity: 0.7; }
.qr { width: 22mm; height: 22mm; padding: 1mm; background: ${accent}; }
.qr img { width: 100%; height: 100%; }
</style></head>
<body>
<div class="frame-out"></div>
<div class="frame-in"></div>
<div class="zigzag-top"></div>
<div class="zigzag-bot"></div>
<div class="fan fan-tl">${fan}</div>
<div class="fan fan-tr">${fan}</div>
<div class="fan fan-bl">${fan}</div>
<div class="fan fan-br">${fan}</div>
<div class="content">
  <div class="brand">${escapeHtml(args.workspaceName)}</div>
  <div class="title">CERTIFICATE</div>
  <div class="subtitle">of distinguished completion</div>
  <h1 class="recipient">${escapeHtml(args.recipientName)}</h1>
  <div class="desc">is hereby honored for completing</div>
  <div class="course">${escapeHtml(args.courseName)}</div>
  <div class="meta">
    ${args.courseHours ? `<div class="m"><div class="lbl">HOURS</div><div class="val">${args.courseHours}</div></div>` : ''}
    ${cpfFormatted ? `<div class="m"><div class="lbl">DOC</div><div class="val">${cpfFormatted}</div></div>` : ''}
    <div class="m"><div class="lbl">DATE</div><div class="val">${dateFormatted}</div></div>
  </div>
</div>
<div class="footer">
  <div>
    <div>Verify at <strong>${escapeHtml(args.verifyUrl)}</strong></div>
    <div class="id">${escapeHtml(args.credentialId)}${hashShort ? ' · ' + escapeHtml(hashShort) : ''}</div>
  </div>
  <div class="qr"><img src="${qrSrc}" alt="QR"/></div>
</div>
</body></html>`;
}

// ============================================================
// NEWSPAPER — Tipografia jornal vintage, manchete
// ============================================================
function renderNewspaper(args: Args): string {
  const cpfFormatted = formatCpf(args.cpf);
  const dateFormatted = formatDate(args.issuedAt);
  const primary = args.primaryColor ?? '#000000';
  const accent = args.accentColor ?? '#B91C1C';
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&format=png&margin=2&data=${encodeURIComponent(args.verifyUrl)}`;
  const hashShort = args.hashSha256 ? args.hashSha256.slice(0, 12) + '…' + args.hashSha256.slice(-6) : '';
  const issueDate = new Date(args.issuedAt * 1000).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });

  return `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="UTF-8">
<title>Certificado · ${escapeHtml(args.recipientName)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;800;900&family=Old+Standard+TT:wght@400;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
@page { size: A4 landscape; margin: 0; }
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { width: 297mm; height: 210mm; }
body { font-family: 'Old Standard TT', serif; background: #FBF7EE; color: ${primary}; position: relative; overflow: hidden;
  background-image: radial-gradient(circle at 20% 30%, transparent 0, transparent 1px, rgba(0,0,0,0.015) 1.5px), radial-gradient(circle at 70% 70%, transparent 0, transparent 1px, rgba(0,0,0,0.015) 1.5px); background-size: 3mm 3mm; }
.content { position: absolute; inset: 12mm; padding: 8mm 14mm; }
.masthead { display: flex; justify-content: space-between; align-items: center; padding-bottom: 4mm; border-bottom: 4px double ${primary}; margin-bottom: 5mm; font-size: 9pt; }
.masthead .left, .masthead .right { font-family: 'Inter'; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; }
.title-bar { text-align: center; padding-bottom: 3mm; border-bottom: 1px solid ${primary}; margin-bottom: 6mm; }
.title-bar .top { font-family: 'Inter'; font-size: 9pt; letter-spacing: 0.4em; text-transform: uppercase; margin-bottom: 2mm; }
.title-bar .name { font-family: 'Playfair Display'; font-weight: 900; font-size: 56pt; letter-spacing: -0.02em; line-height: 1.0; color: ${primary}; }
.title-bar .name em { color: ${accent}; font-style: normal; }
.title-bar .sub { font-family: 'Old Standard TT'; font-style: italic; font-size: 12pt; color: #4B5563; margin-top: 2mm; }
.headline-box { text-align: center; padding: 6mm 0; border-top: 2px solid ${primary}; border-bottom: 2px solid ${primary}; margin-bottom: 6mm; }
.kicker { font-family: 'Inter'; font-size: 9pt; letter-spacing: 0.4em; text-transform: uppercase; color: ${accent}; font-weight: 700; margin-bottom: 3mm; }
.headline { font-family: 'Playfair Display'; font-weight: 800; font-size: 36pt; line-height: 1.05; color: ${primary}; max-width: 85%; margin: 0 auto; }
.byline { font-family: 'Old Standard TT'; font-style: italic; font-size: 12pt; color: #4B5563; margin-top: 4mm; }
.columns { display: grid; grid-template-columns: 1fr 1fr 80mm; gap: 8mm; padding-top: 4mm; font-size: 11pt; line-height: 1.5; }
.col p { margin-bottom: 3mm; }
.col p:first-child::first-letter { font-family: 'Playfair Display'; font-weight: 900; font-size: 32pt; float: left; line-height: 0.9; padding-right: 2mm; padding-top: 1mm; color: ${accent}; }
.sidebar { background: ${primary}; color: #FBF7EE; padding: 5mm; }
.sidebar h3 { font-family: 'Playfair Display'; font-weight: 800; font-size: 14pt; margin-bottom: 3mm; padding-bottom: 2mm; border-bottom: 1px solid #FBF7EE60; letter-spacing: 0.04em; }
.sidebar .item { margin-bottom: 3mm; font-family: 'Inter'; font-size: 9pt; }
.sidebar .item .lbl { color: #FBF7EE99; text-transform: uppercase; letter-spacing: 0.15em; font-size: 7pt; font-weight: 600; margin-bottom: 0.5mm; }
.sidebar .item .val { font-weight: 600; font-size: 11pt; color: #FBF7EE; }
.qr-row { display: flex; gap: 3mm; align-items: center; padding-top: 3mm; border-top: 1px solid #FBF7EE40; margin-top: 3mm; }
.qr-row .qr { width: 18mm; height: 18mm; padding: 0.8mm; background: #FBF7EE; }
.qr-row .qr img { width: 100%; height: 100%; }
.qr-row .qr-txt { font-family: 'Inter'; font-size: 7pt; color: #FBF7EE; }
.qr-row .qr-txt strong { color: ${accent}; }
.footer-bar { position: absolute; bottom: 12mm; left: 26mm; right: 26mm; padding-top: 3mm; border-top: 4px double ${primary}; display: flex; justify-content: space-between; font-family: 'Inter'; font-size: 7.5pt; color: #4B5563; }
.id { font-family: monospace; font-size: 7pt; }
</style></head>
<body>
<div class="content">
  <div class="masthead">
    <div class="left">Vol. I · Nº ${escapeHtml(args.credentialId.slice(-4))}</div>
    <div class="right">${escapeHtml(issueDate)}</div>
  </div>
  <div class="title-bar">
    <div class="top">The Daily Certificate</div>
    <div class="name">${escapeHtml(args.workspaceName.split(' ')[0])} <em>Times</em></div>
    <div class="sub">"Reconhecimento publicado · Verificável digitalmente"</div>
  </div>
  <div class="headline-box">
    <div class="kicker">★ Edição Especial · Conclusão de Curso ★</div>
    <h1 class="headline">${escapeHtml(args.recipientName)} conclui ${escapeHtml(args.courseName)}</h1>
    <div class="byline">Por ${escapeHtml(args.workspaceName)} · ${dateFormatted}</div>
  </div>
  <div class="columns">
    <div class="col">
      <p>Em cerimônia digital, ${escapeHtml(args.recipientName)} foi reconhecido(a) pela conclusão do curso de ${escapeHtml(args.courseName)}, ofertado por ${escapeHtml(args.workspaceName)}.</p>
      <p>O certificado é registrado em base imutável e pode ser verificado por qualquer pessoa via QR Code ou pela URL ao lado.</p>
    </div>
    <div class="col">
      <p>${args.courseHours ? `Foram ${args.courseHours} horas de dedicação até a entrega final, contemplando teoria e prática aplicada.` : 'O programa contemplou teoria e prática até a entrega final do estudante.'}</p>
      <p>A conclusão demonstra competência técnica e compromisso com o aprendizado contínuo.</p>
    </div>
    <div class="sidebar">
      <h3>Dados oficiais</h3>
      ${args.courseHours ? `<div class="item"><div class="lbl">Carga horária</div><div class="val">${args.courseHours} horas</div></div>` : ''}
      ${cpfFormatted ? `<div class="item"><div class="lbl">Documento</div><div class="val">${cpfFormatted}</div></div>` : ''}
      <div class="item"><div class="lbl">Emissão</div><div class="val">${dateFormatted}</div></div>
      <div class="qr-row">
        <div class="qr"><img src="${qrSrc}" alt="QR"/></div>
        <div class="qr-txt">Verifique<br><strong>autenticidade</strong></div>
      </div>
    </div>
  </div>
</div>
<div class="footer-bar">
  <div>Verifique em ${escapeHtml(args.verifyUrl)}</div>
  <div class="id">${escapeHtml(args.credentialId)}${hashShort ? ' · ' + escapeHtml(hashShort) : ''}</div>
</div>
</body></html>`;
}

// ============================================================
// DIPLOMA — A4 RETRATO, ornamentos pesados, fitas, formal
// ============================================================
function renderDiploma(args: Args): string {
  const cpfFormatted = formatCpf(args.cpf);
  const dateFormatted = formatDate(args.issuedAt);
  const primary = args.primaryColor ?? '#4C1D95';
  const accent = args.accentColor ?? '#D4A937';
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&format=png&margin=2&data=${encodeURIComponent(args.verifyUrl)}`;
  const hashShort = args.hashSha256 ? args.hashSha256.slice(0, 12) + '…' + args.hashSha256.slice(-6) : '';

  return `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="UTF-8">
<title>Diploma · ${escapeHtml(args.recipientName)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700;900&family=Cormorant+Garamond:wght@500;600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<style>
@page { size: A4 portrait; margin: 0; }
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { width: 210mm; height: 297mm; }
body { font-family: 'Inter', sans-serif; background: #FFFCF2; color: ${primary}; position: relative; overflow: hidden; }
.bg { position: absolute; inset: 0; background: radial-gradient(ellipse at center, #FFFEF7 0%, #F5EDD8 100%); }
.border-out { position: absolute; inset: 8mm; border: 3px solid ${accent}; border-radius: 2mm; }
.border-in { position: absolute; inset: 11mm; border: 1px solid ${accent}; }
.border-thin { position: absolute; inset: 13mm; border: 0.5px solid ${accent}80; }
.corner { position: absolute; width: 22mm; height: 22mm; }
.corner svg { width: 100%; height: 100%; }
.c-tl { top: 9mm; left: 9mm; }
.c-tr { top: 9mm; right: 9mm; transform: scaleX(-1); }
.c-bl { bottom: 9mm; left: 9mm; transform: scaleY(-1); }
.c-br { bottom: 9mm; right: 9mm; transform: scale(-1,-1); }
.crest { position: absolute; top: 22mm; left: 50%; transform: translateX(-50%); width: 36mm; height: 42mm; }
.crest svg { width: 100%; height: 100%; }
.content { position: absolute; top: 70mm; left: 22mm; right: 22mm; bottom: 60mm; display: flex; flex-direction: column; align-items: center; text-align: center; }
.brand { font-family: 'Cinzel'; font-weight: 700; font-size: 12pt; letter-spacing: 0.3em; color: ${primary}; margin-bottom: 2mm; }
.brand-sub { font-family: 'Cormorant Garamond'; font-style: italic; font-size: 11pt; color: ${primary}99; letter-spacing: 0.1em; margin-bottom: 8mm; }
.title { font-family: 'Cinzel'; font-weight: 900; font-size: 28pt; color: ${primary}; letter-spacing: 0.18em; margin-bottom: 2mm; }
.subtitle { font-family: 'Cormorant Garamond'; font-style: italic; font-size: 14pt; color: ${accent}; letter-spacing: 0.15em; text-transform: uppercase; margin-bottom: 8mm; }
.divider { display: flex; align-items: center; gap: 3mm; margin-bottom: 6mm; }
.divider .l { width: 24mm; height: 1px; background: ${accent}; }
.divider .d { width: 4mm; height: 4mm; background: ${accent}; transform: rotate(45deg); }
.pre { font-family: 'Cormorant Garamond'; font-style: italic; font-size: 13pt; color: ${primary}99; margin-bottom: 4mm; }
.recipient { font-family: 'Cormorant Garamond'; font-weight: 700; font-size: 38pt; color: ${primary}; line-height: 1.1; margin-bottom: 6mm; padding: 0 4mm;
  border-bottom: 2px solid ${accent}; padding-bottom: 4mm; }
.body { font-family: 'Cormorant Garamond'; font-size: 13pt; color: #3B2D52; line-height: 1.55; margin-bottom: 4mm; padding: 0 6mm; }
.course { font-family: 'Cinzel'; font-weight: 700; font-size: 18pt; color: ${primary}; line-height: 1.25; margin-bottom: 8mm; padding: 0 6mm; }
.cpf-row { font-family: 'Cormorant Garamond'; font-style: italic; font-size: 12pt; color: ${primary}; }
.ribbons { position: absolute; bottom: 36mm; left: 50%; transform: translateX(-50%); width: 60mm; }
.ribbons svg { width: 100%; height: auto; }
.signatures { position: absolute; bottom: 38mm; left: 30mm; right: 30mm; display: flex; justify-content: space-between; padding-top: 4mm; }
.sig { text-align: center; flex: 1; max-width: 60mm; }
.sig .line { border-top: 1px solid ${primary}; padding-top: 1.5mm; font-family: 'Cinzel'; font-size: 8pt; color: ${primary}; letter-spacing: 0.15em; }
.sig .role { font-family: 'Cormorant Garamond'; font-style: italic; font-size: 9pt; color: ${primary}99; margin-top: 0.5mm; }
.footer { position: absolute; bottom: 14mm; left: 22mm; right: 22mm; display: flex; justify-content: space-between; align-items: flex-end; font-family: 'Inter'; font-size: 7.5pt; color: #6B5A2D; padding-top: 4mm; border-top: 1px solid ${accent}40; }
.footer strong { color: ${primary}; }
.id { font-family: monospace; font-size: 7pt; margin-top: 1mm; opacity: 0.8; }
.qr { width: 22mm; height: 22mm; padding: 1mm; background: #fff; border: 2px solid ${accent}; border-radius: 1.5mm; }
.qr img { width: 100%; height: 100%; }
</style></head>
<body>
<div class="bg"></div>
<div class="border-out"></div>
<div class="border-in"></div>
<div class="border-thin"></div>
<svg class="corner c-tl" viewBox="0 0 100 100"><g fill="none" stroke="${accent}" stroke-width="1.5"><path d="M0 0 L80 0 M0 0 L0 80"/><circle cx="20" cy="20" r="8" stroke-width="1"/><path d="M30 30 Q50 30 50 50" opacity="0.5"/><path d="M14 4 L14 36 M4 14 L36 14" opacity="0.6"/></g></svg>
<svg class="corner c-tr" viewBox="0 0 100 100"><g fill="none" stroke="${accent}" stroke-width="1.5"><path d="M0 0 L80 0 M0 0 L0 80"/><circle cx="20" cy="20" r="8" stroke-width="1"/><path d="M30 30 Q50 30 50 50" opacity="0.5"/></g></svg>
<svg class="corner c-bl" viewBox="0 0 100 100"><g fill="none" stroke="${accent}" stroke-width="1.5"><path d="M0 0 L80 0 M0 0 L0 80"/><circle cx="20" cy="20" r="8" stroke-width="1"/><path d="M30 30 Q50 30 50 50" opacity="0.5"/></g></svg>
<svg class="corner c-br" viewBox="0 0 100 100"><g fill="none" stroke="${accent}" stroke-width="1.5"><path d="M0 0 L80 0 M0 0 L0 80"/><circle cx="20" cy="20" r="8" stroke-width="1"/><path d="M30 30 Q50 30 50 50" opacity="0.5"/></g></svg>
<div class="crest">
  <svg viewBox="0 0 100 120"><g><path d="M50 4 L88 16 L88 56 Q88 88 50 116 Q12 88 12 56 L12 16 Z" fill="${primary}"/><path d="M50 12 L80 22 L80 56 Q80 82 50 106 Q20 82 20 56 L20 22 Z" fill="none" stroke="${accent}" stroke-width="1.5"/><circle cx="50" cy="58" r="22" fill="none" stroke="${accent}" stroke-width="2"/><circle cx="50" cy="58" r="14" fill="${accent}"/><text x="50" y="64" text-anchor="middle" font-family="Cinzel" font-weight="900" font-size="16" fill="${primary}">${escapeHtml(args.workspaceName.charAt(0))}</text><path d="M30 96 L50 100 L70 96 L62 110 L50 106 L38 110 Z" fill="${accent}"/></g></svg>
</div>
<div class="content">
  <div class="brand">${escapeHtml(args.workspaceName)}</div>
  <div class="brand-sub">Instituição Certificadora Digital</div>
  <div class="title">DIPLOMA</div>
  <div class="subtitle">de conclusão de curso</div>
  <div class="divider"><span class="l"></span><span class="d"></span><span class="l"></span></div>
  <div class="pre">Conferimos o presente diploma a</div>
  <h1 class="recipient">${escapeHtml(args.recipientName)}</h1>
  <div class="body">por haver concluído com aproveitamento todas as exigências curriculares e demonstrado domínio nas matérias do curso de</div>
  <div class="course">${escapeHtml(args.courseName)}</div>
  ${cpfFormatted ? `<div class="cpf-row">portador(a) do CPF ${cpfFormatted}${args.courseHours ? ` · ${args.courseHours} horas` : ''}</div>` : (args.courseHours ? `<div class="cpf-row">${args.courseHours} horas de carga horária</div>` : '')}
</div>
<div class="signatures">
  <div class="sig"><div class="line">${escapeHtml(args.workspaceName)}</div><div class="role">Instituição Emissora</div></div>
  <div class="sig"><div class="line">${dateFormatted}</div><div class="role">Data de Emissão</div></div>
</div>
<div class="footer">
  <div>
    <div>Verifique a autenticidade em <strong>${escapeHtml(args.verifyUrl)}</strong></div>
    <div class="id">ID: ${escapeHtml(args.credentialId)}${hashShort ? ' · SHA-256: ' + escapeHtml(hashShort) : ''}</div>
  </div>
  <div class="qr"><img src="${qrSrc}" alt="QR"/></div>
</div>
</body></html>`;
}

// ============================================================
// HOLOGRAPHIC — Mesh gradient shimmer, futurístico
// ============================================================
function renderHolographic(args: Args): string {
  const cpfFormatted = formatCpf(args.cpf);
  const dateFormatted = formatDate(args.issuedAt);
  const primary = args.primaryColor ?? '#6366F1';
  const accent = args.accentColor ?? '#EC4899';
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&format=png&margin=2&data=${encodeURIComponent(args.verifyUrl)}`;
  const hashShort = args.hashSha256 ? args.hashSha256.slice(0, 12) + '…' + args.hashSha256.slice(-6) : '';

  return `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="UTF-8">
<title>Certificado · ${escapeHtml(args.recipientName)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
@page { size: A4 landscape; margin: 0; }
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { width: 297mm; height: 210mm; }
body { font-family: 'Inter', sans-serif; background: #0A0118; color: #fff; position: relative; overflow: hidden; }
.holo { position: absolute; inset: 0; background:
  radial-gradient(at 10% 10%, ${primary} 0px, transparent 45%),
  radial-gradient(at 90% 10%, #06B6D4 0px, transparent 50%),
  radial-gradient(at 80% 90%, ${accent} 0px, transparent 45%),
  radial-gradient(at 10% 90%, #10B981 0px, transparent 50%),
  linear-gradient(135deg, ${primary} 0%, #06B6D4 30%, ${accent} 60%, #10B981 100%); }
.shine { position: absolute; inset: 0; background: linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.2) 50%, transparent 70%); mix-blend-mode: overlay; }
.noise { position: absolute; inset: 0; opacity: 0.18; background-image: radial-gradient(rgba(255,255,255,0.5) 0.5px, transparent 0.7px); background-size: 1.5mm 1.5mm; }
.card { position: absolute; inset: 14mm; background: rgba(10,1,24,0.55); backdrop-filter: blur(20px); border-radius: 6mm; border: 1.5px solid rgba(255,255,255,0.25); padding: 18mm 22mm; display: flex; flex-direction: column; box-shadow: 0 0 80px rgba(99,102,241,0.4); }
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14mm; }
.brand { display: flex; align-items: center; gap: 3mm; }
.brand-icon { width: 12mm; height: 12mm; border-radius: 3mm; background: linear-gradient(135deg, ${primary}, ${accent}); display: flex; align-items: center; justify-content: center; font-family: 'Space Grotesk'; font-weight: 700; font-size: 16pt; color: #fff; box-shadow: 0 0 20px ${primary}80; }
.brand-name { font-family: 'Space Grotesk'; font-weight: 700; font-size: 12pt; letter-spacing: 0.1em; text-transform: uppercase; color: #fff; }
.badge { padding: 2mm 5mm; background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.4); border-radius: 999pt; font-family: 'JetBrains Mono'; font-size: 8.5pt; font-weight: 600; letter-spacing: 0.15em; color: #fff; backdrop-filter: blur(10px); }
.label { font-family: 'JetBrains Mono'; font-size: 9pt; letter-spacing: 0.4em; text-transform: uppercase; color: rgba(255,255,255,0.7); margin-bottom: 4mm; }
.recipient { font-family: 'Space Grotesk'; font-weight: 700; font-size: 70pt; line-height: 0.95; letter-spacing: -0.04em; color: #fff; margin-bottom: 8mm; text-shadow: 0 0 30px rgba(255,255,255,0.4); }
.desc { font-size: 13pt; color: rgba(255,255,255,0.85); margin-bottom: 3mm; font-weight: 400; }
.course { font-family: 'Space Grotesk'; font-weight: 700; font-size: 28pt; line-height: 1.15; margin-bottom: 12mm;
  background: linear-gradient(90deg, #fff 0%, ${accent} 100%); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; color: transparent; }
.meta { display: flex; gap: 6mm; padding: 4mm 0; margin-top: auto; flex-wrap: wrap; }
.chip { padding: 2.5mm 5mm; background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.3); border-radius: 999pt; font-family: 'JetBrains Mono'; font-size: 9pt; color: #fff; backdrop-filter: blur(10px); }
.chip strong { font-weight: 700; }
.footer { display: flex; justify-content: space-between; align-items: flex-end; padding-top: 5mm; border-top: 1px solid rgba(255,255,255,0.2); font-size: 8pt; color: rgba(255,255,255,0.7); }
.footer strong { color: #fff; }
.id { font-family: 'JetBrains Mono'; font-size: 7pt; color: rgba(255,255,255,0.5); margin-top: 1mm; }
.qr { width: 22mm; height: 22mm; padding: 1mm; background: #fff; border-radius: 3mm; box-shadow: 0 0 20px rgba(255,255,255,0.4); }
.qr img { width: 100%; height: 100%; }
</style></head>
<body>
<div class="holo"></div>
<div class="shine"></div>
<div class="noise"></div>
<div class="card">
  <div class="header">
    <div class="brand"><div class="brand-icon">${escapeHtml(args.workspaceName.charAt(0))}</div><div class="brand-name">${escapeHtml(args.workspaceName)}</div></div>
    <div class="badge">◆ VERIFIED · ON-CHAIN</div>
  </div>
  <div class="label">Certificate of Achievement</div>
  <h1 class="recipient">${escapeHtml(args.recipientName)}</h1>
  <div class="desc">just unlocked</div>
  <div class="course">${escapeHtml(args.courseName)}</div>
  <div class="meta">
    ${args.courseHours ? `<span class="chip">⚡ <strong>${args.courseHours}h</strong></span>` : ''}
    ${cpfFormatted ? `<span class="chip">ID <strong>${cpfFormatted}</strong></span>` : ''}
    <span class="chip">📅 <strong>${dateFormatted}</strong></span>
  </div>
  <div class="footer">
    <div>
      <div>verify · <strong>${escapeHtml(args.verifyUrl)}</strong></div>
      <div class="id">${escapeHtml(args.credentialId)}${hashShort ? ' · ' + escapeHtml(hashShort) : ''}</div>
    </div>
    <div class="qr"><img src="${qrSrc}" alt="QR"/></div>
  </div>
</div>
</body></html>`;
}

// ============================================================
// WATERMARK — Marca d'água diagonal gigante, fotografia/arte
// ============================================================
function renderWatermark(args: Args): string {
  const cpfFormatted = formatCpf(args.cpf);
  const dateFormatted = formatDate(args.issuedAt);
  const primary = args.primaryColor ?? '#1F2937';
  const accent = args.accentColor ?? '#6B7280';
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&format=png&margin=2&data=${encodeURIComponent(args.verifyUrl)}`;
  const hashShort = args.hashSha256 ? args.hashSha256.slice(0, 12) + '…' + args.hashSha256.slice(-6) : '';

  return `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="UTF-8">
<title>Certificado · ${escapeHtml(args.recipientName)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400&display=swap" rel="stylesheet">
<style>
@page { size: A4 landscape; margin: 0; }
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { width: 297mm; height: 210mm; }
body { font-family: 'Inter', sans-serif; background: #FAFAFA; color: ${primary}; position: relative; overflow: hidden; }
.bg-vignette { position: absolute; inset: 0; background: radial-gradient(ellipse at center, #FFFFFF 0%, #F5F5F5 75%, #EAEAEA 100%); }
.watermark { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%) rotate(-22deg); font-family: 'Cormorant Garamond'; font-weight: 400; font-size: 180pt; color: ${primary}; opacity: 0.06; letter-spacing: 0.04em; white-space: nowrap; pointer-events: none; line-height: 0.9; }
.watermark-2 { position: absolute; top: 50%; left: 50%; transform: translate(-50%,calc(-50% + 60mm)) rotate(-22deg); font-family: 'Cormorant Garamond'; font-style: italic; font-weight: 300; font-size: 60pt; color: ${primary}; opacity: 0.05; letter-spacing: 0.15em; text-transform: uppercase; white-space: nowrap; pointer-events: none; }
.frame { position: absolute; inset: 14mm; border: 0.5px solid ${primary}30; }
.content { position: absolute; inset: 22mm 26mm; display: flex; flex-direction: column; }
.header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 5mm; border-bottom: 1px solid ${primary}20; margin-bottom: 16mm; }
.brand { font-family: 'Cormorant Garamond'; font-weight: 500; font-size: 13pt; color: ${primary}; letter-spacing: 0.18em; text-transform: uppercase; }
.brand-sub { font-family: 'Inter'; font-weight: 400; font-size: 8pt; color: ${accent}; letter-spacing: 0.1em; text-transform: uppercase; margin-top: 1mm; }
.serial { font-family: 'JetBrains Mono'; font-size: 8pt; color: ${accent}; text-align: right; }
.serial strong { color: ${primary}; }
.label { font-family: 'Inter'; font-size: 8pt; letter-spacing: 0.45em; text-transform: uppercase; color: ${accent}; font-weight: 500; margin-bottom: 4mm; }
.recipient { font-family: 'Cormorant Garamond'; font-weight: 400; font-size: 70pt; color: ${primary}; line-height: 1.0; margin-bottom: 8mm; letter-spacing: -0.01em; }
.divider { width: 16mm; height: 0.5px; background: ${primary}; margin-bottom: 8mm; }
.desc { font-family: 'Cormorant Garamond'; font-style: italic; font-weight: 400; font-size: 14pt; color: ${accent}; margin-bottom: 3mm; max-width: 70%; }
.course { font-family: 'Cormorant Garamond'; font-weight: 500; font-size: 22pt; color: ${primary}; line-height: 1.25; margin-bottom: 14mm; max-width: 80%; letter-spacing: -0.01em; }
.meta { display: flex; gap: 16mm; padding-top: 5mm; border-top: 1px solid ${primary}20; margin-top: auto; }
.m .lbl { font-size: 7pt; color: ${accent}; letter-spacing: 0.2em; text-transform: uppercase; font-weight: 500; margin-bottom: 1mm; }
.m .val { font-family: 'Cormorant Garamond'; font-weight: 500; font-size: 13pt; color: ${primary}; }
.footer { display: flex; justify-content: space-between; align-items: flex-end; padding-top: 6mm; font-size: 7.5pt; color: ${accent}; }
.footer strong { color: ${primary}; font-weight: 500; }
.id { font-family: 'JetBrains Mono'; font-size: 7pt; margin-top: 1mm; color: ${accent}; }
.qr { width: 20mm; height: 20mm; padding: 0.8mm; background: #fff; border: 0.5px solid ${primary}30; }
.qr img { width: 100%; height: 100%; }
</style></head>
<body>
<div class="bg-vignette"></div>
<div class="watermark">${escapeHtml(args.workspaceName)}</div>
<div class="watermark-2">authentic original</div>
<div class="frame"></div>
<div class="content">
  <div class="header">
    <div>
      <div class="brand">${escapeHtml(args.workspaceName)}</div>
      <div class="brand-sub">Certified Original Work</div>
    </div>
    <div class="serial">N° <strong>${escapeHtml(args.credentialId.slice(-8))}</strong><br>${dateFormatted}</div>
  </div>
  <div class="label">Certificate of Completion</div>
  <h1 class="recipient">${escapeHtml(args.recipientName)}</h1>
  <div class="divider"></div>
  <div class="desc">concluiu com excelência o programa de</div>
  <div class="course">${escapeHtml(args.courseName)}</div>
  <div class="meta">
    ${args.courseHours ? `<div class="m"><div class="lbl">Carga horária</div><div class="val">${args.courseHours} horas</div></div>` : ''}
    ${cpfFormatted ? `<div class="m"><div class="lbl">Documento</div><div class="val">${cpfFormatted}</div></div>` : ''}
    <div class="m"><div class="lbl">Emissão</div><div class="val">${dateFormatted}</div></div>
  </div>
  <div class="footer">
    <div>
      <div>Verifique em <strong>${escapeHtml(args.verifyUrl)}</strong></div>
      <div class="id">${escapeHtml(args.credentialId)}${hashShort ? ' · ' + escapeHtml(hashShort) : ''}</div>
    </div>
    <div class="qr"><img src="${qrSrc}" alt="QR"/></div>
  </div>
</div>
</body></html>`;
}

// ============================================================
// COACH — Motivacional, tipografia oversized, energia alta
// ============================================================
function renderCoach(args: Args): string {
  const cpfFormatted = formatCpf(args.cpf);
  const dateFormatted = formatDate(args.issuedAt);
  const primary = args.primaryColor ?? '#DC2626';
  const accent = args.accentColor ?? '#F59E0B';
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&format=png&margin=2&data=${encodeURIComponent(args.verifyUrl)}`;
  const hashShort = args.hashSha256 ? args.hashSha256.slice(0, 12) + '…' + args.hashSha256.slice(-6) : '';

  return `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="UTF-8">
<title>Certificado · ${escapeHtml(args.recipientName)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=Inter:wght@500;700;800;900&family=JetBrains+Mono:wght@400&display=swap" rel="stylesheet">
<style>
@page { size: A4 landscape; margin: 0; }
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { width: 297mm; height: 210mm; }
body { font-family: 'Inter', sans-serif; background: #FFF8E1; color: #1A0A05; position: relative; overflow: hidden; }
.bg-stripes { position: absolute; inset: 0; background: repeating-linear-gradient(135deg, ${accent}10 0, ${accent}10 4mm, transparent 4mm, transparent 8mm); }
.burst { position: absolute; top: -60mm; right: -60mm; width: 200mm; height: 200mm; border-radius: 50%; background: radial-gradient(circle, ${accent} 0%, ${primary} 60%, transparent 100%); opacity: 0.95; }
.burst-2 { position: absolute; bottom: -80mm; left: -50mm; width: 160mm; height: 160mm; border-radius: 50%; background: radial-gradient(circle, ${primary} 0%, transparent 70%); opacity: 0.5; }
.content { position: absolute; inset: 18mm; display: flex; flex-direction: column; }
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6mm; }
.brand { display: flex; align-items: center; gap: 3mm; color: #1A0A05; }
.brand-icon { width: 14mm; height: 14mm; background: #1A0A05; color: ${accent}; display: flex; align-items: center; justify-content: center; font-family: 'Archivo Black'; font-size: 18pt; transform: rotate(-4deg); box-shadow: 4px 4px 0 ${primary}; }
.brand-name { font-family: 'Archivo Black'; font-size: 14pt; letter-spacing: 0.04em; text-transform: uppercase; color: #1A0A05; }
.badge { padding: 3mm 6mm; background: #1A0A05; color: ${accent}; font-family: 'Archivo Black'; font-size: 11pt; letter-spacing: 0.15em; text-transform: uppercase; transform: rotate(3deg); box-shadow: -3px 3px 0 ${primary}; }
.shout { font-family: 'Archivo Black'; font-size: 26pt; line-height: 0.95; color: #1A0A05; letter-spacing: -0.02em; text-transform: uppercase; margin-bottom: 4mm; margin-top: 6mm; }
.shout em { color: ${primary}; font-style: normal; }
.recipient-block { margin-bottom: 8mm; }
.you-are { font-family: 'Inter'; font-weight: 800; font-size: 13pt; color: ${primary}; letter-spacing: 0.4em; text-transform: uppercase; margin-bottom: 2mm; }
.recipient { font-family: 'Archivo Black'; font-size: 92pt; line-height: 0.88; letter-spacing: -0.045em; text-transform: uppercase; color: #1A0A05; -webkit-text-stroke: 0; }
.recipient::after { content: '!'; color: ${primary}; }
.course-line { display: flex; align-items: center; gap: 4mm; margin-bottom: 4mm; flex-wrap: wrap; }
.course-pre { font-family: 'Inter'; font-weight: 700; font-size: 13pt; color: #1A0A05; }
.course { font-family: 'Archivo Black'; font-size: 24pt; line-height: 1.05; padding: 1mm 4mm; background: ${accent}; color: #1A0A05; transform: rotate(-1deg); box-shadow: 3px 3px 0 #1A0A05; text-transform: uppercase; letter-spacing: -0.01em; }
.stats { display: flex; gap: 8mm; margin-top: auto; padding: 5mm 0; border-top: 4px solid #1A0A05; border-bottom: 4px solid #1A0A05; }
.stat { display: flex; flex-direction: column; }
.stat .num { font-family: 'Archivo Black'; font-size: 28pt; line-height: 1.0; color: ${primary}; }
.stat .lbl { font-family: 'Inter'; font-weight: 800; font-size: 8.5pt; color: #1A0A05; letter-spacing: 0.15em; text-transform: uppercase; margin-top: 1mm; }
.footer { display: flex; justify-content: space-between; align-items: flex-end; padding-top: 5mm; font-family: 'Inter'; font-size: 8.5pt; color: #1A0A05; font-weight: 600; }
.footer strong { color: ${primary}; font-weight: 900; }
.id { font-family: 'JetBrains Mono'; font-size: 7pt; color: #555; margin-top: 1mm; }
.qr { width: 22mm; height: 22mm; padding: 1mm; background: #fff; border: 3px solid #1A0A05; box-shadow: 3px 3px 0 ${primary}; }
.qr img { width: 100%; height: 100%; }
</style></head>
<body>
<div class="bg-stripes"></div>
<div class="burst-2"></div>
<div class="burst"></div>
<div class="content">
  <div class="header">
    <div class="brand"><div class="brand-icon">${escapeHtml(args.workspaceName.charAt(0))}</div><div class="brand-name">${escapeHtml(args.workspaceName)}</div></div>
    <div class="badge">★ Mission Complete ★</div>
  </div>
  <div class="shout">Você FEZ acontecer.<br/>Hoje a história <em>mudou</em>.</div>
  <div class="recipient-block">
    <div class="you-are">Bora reconhecer</div>
    <h1 class="recipient">${escapeHtml(args.recipientName)}</h1>
  </div>
  <div class="course-line">
    <span class="course-pre">por dominar</span>
    <span class="course">${escapeHtml(args.courseName)}</span>
  </div>
  <div class="stats">
    ${args.courseHours ? `<div class="stat"><div class="num">${args.courseHours}h</div><div class="lbl">Horas de foco</div></div>` : ''}
    <div class="stat"><div class="num">100%</div><div class="lbl">Concluído</div></div>
    <div class="stat"><div class="num">★★★</div><div class="lbl">Aprovado</div></div>
    ${cpfFormatted ? `<div class="stat"><div class="num" style="font-size:14pt;padding-top:6mm">${cpfFormatted}</div><div class="lbl">CPF</div></div>` : ''}
    <div class="stat"><div class="num" style="font-size:14pt;padding-top:6mm">${dateFormatted}</div><div class="lbl">Conquista em</div></div>
  </div>
  <div class="footer">
    <div>
      <div>Confirme em <strong>${escapeHtml(args.verifyUrl)}</strong></div>
      <div class="id">${escapeHtml(args.credentialId)}${hashShort ? ' · ' + escapeHtml(hashShort) : ''}</div>
    </div>
    <div class="qr"><img src="${qrSrc}" alt="QR"/></div>
  </div>
</div>
</body></html>`;
}
