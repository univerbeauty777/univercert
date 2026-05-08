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
  variant?: 'classic' | 'modern';
};

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
  return variant === 'modern' ? renderModern(args) : renderClassic(args);
}

// ============================================================
// CLASSIC — Editorial elegante (Cormorant Garamond no nome)
// ============================================================
function renderClassic(args: Args): string {
  const cpfFormatted = formatCpf(args.cpf);
  const dateFormatted = formatDate(args.issuedAt);
  const primary = args.primaryColor ?? '#6366F1';
  const accent = args.accentColor ?? '#EC4899';
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
.org-icon { width: 12mm; height: 12mm; background: linear-gradient(135deg, ${primary}, ${accent}); border-radius: 3mm; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 7mm; font-weight: 700; box-shadow: 0 2mm 4mm ${primary}40; }
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
    <div class="org-icon">🏆</div>
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
  const primary = args.primaryColor ?? '#6366F1';
  const accent = args.accentColor ?? '#EC4899';
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
