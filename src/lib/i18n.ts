// UniverCert · i18n simples (S33)
// Sem dependencia de next-intl. 3 locales: pt-BR, en-US, es-ES.
// Cookie 'uc_locale' / Accept-Language fallback.

import { cookies, headers } from 'next/headers';

export type Locale = 'pt' | 'en' | 'es';

const LOCALES: Locale[] = ['pt', 'en', 'es'];
export const LOCALE_LABELS: Record<Locale, string> = {
  pt: 'Português',
  en: 'English',
  es: 'Español',
};
export const LOCALE_FLAGS: Record<Locale, string> = {
  pt: '🇧🇷',
  en: '🇺🇸',
  es: '🇪🇸',
};

const MESSAGES: Record<Locale, Record<string, string>> = {
  pt: {
    'verify.title': 'Esse certificado é real?',
    'verify.subtitle': 'Cole o ID, hash ou URL pra a gente confirmar na hora.',
    'verify.placeholder': 'cred_ABC123 · hash SHA-256 · ou URL',
    'verify.button': 'Verificar',
    'verify.notfound': 'Certificado não encontrado.',
    'verify.invalidId': 'Identificador inválido.',
    'cert.status.verified': 'Verificado',
    'cert.status.revoked': 'Revogado',
    'cert.status.expired': 'Expirado',
    'cert.label.certificate': 'Certificado de Conclusão',
    'cert.label.confersTo': 'conferimos a',
    'cert.label.completedCourse': 'por concluir com aproveitamento o curso de',
    'cert.label.hours': 'Carga horária',
    'cert.label.cpf': 'CPF',
    'cert.label.issuedOn': 'Emitido em',
    'cert.button.downloadPdf': 'Baixar PDF',
    'cert.button.linkedin': 'Adicionar ao LinkedIn',
    'cert.button.share': 'Compartilhar',
    'issuer.about': 'Sobre',
    'issuer.recentCerts': 'Certificados recentes',
    'issuer.testimonials': 'Depoimentos',
    'issuer.certCount': 'Certificados emitidos',
    'issuer.visitWebsite': 'Visitar site',
    'common.poweredBy': 'Powered by',
    'common.brandTagline': 'Certificados verificáveis · 🇧🇷 feito no Brasil',
  },
  en: {
    'verify.title': 'Is this certificate real?',
    'verify.subtitle': 'Paste the ID, hash, or URL and we\'ll confirm instantly.',
    'verify.placeholder': 'cred_ABC123 · SHA-256 hash · or URL',
    'verify.button': 'Verify',
    'verify.notfound': 'Certificate not found.',
    'verify.invalidId': 'Invalid identifier.',
    'cert.status.verified': 'Verified',
    'cert.status.revoked': 'Revoked',
    'cert.status.expired': 'Expired',
    'cert.label.certificate': 'Certificate of Completion',
    'cert.label.confersTo': 'awarded to',
    'cert.label.completedCourse': 'for successfully completing',
    'cert.label.hours': 'Workload',
    'cert.label.cpf': 'CPF',
    'cert.label.issuedOn': 'Issued on',
    'cert.button.downloadPdf': 'Download PDF',
    'cert.button.linkedin': 'Add to LinkedIn',
    'cert.button.share': 'Share',
    'issuer.about': 'About',
    'issuer.recentCerts': 'Recent certificates',
    'issuer.testimonials': 'Testimonials',
    'issuer.certCount': 'Certificates issued',
    'issuer.visitWebsite': 'Visit website',
    'common.poweredBy': 'Powered by',
    'common.brandTagline': 'Verifiable credentials · made in Brazil',
  },
  es: {
    'verify.title': '¿Este certificado es real?',
    'verify.subtitle': 'Pegue el ID, hash o URL y lo confirmamos al instante.',
    'verify.placeholder': 'cred_ABC123 · hash SHA-256 · o URL',
    'verify.button': 'Verificar',
    'verify.notfound': 'Certificado no encontrado.',
    'verify.invalidId': 'Identificador inválido.',
    'cert.status.verified': 'Verificado',
    'cert.status.revoked': 'Revocado',
    'cert.status.expired': 'Expirado',
    'cert.label.certificate': 'Certificado de Finalización',
    'cert.label.confersTo': 'otorgado a',
    'cert.label.completedCourse': 'por completar con éxito el curso de',
    'cert.label.hours': 'Carga horaria',
    'cert.label.cpf': 'CPF',
    'cert.label.issuedOn': 'Emitido el',
    'cert.button.downloadPdf': 'Descargar PDF',
    'cert.button.linkedin': 'Agregar a LinkedIn',
    'cert.button.share': 'Compartir',
    'issuer.about': 'Acerca de',
    'issuer.recentCerts': 'Certificados recientes',
    'issuer.testimonials': 'Testimonios',
    'issuer.certCount': 'Certificados emitidos',
    'issuer.visitWebsite': 'Visitar sitio',
    'common.poweredBy': 'Powered by',
    'common.brandTagline': 'Credenciales verificables · hecho en Brasil',
  },
};

/** Detecta locale via cookie ou Accept-Language */
export async function getLocale(): Promise<Locale> {
  try {
    const c = await cookies();
    const cookieLocale = c.get('uc_locale')?.value;
    if (cookieLocale && (LOCALES as string[]).includes(cookieLocale)) return cookieLocale as Locale;

    const h = await headers();
    const al = h.get('accept-language') ?? '';
    const lang = al.toLowerCase().split(',')[0]?.slice(0, 2);
    if (lang === 'en' || lang === 'es') return lang;
    return 'pt';
  } catch {
    return 'pt';
  }
}

/** Server-side translation helper */
export function t(locale: Locale, key: string, fallback?: string): string {
  return MESSAGES[locale]?.[key] ?? MESSAGES.pt[key] ?? fallback ?? key;
}

/** Client-side: cria translator */
export function createT(locale: Locale) {
  return (key: string, fallback?: string) => t(locale, key, fallback);
}

export const ALL_LOCALES = LOCALES;
