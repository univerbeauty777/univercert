// UniverCert · Helpers pra deep links de share (S26)
// LinkedIn, WhatsApp, Twitter, Facebook, Email, Wallet

export type CertShareData = {
  recipientName: string;
  courseName: string;
  issuerName: string;
  issueDateISO: string;     // YYYY-MM-DD
  expiresDateISO?: string;  // YYYY-MM-DD opcional
  certUrl: string;          // url publica do verify (ex: https://univercert.com.br/c/abc123)
  credentialId: string;
  pdfUrl?: string;
  hours?: number;
};

/**
 * LinkedIn 'Add to profile' — formato oficial do LinkedIn.
 * https://www.linkedin.com/help/linkedin/answer/a567193
 */
export function linkedInAddToProfileUrl(d: CertShareData): string {
  const issueYear = d.issueDateISO.slice(0, 4);
  const issueMonth = parseInt(d.issueDateISO.slice(5, 7), 10);
  const params = new URLSearchParams({
    startTask: 'CERTIFICATION_NAME',
    name: d.courseName,
    organizationName: d.issuerName,
    issueYear,
    issueMonth: String(issueMonth),
    certUrl: d.certUrl,
    certId: d.credentialId,
  });
  if (d.expiresDateISO) {
    params.set('expirationYear', d.expiresDateISO.slice(0, 4));
    params.set('expirationMonth', String(parseInt(d.expiresDateISO.slice(5, 7), 10)));
  }
  return `https://www.linkedin.com/profile/add?${params.toString()}`;
}

/** LinkedIn share post (cert na timeline) */
export function linkedInShareUrl(d: CertShareData): string {
  return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(d.certUrl)}`;
}

/** WhatsApp share com texto pre-pronto */
export function whatsAppShareUrl(d: CertShareData): string {
  const text = `Acabei de concluir ${d.courseName} pela ${d.issuerName}! Verifica meu certificado: ${d.certUrl}`;
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

/** Twitter/X share */
export function twitterShareUrl(d: CertShareData): string {
  const text = `Concluí ${d.courseName} pela ${d.issuerName}! 🎓`;
  const params = new URLSearchParams({ text, url: d.certUrl });
  return `https://twitter.com/intent/tweet?${params.toString()}`;
}

/** Facebook share */
export function facebookShareUrl(d: CertShareData): string {
  return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(d.certUrl)}`;
}

/** Email share (mailto:) */
export function emailShareUrl(d: CertShareData): string {
  const subject = `Meu certificado de ${d.courseName}`;
  const body = `Olá!\n\nConcluí ${d.courseName} pela ${d.issuerName} em ${formatDateBR(d.issueDateISO)}.\n\nVerifique a autenticidade aqui:\n${d.certUrl}\n\nID: ${d.credentialId}`;
  return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/** Apple Wallet pkpass — endpoint que gera o .pkpass on-demand */
export function appleWalletUrl(credentialId: string, base: string): string {
  return `${base}/api/v1/credentials/${credentialId}/wallet/apple`;
}

/** Google Wallet pass — endpoint que gera JWT pass URL */
export function googleWalletUrl(credentialId: string, base: string): string {
  return `${base}/api/v1/credentials/${credentialId}/wallet/google`;
}

function formatDateBR(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

/** Hash IP pra LGPD (SHA-256 com salt) */
export async function hashIp(ip: string, salt: string = 'uc-share-salt'): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(`${salt}:${ip}`);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 32);
}
