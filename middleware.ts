// UniverCert · Edge middleware · Sprint 12 (security headers)
// Aplicado em TODAS rotas. Headers seguros sem afetar funcionalidade.

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // ==================================================
  // SECURITY HEADERS
  // ==================================================

  // HSTS — força HTTPS por 1 ano + preload
  res.headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains; preload',
  );

  // Bloqueia clickjacking (iframes só do mesmo origin)
  res.headers.set('X-Frame-Options', 'SAMEORIGIN');

  // Impede sniffing de MIME type
  res.headers.set('X-Content-Type-Options', 'nosniff');

  // Referrer policy — não vaza URL completa pra terceiros
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions Policy — bloqueia features sensíveis
  res.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=(self), usb=()',
  );

  // CSP — politicas de origem.
  // - 'unsafe-inline' em script-src é necessário pro Next.js inline scripts.
  //   Em S13 vamos migrar pra nonces.
  // - api.qrserver.com pra QR codes do cert template
  // - fonts.googleapis.com pra Inter + Cormorant
  // - wa.me e linkedin.com pra share buttons
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob: https://api.qrserver.com https:",
    "connect-src 'self' https://api.cloudflare.com https://api.mercadopago.com https://api.resend.com https://graph.facebook.com",
    "frame-ancestors 'self'",
    "form-action 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "upgrade-insecure-requests",
  ].join('; ');
  res.headers.set('Content-Security-Policy', csp);

  // Cross-Origin Resource Policy
  res.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  res.headers.set('Cross-Origin-Resource-Policy', 'same-site');

  // Server header obscuring
  res.headers.delete('Server');
  res.headers.delete('X-Powered-By');

  return res;
}

// Aplica em tudo exceto static assets e _next internals
export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static (assets)
     * - _next/image (image optimization)
     * - favicon, sitemap, robots, OG image
     * - api/v1/credentials/[id]/pdf  (CSP frame-ancestors precisa permitir embed do PDF)
     */
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest.webmanifest|opengraph-image|icon|apple-icon).*)',
  ],
};
