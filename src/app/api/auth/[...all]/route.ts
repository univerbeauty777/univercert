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
    const resp = await auth.handler(request);
    // Sprint 19 hotfix DEBUG: se Better Auth retornar 500 com body vazio
    // (o que vem acontecendo), capturamos e expomos info pra debug.
    // REMOVER esse bloco após consertar o bug do signup.
    if (resp.status >= 500 && resp.headers.get('content-length') === '0') {
      const debugInfo = {
        error: 'better_auth_silent_500',
        path,
        method: request.method,
        status: resp.status,
        message: 'Better Auth retornou 500 sem body. Veja workers logs.',
        hint: 'Provavelmente schema mismatch — algum campo NOT NULL faltando ou coluna inexistente',
      };
      return Response.json(debugInfo, { status: 500 });
    }
    return resp;
  } catch (e) {
    console.error('[auth handler error]', (e as Error)?.message, (e as Error)?.stack);
    return Response.json(
      {
        error: 'auth_internal_throw',
        message: (e as Error)?.message,
        stack: (e as Error)?.stack?.split('\n').slice(0, 8),
      },
      { status: 500 },
    );
  }
}

export const GET = handler;
export const POST = handler;
