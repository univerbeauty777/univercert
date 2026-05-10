// UniverCert · webhook Eduzz
// URL: https://univercert.net/api/webhooks/eduzz?ws=univerhair

import { processWebhook, getWebhookSecret, resolveWorkspaceFromQuery } from '@/lib/webhook-handler';
import { verifyHmacSha256 } from '@/lib/hmac';

export const runtime = 'edge';

export async function POST(request: Request) {
  const url = new URL(request.url);
  const wsSlug = await resolveWorkspaceFromQuery(url.searchParams);
  if (!wsSlug) return Response.json({ error: 'workspace_query_param_required' }, { status: 400 });

  const rawBody = await request.text();
  const sig = request.headers.get('x-eduzz-signature') ?? '';
  const secret = await getWebhookSecret(wsSlug, 'eduzz');
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

  if (payload?.trans_status !== 'paid' && payload?.event !== 'order.paid') {
    return Response.json({ ok: true, ignored: payload?.event ?? payload?.trans_status });
  }

  const product = payload?.product ?? {};
  const customer = payload?.customer ?? {};

  if (!product?.name || !customer?.email) {
    return Response.json({ error: 'missing_fields' }, { status: 400 });
  }

  const result = await processWebhook('eduzz', rawBody, {
    workspaceSlug: wsSlug,
    courseName: product.name,
    student: {
      name: customer.name ?? customer.email,
      email: customer.email,
      cpf: customer.document,
      phone: customer.phone,
    },
    externalRef: payload?.trans_cod ?? payload?.id,
  });

  if (!result.ok) return Response.json({ error: result.error }, { status: result.status });
  return Response.json({ ok: true, request_id: result.requestId });
}
