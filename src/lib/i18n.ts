// UniverCert · i18n GODMODE — 4 locales (pt/en/es/fr) com landing strings
import { cookies, headers } from 'next/headers';

export type Locale = 'pt' | 'en' | 'es' | 'fr';
const LOCALES: Locale[] = ['pt', 'en', 'es', 'fr'];

export const LOCALE_LABELS: Record<Locale, string> = {
  pt: 'Português', en: 'English', es: 'Español', fr: 'Français',
};
export const LOCALE_FLAGS: Record<Locale, string> = { pt: '🇧🇷', en: '🇺🇸', es: '🇪🇸', fr: '🇫🇷' };

// Geo-mapping: country code → locale
const COUNTRY_TO_LOCALE: Record<string, Locale> = {
  BR: 'pt', PT: 'pt', AO: 'pt', MZ: 'pt', CV: 'pt', GW: 'pt', ST: 'pt', TL: 'pt',
  US: 'en', GB: 'en', CA: 'en', AU: 'en', NZ: 'en', IE: 'en', IN: 'en', SG: 'en', ZA: 'en', PH: 'en',
  ES: 'es', MX: 'es', AR: 'es', CO: 'es', PE: 'es', VE: 'es', CL: 'es', EC: 'es', GT: 'es', CU: 'es', BO: 'es', DO: 'es', HN: 'es', PY: 'es', SV: 'es', NI: 'es', CR: 'es', PA: 'es', UY: 'es', PR: 'es',
  FR: 'fr', BE: 'fr', CH: 'fr', LU: 'fr', MC: 'fr', SN: 'fr', CI: 'fr', CM: 'fr', MG: 'fr', BF: 'fr', NE: 'fr', ML: 'fr', TD: 'fr', GN: 'fr', RW: 'fr', BI: 'fr', BJ: 'fr', TG: 'fr', CD: 'fr', CG: 'fr', GA: 'fr', DJ: 'fr', KM: 'fr', HT: 'fr', VU: 'fr', SC: 'fr', NC: 'fr', PF: 'fr',
};

const MESSAGES: Record<Locale, Record<string, string>> = {
  pt: {
    // VERIFY
    'verify.title': 'Esse certificado é real?',
    'verify.subtitle': 'Cole o ID, hash ou URL pra a gente confirmar na hora.',
    'verify.placeholder': 'cred_ABC123 · hash SHA-256 · ou URL',
    'verify.button': 'Verificar',
    // CERT
    'cert.status.verified': 'Verificado',
    'cert.status.revoked': 'Revogado',
    'cert.label.certificate': 'Certificado de Conclusão',
    'cert.button.downloadPdf': 'Baixar PDF',
    // NAV
    'nav.features': 'Recursos',
    'nav.pricing': 'Preços',
    'nav.compare': 'Compare',
    'nav.docs': 'Docs',
    'nav.signin': 'Entrar',
    'nav.signup': 'Grátis',
    // HERO
    'hero.badge': '🏆 #1 no Brasil em certificados digitais',
    'hero.title.line1': 'Certificados digitais',
    'hero.title.line2': 'que vendem por você',
    'hero.subtitle': 'A única plataforma com IA generativa, white-label total, Apple/Google Wallet, Open Badges 3.0 e webhooks em tempo real. Tudo isso por menos da metade do preço da concorrência.',
    'hero.cta.primary': 'Começar grátis em 30s',
    'hero.cta.secondary': 'Ver demo ao vivo →',
    'hero.trust': 'Sem cartão · Trial 14 dias · Suporte em português',
    // FEATURES heading
    'features.title': 'Tudo que sua escola precisa em uma plataforma',
    'features.subtitle': '+50 recursos. Da emissão à analytics avançada.',
    // FEATURE CATEGORIES
    'features.cat.editor': 'Editor profissional',
    'features.cat.ai': 'Inteligência artificial',
    'features.cat.delivery': 'Entrega & engajamento',
    'features.cat.integrations': 'Integrações',
    'features.cat.security': 'Segurança & compliance',
    'features.cat.business': 'Negócio & analytics',
    'features.cat.branding': 'Marca & white-label',
    'features.cat.standards': 'Padrões internacionais',
    // COMPARISON
    'compare.title': 'Por que UniverCert vence Credly, Accredible, Sertifier e Hotmart',
    'compare.subtitle': 'Compare ponto a ponto. Sem letra miúda.',
    'compare.feature': 'Recurso',
    'compare.us': 'UniverCert',
    // PRICING
    'pricing.title': 'Preços honestos. Brasileiros.',
    'pricing.subtitle': 'Pague em Real ou Dólar. PIX, cartão, boleto.',
    'pricing.month': '/mês',
    'pricing.year': '/ano',
    'pricing.popular': 'MAIS POPULAR',
    'pricing.cta.free': 'Começar grátis',
    'pricing.cta.starter': 'Escolher Starter',
    'pricing.cta.pro': 'Escolher Pro',
    'pricing.cta.enterprise': 'Falar com vendas',
    // TESTIMONIALS
    'testimonials.title': 'Quem já usa',
    // FAQ
    'faq.title': 'Perguntas frequentes',
    // CTA FINAL
    'cta.title': 'Pronto pra emitir seu primeiro certificado?',
    'cta.subtitle': 'Crie sua conta grátis em 30 segundos. Sem cartão. Cancele quando quiser.',
    'cta.button': 'Começar agora →',
    // FOOTER
    'footer.product': 'Produto',
    'footer.resources': 'Recursos',
    'footer.company': 'Empresa',
    'footer.legal': 'Legal',
    'footer.rights': '© 2026 UniverCert · Todos os direitos reservados',
    'footer.tagline': 'A plataforma de certificados digitais que sua escola merece.',
  },
  en: {
    'verify.title': 'Is this certificate real?',
    'verify.subtitle': 'Paste the ID, hash, or URL and we\'ll confirm instantly.',
    'verify.placeholder': 'cred_ABC123 · SHA-256 hash · or URL',
    'verify.button': 'Verify',
    'cert.status.verified': 'Verified',
    'cert.status.revoked': 'Revoked',
    'cert.label.certificate': 'Certificate of Completion',
    'cert.button.downloadPdf': 'Download PDF',
    'nav.features': 'Features',
    'nav.pricing': 'Pricing',
    'nav.compare': 'Compare',
    'nav.docs': 'Docs',
    'nav.signin': 'Sign in',
    'nav.signup': 'Free',
    'hero.badge': '🏆 #1 in Latin America for digital credentials',
    'hero.title.line1': 'Digital certificates',
    'hero.title.line2': 'that sell for you',
    'hero.subtitle': 'The only platform with generative AI, full white-label, Apple/Google Wallet, Open Badges 3.0, and real-time webhooks. All for less than half of what competitors charge.',
    'hero.cta.primary': 'Start free in 30s',
    'hero.cta.secondary': 'See live demo →',
    'hero.trust': 'No credit card · 14-day trial · Multilingual support',
    'features.title': 'Everything your school needs in one platform',
    'features.subtitle': '+50 features. From issuing to advanced analytics.',
    'features.cat.editor': 'Pro editor',
    'features.cat.ai': 'Artificial intelligence',
    'features.cat.delivery': 'Delivery & engagement',
    'features.cat.integrations': 'Integrations',
    'features.cat.security': 'Security & compliance',
    'features.cat.business': 'Business & analytics',
    'features.cat.branding': 'Brand & white-label',
    'features.cat.standards': 'International standards',
    'compare.title': 'Why UniverCert beats Credly, Accredible, Sertifier and Hotmart',
    'compare.subtitle': 'Compare point-by-point. No fine print.',
    'compare.feature': 'Feature',
    'compare.us': 'UniverCert',
    'pricing.title': 'Honest pricing. Brazilian-built.',
    'pricing.subtitle': 'Pay in BRL, USD or EUR. Card, PIX, bank transfer.',
    'pricing.month': '/month',
    'pricing.year': '/year',
    'pricing.popular': 'MOST POPULAR',
    'pricing.cta.free': 'Start free',
    'pricing.cta.starter': 'Choose Starter',
    'pricing.cta.pro': 'Choose Pro',
    'pricing.cta.enterprise': 'Talk to sales',
    'testimonials.title': 'Who uses it',
    'faq.title': 'Frequently asked questions',
    'cta.title': 'Ready to issue your first certificate?',
    'cta.subtitle': 'Create your free account in 30 seconds. No card. Cancel anytime.',
    'cta.button': 'Start now →',
    'footer.product': 'Product',
    'footer.resources': 'Resources',
    'footer.company': 'Company',
    'footer.legal': 'Legal',
    'footer.rights': '© 2026 UniverCert · All rights reserved',
    'footer.tagline': 'The digital credentials platform your school deserves.',
  },
  es: {
    'verify.title': '¿Este certificado es real?',
    'verify.subtitle': 'Pegue el ID, hash o URL y lo confirmamos al instante.',
    'verify.placeholder': 'cred_ABC123 · hash SHA-256 · o URL',
    'verify.button': 'Verificar',
    'cert.status.verified': 'Verificado',
    'cert.status.revoked': 'Revocado',
    'cert.label.certificate': 'Certificado de Finalización',
    'cert.button.downloadPdf': 'Descargar PDF',
    'nav.features': 'Recursos',
    'nav.pricing': 'Precios',
    'nav.compare': 'Comparar',
    'nav.docs': 'Docs',
    'nav.signin': 'Entrar',
    'nav.signup': 'Gratis',
    'hero.badge': '🏆 #1 en Latinoamérica en credenciales digitales',
    'hero.title.line1': 'Certificados digitales',
    'hero.title.line2': 'que venden por ti',
    'hero.subtitle': 'La única plataforma con IA generativa, white-label total, Apple/Google Wallet, Open Badges 3.0 y webhooks en tiempo real. Todo por menos de la mitad del precio de la competencia.',
    'hero.cta.primary': 'Empezar gratis en 30s',
    'hero.cta.secondary': 'Ver demo en vivo →',
    'hero.trust': 'Sin tarjeta · Prueba 14 días · Soporte multilingüe',
    'features.title': 'Todo lo que tu escuela necesita en una plataforma',
    'features.subtitle': '+50 recursos. Desde la emisión hasta analytics avanzado.',
    'features.cat.editor': 'Editor profesional',
    'features.cat.ai': 'Inteligencia artificial',
    'features.cat.delivery': 'Entrega y engagement',
    'features.cat.integrations': 'Integraciones',
    'features.cat.security': 'Seguridad y cumplimiento',
    'features.cat.business': 'Negocio y analytics',
    'features.cat.branding': 'Marca y white-label',
    'features.cat.standards': 'Estándares internacionales',
    'compare.title': 'Por qué UniverCert le gana a Credly, Accredible, Sertifier y Hotmart',
    'compare.subtitle': 'Compara punto por punto. Sin letra pequeña.',
    'compare.feature': 'Recurso',
    'compare.us': 'UniverCert',
    'pricing.title': 'Precios honestos.',
    'pricing.subtitle': 'Paga en USD, EUR o BRL. Tarjeta, PIX, transferencia.',
    'pricing.month': '/mes',
    'pricing.year': '/año',
    'pricing.popular': 'MÁS POPULAR',
    'pricing.cta.free': 'Empezar gratis',
    'pricing.cta.starter': 'Elegir Starter',
    'pricing.cta.pro': 'Elegir Pro',
    'pricing.cta.enterprise': 'Hablar con ventas',
    'testimonials.title': 'Quién lo usa',
    'faq.title': 'Preguntas frecuentes',
    'cta.title': '¿Listo para emitir tu primer certificado?',
    'cta.subtitle': 'Crea tu cuenta gratis en 30 segundos. Sin tarjeta. Cancela cuando quieras.',
    'cta.button': 'Empezar ahora →',
    'footer.product': 'Producto',
    'footer.resources': 'Recursos',
    'footer.company': 'Empresa',
    'footer.legal': 'Legal',
    'footer.rights': '© 2026 UniverCert · Todos los derechos reservados',
    'footer.tagline': 'La plataforma de credenciales digitales que tu escuela merece.',
  },
  fr: {
    'verify.title': 'Ce certificat est-il authentique?',
    'verify.subtitle': 'Collez l\'ID, le hash ou l\'URL et nous confirmerons instantanément.',
    'verify.placeholder': 'cred_ABC123 · hash SHA-256 · ou URL',
    'verify.button': 'Vérifier',
    'cert.status.verified': 'Vérifié',
    'cert.status.revoked': 'Révoqué',
    'cert.label.certificate': 'Certificat de Fin de Formation',
    'cert.button.downloadPdf': 'Télécharger PDF',
    'nav.features': 'Fonctionnalités',
    'nav.pricing': 'Tarifs',
    'nav.compare': 'Comparer',
    'nav.docs': 'Docs',
    'nav.signin': 'Connexion',
    'nav.signup': 'Gratuit',
    'hero.badge': '🏆 N°1 au Brésil pour les certificats numériques',
    'hero.title.line1': 'Certificats numériques',
    'hero.title.line2': 'qui vendent pour vous',
    'hero.subtitle': 'La seule plateforme avec IA générative, white-label complet, Apple/Google Wallet, Open Badges 3.0 et webhooks en temps réel. Le tout pour moins de la moitié du prix des concurrents.',
    'hero.cta.primary': 'Commencer gratuitement en 30s',
    'hero.cta.secondary': 'Voir la démo en direct →',
    'hero.trust': 'Sans carte · Essai 14 jours · Support multilingue',
    'features.title': 'Tout ce dont votre école a besoin sur une seule plateforme',
    'features.subtitle': '+50 fonctionnalités. De l\'émission aux analytics avancés.',
    'features.cat.editor': 'Éditeur pro',
    'features.cat.ai': 'Intelligence artificielle',
    'features.cat.delivery': 'Livraison & engagement',
    'features.cat.integrations': 'Intégrations',
    'features.cat.security': 'Sécurité & conformité',
    'features.cat.business': 'Business & analytics',
    'features.cat.branding': 'Marque & white-label',
    'features.cat.standards': 'Standards internationaux',
    'compare.title': 'Pourquoi UniverCert bat Credly, Accredible, Sertifier et Hotmart',
    'compare.subtitle': 'Comparez point par point. Sans petits caractères.',
    'compare.feature': 'Fonctionnalité',
    'compare.us': 'UniverCert',
    'pricing.title': 'Tarifs honnêtes.',
    'pricing.subtitle': 'Payez en EUR, USD ou BRL. Carte, virement, PayPal.',
    'pricing.month': '/mois',
    'pricing.year': '/an',
    'pricing.popular': 'PLUS POPULAIRE',
    'pricing.cta.free': 'Commencer gratuitement',
    'pricing.cta.starter': 'Choisir Starter',
    'pricing.cta.pro': 'Choisir Pro',
    'pricing.cta.enterprise': 'Contacter les ventes',
    'testimonials.title': 'Qui l\'utilise',
    'faq.title': 'Questions fréquentes',
    'cta.title': 'Prêt à émettre votre premier certificat?',
    'cta.subtitle': 'Créez votre compte gratuit en 30 secondes. Sans carte. Annulez à tout moment.',
    'cta.button': 'Commencer maintenant →',
    'footer.product': 'Produit',
    'footer.resources': 'Ressources',
    'footer.company': 'Entreprise',
    'footer.legal': 'Légal',
    'footer.rights': '© 2026 UniverCert · Tous droits réservés',
    'footer.tagline': 'La plateforme de credentials numériques que votre école mérite.',
  },
};

export async function getLocale(): Promise<Locale> {
  try {
    const c = await cookies();
    const cookieLocale = c.get('uc_locale')?.value;
    if (cookieLocale && (LOCALES as string[]).includes(cookieLocale)) return cookieLocale as Locale;
    const h = await headers();
    const country = h.get('cf-ipcountry')?.toUpperCase();
    if (country && COUNTRY_TO_LOCALE[country]) return COUNTRY_TO_LOCALE[country];
    const al = h.get('accept-language') ?? '';
    const lang = al.toLowerCase().split(',')[0]?.slice(0, 2);
    if (lang === 'en' || lang === 'es' || lang === 'fr') return lang;
    return 'pt';
  } catch { return 'pt'; }
}

export function detectLocaleFromCountry(country: string | null): Locale {
  if (!country) return 'pt';
  return COUNTRY_TO_LOCALE[country.toUpperCase()] ?? 'en';
}

export function t(locale: Locale, key: string, fallback?: string): string {
  return MESSAGES[locale]?.[key] ?? MESSAGES.pt[key] ?? fallback ?? key;
}

export function createT(locale: Locale) {
  return (key: string, fallback?: string) => t(locale, key, fallback);
}

export const ALL_LOCALES = LOCALES;
