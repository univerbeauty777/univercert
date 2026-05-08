// UniverCert · cron handler de NPS D+7
// Configurar trigger Cloudflare Cron pra rodar uma vez por dia (ex: 09:00 BRT)

import { sendNpsBatch } from '@/lib/nps';

export const runtime = 'edge';

export async function GET(request: Request) {
  // Validação simples: só permite chamada com header secret
  const auth = request.headers.get('authorization') ?? '';
  const expected = `Bearer ${process.env.CRON_SECRET ?? 'dev-cron-secret'}`;
  if (auth !== expected) {
    return Response.json({ error: 'unauthorized' }, { status: 401 });
  }

  const result = await sendNpsBatch();
  return Response.json({ ok: true, ...result, timestamp: Date.now() });
}
