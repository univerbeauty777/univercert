// UniverCert · webhook Hotmart
// Hotmart manda eventos: PURCHASE_APPROVED, PURCHASE_COMPLETE, PURCHASE_REFUNDED, etc.
// Para certificados, escutamos PURCHASE_APPROVED ou PURCHASE_COMPLETE.
// HMAC: Hotmart envia x-hotmart-hottok no header (token estático) — validamos isso ao invés de signature.
//
// URL: https://univercert.com.br/api/webhooks/hotmart?ws=univerhair

import { processWebhook, getWebhookSecret, resolveWorkspaceFromQuery } from '@/lib/webhook-handler';

export const runtime = 'edge';

const ACCEPTED_EVENTS = new Set([
  'PURCHASE_APPROVED',
  'PURCHASE_COMPLETE',
  'PURCHASE_BILLET_PRINTED',
]);

export async function POST(request: Request) {
  const url = new URL(request.url);
  const wsSlug = await resolveWorkspaceFromQuery(url.searchParams);
  if (!wsSlug) {
    return Response.json({ error: 'workspace_query_param_required (?ws=slug)' }, { status: 400 });
  }

  const rawBody = await request.text();
  const hottok = request.headers.get('x-hotmart-hottok') ?? '';

  // Hotmart usa um token estático. Comparamos com o webhookSecret da integration.
  const secret = await getWebhookSecret(wsSlug, 'hotmart');
  if (secret && hottok !== secret) {
    return Response.json({ error: 'invalid_hottok' }, { status: 401 });
  }

  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return Response.json({ error: 'invalid_json' }, { status: 400 });
  }

  const event = payload?.event;
  if (!ACCEPTED_EVENTS.has(event)) {
    return Response.json({ ok: true, ignored: event }); // 200 pra Hotmart não fazer retry
  }

  const data = payload?.data ?? payload;
  const product = data?.product ?? data?.purchase?.product;
  const buyer = data?.buyer ?? data?.purchase?.buyer;

  if (!product?.name || !buyer?.email) {
    return Response.json({ error: 'missing_fields', expected: ['data.product.name', 'data.buyer.email'] }, { status: 400 });
  }

  const result = await processWebhook('hotmart', rawBody, {
    workspaceSlug: wsSlug,
    courseName: product.name,
    courseHours: product?.workload ?? product?.hours,
    student: {
      name: buyer.name ?? buyer.email,
      email: buyer.email,
      cpf: buyer?.document ?? buyer?.cpf,
      phone: buyer?.phone ?? buyer?.checkout_phone,
    },
    externalRef: data?.purchase?.transaction ?? payload?.id,
  });

  if (!result.ok) {
    return Response.json({ error: result.error }, { status: result.status });
  }
  return Response.json({ ok: true, request_id: result.requestId });
}
