// UniverCert · GET /api/v1/affiliate/track?ref=CODE&redirect=/path (S44)
// Setia cookie uc_ref e redireciona pra landing.

import { setReferralCookie } from '@/lib/affiliate';

export const runtime = 'edge';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const ref = url.searchParams.get('ref')?.trim();
  const dest = url.searchParams.get('redirect') || '/';
  if (!ref) return Response.redirect(new URL(dest, req.url).toString(), 302);

  await setReferralCookie(ref).catch(() => {});

  // Sanitize dest pra evitar open redirect
  const safeDest = dest.startsWith('/') ? dest : '/';
  return Response.redirect(new URL(safeDest, req.url).toString(), 302);
}
