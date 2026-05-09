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
  variant?: 'classic' | 'modern' | 'gold' | 'minimal' | 'executive' | 'creative';
};

// Catalogo público de variantes — usado pela galeria /templates
export const CERT_VARIANTS = [
  { id: 'classic', name: 'Classic', tagline: 'Editorial elegante', desc: 'Tipografia serifada, borda dupla ornamental, sensação de papel antigo. Ideal pra cursos livres e tradicionais.', defaultPrimary: '#1B2D5E', defaultAccent: '#D4A937' },
  { id: 'modern', name: 'Modern', tagline: 'Tech minimalista', desc: 'Banda lateral colorida, sans-serif bold. Pra cursos tech, marketing, design.', defaultPrimary: '#1B2D5E', defaultAccent: '#D4A937' },
  { id: 'gold', name: 'Gold', tagline: 'Luxo executive', desc: 'Dourado dominante, ornamentos art déco, papel cremoso. Pra cursos premium, estética, MBA.', defaultPrimary: '#0A1224', defaultAccent: '#D4A937' },
  { id: 'minimal', name: 'Minimal', tagline: 'Swiss style', desc: 'Branco absoluto, 1 acento de cor, geometria precisa. Pra cursos de design, arquitetura.', defaultPrimary: '#0A0E1A', defaultAccent: '#1B2D5E' },
  { id: 'executive', name: 'Executive', tagline: 'Corporate dark', desc: 'Fundo escuro premium, tipografia robusta, severo. Pra cursos de gestão, finanças, executivos.', defaultPrimary: '#0A1224', defaultAccent: '#D4A937' },
  { id: 'creative', name: 'Creative', tagline: 'Artistic gradient', desc: 'Gradient bold, tipografia oversized, vibrante. Pra cursos criativos, beleza, audiovisual.', defaultPrimary: '#1B2D5E', defaultAccent: '#EC4899' },
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
    case 'classic':
    default: return renderClassic(args);
  }
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
