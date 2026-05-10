// UniverCert · POST /api/v1/webhooks/pagarme (S35)
// Stub honesto — implementacao completa quando creds Pagar.me v5 plugadas.

import { getRequestContext } from '@cloudflare/next-on-pages';

export const runtime = 'edge';

export async function POST(req: Request) {
  const { env } = getRequestContext();
  if (!(env as any).PAGARME_WEBHOOK_SECRET) {
    return Response.json({
      ok: false,
      error: 'pagarme_webhook_not_configured',
      message: 'Configure PAGARME_API_KEY + PAGARME_WEBHOOK_SECRET nas env vars do Cloudflare Pages.',
      events_to_handle: ['order.paid', 'order.payment_failed', 'subscription.created', 'subscription.canceled', 'invoice.paid'],
    }, { status: 501 });
  }
  // TODO: HMAC verify (Pagar.me v5 usa X-Hub-Signature)
  // TODO: switch event.type → upsert subscription + insert invoice
  return Response.json({ ok: false, error: 'pagarme_handler_stub' }, { status: 501 });
}
