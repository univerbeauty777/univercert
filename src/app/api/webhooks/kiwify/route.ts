// UniverCert · webhook Kiwify (compra aprovada)
// Header: x-kiwify-signature
//
// URL: https://univercert.com.br/api/webhooks/kiwify?ws=univerhair

import { processWebhook, getWebhookSecret, resolveWorkspaceFromQuery } from '@/lib/webhook-handler';
import { verifyHmacSha256 } from '@/lib/hmac';

export const runtime = 'edge';

export async function POST(request: Request) {
  const url = new URL(request.url);
  const wsSlug = await resolveWorkspaceFromQuery(url.searchParams);
  if (!wsSlug) return Response.json({ error: 'workspace_query_param_required' }, { status: 400 });

  const rawBody = await request.text();
  const sig = request.headers.get('x-kiwify-signature') ?? '';
  const secret = await getWebhookSecret(wsSlug, 'kiwify');
  if (secret) {
    const valid = await verifyHmacSha256(rawBody, sig, secret);
    if (!valid) return Response.json({ error: 'invalid_signature' }, { status: 401 });
  }

  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return Response.json({ error: 'invalid_json' }, { status: 400 });
  }

  if (payload?.order_status !== 'paid' && payload?.webhook_event_type !== 'order_approved') {
    return Response.json({ ok: true, ignored: payload?.webhook_event_type });
  }

  const customer = payload?.Customer ?? payload?.customer ?? {};
  const product = payload?.Product ?? payload?.product ?? {};

  if (!product?.product_name || !customer?.email) {
    return Response.json({ error: 'missing_fields' }, { status: 400 });
  }

  const result = await processWebhook('kiwify', rawBody, {
    workspaceSlug: wsSlug,
    courseName: product.product_name,
    student: {
      name: customer.full_name ?? customer.first_name ?? customer.email,
      email: customer.email,
      cpf: customer.cpf ?? customer.CPF,
      phone: customer.mobile ?? customer.phone,
    },
    externalRef: payload?.order_id,
  });

  if (!result.ok) return Response.json({ error: result.error }, { status: result.status });
  return Response.json({ ok: true, request_id: result.requestId });
}
