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

  // Sprint 19 DEBUG MODE: intercepta console.error pra capturar o que Better Auth loga
  const captured: any[] = [];
  const origError = console.error;
  console.error = (...args: any[]) => {
    captured.push(args.map((a) => (a instanceof Error ? `${a.name}: ${a.message}\n${a.stack}` : String(a))).join(' '));
    origError(...args);
  };

  try {
    const auth = getAuth();
    const resp = await auth.handler(request);

    // Se Better Auth retornou erro semântico (4xx/5xx) E console.error foi chamado,
    // anexa os logs no body pra debug.
    if (resp.status >= 400 && captured.length > 0) {
      const body = await resp.text();
      let parsed: any;
      try { parsed = JSON.parse(body); } catch { parsed = { raw: body }; }
      parsed._debug_captured = captured;
      return Response.json(parsed, { status: resp.status });
    }
    return resp;
  } catch (e) {
    return Response.json(
      {
        error: 'auth_internal_throw',
        message: (e as Error)?.message,
        stack: (e as Error)?.stack?.split('\n').slice(0, 12),
        captured,
      },
      { status: 500 },
    );
  } finally {
    console.error = origError;
  }
}

export const GET = handler;
export const POST = handler;
