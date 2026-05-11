// UniverCert · Middleware — geo-redirect raiz pra /[locale]
// Detecta CF-IPCountry + cookie + Accept-Language

import { NextRequest, NextResponse } from 'next/server';

const LOCALES = new Set(['pt', 'en', 'es', 'fr']);

// Country → locale mapping (subset; full em lib/i18n.ts)
const COUNTRY_LOCALE: Record<string, string> = {
  BR: 'pt', PT: 'pt', AO: 'pt', MZ: 'pt', CV: 'pt', GW: 'pt', ST: 'pt', TL: 'pt',
  US: 'en', GB: 'en', CA: 'en', AU: 'en', NZ: 'en', IE: 'en', IN: 'en', SG: 'en', ZA: 'en', PH: 'en',
  ES: 'es', MX: 'es', AR: 'es', CO: 'es', PE: 'es', VE: 'es', CL: 'es', EC: 'es', GT: 'es', CU: 'es',
  BO: 'es', DO: 'es', HN: 'es', PY: 'es', SV: 'es', NI: 'es', CR: 'es', PA: 'es', UY: 'es', PR: 'es',
  FR: 'fr', BE: 'fr', CH: 'fr', LU: 'fr', MC: 'fr', SN: 'fr', CI: 'fr', CM: 'fr', MG: 'fr', BF: 'fr',
};

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip se ja tem locale ou é rota interna/API/asset
  if (pathname === '/' || pathname === '') {
    // Detecta locale
    const cookieLocale = req.cookies.get('uc_locale')?.value;
    const country = req.headers.get('cf-ipcountry')?.toUpperCase();
    const al = req.headers.get('accept-language')?.toLowerCase().slice(0, 2);

    let target = 'pt'; // default
    if (cookieLocale && LOCALES.has(cookieLocale)) target = cookieLocale;
    else if (country && COUNTRY_LOCALE[country]) target = COUNTRY_LOCALE[country];
    else if (al && LOCALES.has(al)) target = al;

    const url = req.nextUrl.clone();
    url.pathname = `/${target}`;
    return NextResponse.redirect(url, 302);
  }

  return NextResponse.next();
}

export const config = {
  // SO roda na raiz
  matcher: ['/'],
};
