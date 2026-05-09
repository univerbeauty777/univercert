// UniverCert · Helpers + types compartilhados entre cert-template e layout-v2

export function formatCpf(cpf: string | null): string | null {
  if (!cpf) return null;
  const c = cpf.replace(/\D/g, '');
  if (c.length !== 11) return cpf;
  return `${c.slice(0, 3)}.${c.slice(3, 6)}.${c.slice(6, 9)}-${c.slice(9)}`;
}

export function formatDate(unix: number): string {
  return new Date(unix * 1000).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric',
  });
}

export function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

export type CertArgs = {
  recipientName: string;
  cpf: string | null;
  courseName: string;
  courseHours: number | null;
  issuedAt: number;
  credentialId: string;
  hashSha256?: string;
  workspaceName: string;
  verifyUrl: string;
  city?: string;
  primaryColor?: string;
  accentColor?: string;
};
