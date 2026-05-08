// UniverCert · Better Auth handler (rotas /api/auth/*)
// Sprint 12: rate limit defensivo + log de erros

import { getAuth } from '@/lib/auth';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

export const runtime = 'edge';

async function handler(request: Request) {
  // Rate limit em endpoints sensíveis: sign-in, sign-up, forget-password
  const url = new URL(request.url);
  const path = url.pathname;
  if (
    request.method === 'POST' &&
    (path.includes('/sign-in') ||
      path.includes('/sign-up') ||
      path.includes('/forget-password'))
  ) {
    const ip = getClientIp(request);
    // 10 tentativas por 5min por IP — bloqueia bruteforce sem afetar UX legítima
    const rl = await rateLimit({
      key: `auth:${path}:${ip}`,
      max: 10,
      windowSec: 300,
    });
    if (!rl.ok) {
      return Response.json(
        {
          error: 'rate_limited',
          message: 'Muitas tentativas. Aguarde alguns minutos e tente novamente.',
          retry_at: rl.resetAt,
        },
        { status: 429, headers: { 'retry-after': '300' } },
      );
    }
  }

  try {
    const auth = getAuth();
    return await auth.handler(request);
  } catch (e) {
    console.error('[auth handler error]', (e as Error)?.message, (e as Error)?.stack);
    return Response.json(
      {
        error: 'auth_internal',
        message: 'Erro interno na autenticação. Tente novamente em instantes.',
      },
      { status: 500 },
    );
  }
}

export const GET = handler;
export const POST = handler;
