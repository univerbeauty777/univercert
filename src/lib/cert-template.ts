// UniverCert · gera HTML do certificado pra Browser Rendering
// Sprint 1.5: template default. Sprint 2: usar template do banco (templates.layoutJson).

type Args = {
  recipientName: string;
  cpf: string | null;
  courseName: string;
  courseHours: number | null;
  issuedAt: number; // unix
  credentialId: string;
  workspaceName: string;
  verifyUrl: string;
};

function formatCpf(cpf: string | null): string | null {
  if (!cpf) return null;
  const c = cpf.replace(/\D/g, '');
  if (c.length !== 11) return cpf;
  return `${c.slice(0, 3)}.${c.slice(3, 6)}.${c.slice(6, 9)}-${c.slice(9)}`;
}

function formatDate(unix: number): string {
  return new Date(unix * 1000).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

export function renderCertificateHtml(args: Args): string {
  const cpfFormatted = formatCpf(args.cpf);
  const dateFormatted = formatDate(args.issuedAt);
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
    args.verifyUrl,
  )}`;

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Certificado · ${escapeHtml(args.recipientName)}</title>
<style>
  @page { size: A4 landscape; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Helvetica Neue', Arial, sans-serif;
    width: 297mm; height: 210mm;
    background: #fff;
    color: #1a1a2e;
    position: relative;
  }
  .border-frame {
    position: absolute; inset: 12mm;
    border: 2px solid #6366F1;
    border-radius: 4mm;
  }
  .border-frame::before {
    content: ''; position: absolute; inset: 3mm;
    border: 1px solid #EC4899;
    border-radius: 2mm;
  }
  .content {
    position: relative; z-index: 2;
    padding: 28mm 25mm; height: 100%;
    display: flex; flex-direction: column; justify-content: center; text-align: center;
  }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8mm; }
  .org-name { font-weight: 800; font-size: 11pt; color: #6366F1; letter-spacing: 0.04em; text-transform: uppercase; }
  .verified-badge {
    display: inline-flex; align-items: center; gap: 4pt;
    padding: 3pt 10pt; background: #10B981; color: #fff;
    font-size: 8pt; font-weight: 700; border-radius: 999pt; text-transform: uppercase; letter-spacing: 0.06em;
  }
  .certificate-label {
    font-size: 11pt; letter-spacing: 0.3em; text-transform: uppercase;
    color: #999; margin-bottom: 6mm;
  }
  .recipient-name {
    font-size: 36pt; font-weight: 800; letter-spacing: -0.02em;
    background: linear-gradient(135deg, #1a1a2e 30%, #4F46E5);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    color: #1a1a2e;
    margin-bottom: 6mm;
  }
  .description { font-size: 13pt; color: #555; margin-bottom: 4mm; }
  .course-name {
    font-size: 22pt; font-weight: 700; color: #6366F1;
    margin-bottom: 12mm;
  }
  .meta { display: flex; justify-content: space-around; padding-top: 6mm; border-top: 1px solid #e5e7eb; font-size: 10pt; }
  .meta-item .label { font-size: 8pt; color: #999; text-transform: uppercase; letter-spacing: 0.08em; font-weight: 700; margin-bottom: 2pt; }
  .meta-item .value { font-weight: 600; color: #1a1a2e; }
  .footer {
    position: absolute; bottom: 12mm; left: 25mm; right: 25mm;
    display: flex; justify-content: space-between; align-items: flex-end;
    font-size: 8pt; color: #888;
  }
  .qr { width: 22mm; height: 22mm; background: #fff; padding: 2mm; border: 1px solid #e5e7eb; }
  .qr img { width: 100%; height: 100%; }
  .credential-id { font-family: 'Courier New', monospace; font-size: 8pt; color: #999; margin-top: 1mm; }
</style>
</head>
<body>
  <div class="border-frame"></div>
  <div class="content">
    <div class="header">
      <div class="org-name">${escapeHtml(args.workspaceName)}</div>
      <div class="verified-badge">✓ Verificado</div>
    </div>

    <div class="certificate-label">Certificado de Conclusão</div>
    <h1 class="recipient-name">${escapeHtml(args.recipientName)}</h1>
    <div class="description">Concluiu com aproveitamento o curso de</div>
    <div class="course-name">${escapeHtml(args.courseName)}</div>

    <div class="meta">
      ${args.courseHours ? `<div class="meta-item"><div class="label">Carga horária</div><div class="value">${args.courseHours}h</div></div>` : ''}
      ${cpfFormatted ? `<div class="meta-item"><div class="label">CPF</div><div class="value">${cpfFormatted}</div></div>` : ''}
      <div class="meta-item"><div class="label">Emitido em</div><div class="value">${dateFormatted}</div></div>
    </div>
  </div>

  <div class="footer">
    <div>
      <div>Verificável em ${escapeHtml(args.verifyUrl)}</div>
      <div class="credential-id">ID: ${escapeHtml(args.credentialId)}</div>
    </div>
    <div class="qr"><img src="${qrSrc}" alt="QR" /></div>
  </div>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
