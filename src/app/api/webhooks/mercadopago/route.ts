// UniverCert · webhook Mercado Pago
// Doc: https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks
//
// MP envia POST com body { type: "payment", data: { id: "<payment_id>" } }
// Header: x-signature: ts=<timestamp>,v1=<hash>
//         x-request-id: <uuid>

import { sql } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { fetchPayment, verifyWebhookSignature } from '@/lib/mercadopago';
import { getRequestContext } from '@cloudflare/next-on-pages';

export const runtime = 'edge';

export async function POST(request: Request) {
  const url = new URL(request.url);
  const rawBody = await request.text();
  const sigHeader = request.headers.get('x-signature') ?? '';
  const requestId = request.headers.get('x-request-id') ?? '';

  const { env } = getRequestContext();
  // @ts-expect-error
  const secret = env.MERCADOPAGO_WEBHOOK_SECRET as string | undefined;

  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return Response.json({ error: 'invalid_json' }, { status: 400 });
  }

  // MP só nos manda o ID — buscamos o payment completo via API
  const dataId = payload?.data?.id ?? url.searchParams.get('data.id');

  // Validação de assinatura (se secret configurado)
  if (secret) {
    const valid = await verifyWebhookSignature(rawBody, sigHeader, requestId, String(dataId ?? ''), secret);
    if (!valid) return Response.json({ error: 'invalid_signature' }, { status: 401 });
  }

  if (!dataId) return Response.json({ ok: true, ignored: 'no_data_id' });

  // Só processamos eventos de payment
  if (payload?.type !== 'payment' && payload?.action !== 'payment.created' && payload?.action !== 'payment.updated') {
    return Response.json({ ok: true, ignored: payload?.type });
  }

  // Busca payment completo na API do MP
  let mpPayment;
  try {
    mpPayment = await fetchPayment(String(dataId));
  } catch (e) {
    console.error('mp fetch failed:', e);
    return Response.json({ error: 'mp_fetch_failed' }, { status: 502 });
  }

  const externalRef = mpPayment.external_reference;
  if (!externalRef) {
    return Response.json({ ok: true, ignored: 'no_external_ref' });
  }

  const db = getDb();

  // Atualiza payment local
  await db.run(
    sql`UPDATE payments
        SET status = ${mpPayment.status},
            external_id = ${String(mpPayment.id)},
            payment_method = ${mpPayment.payment_method_id},
            installments = ${mpPayment.installments},
            paid_at = ${mpPayment.date_approved ? Math.floor(new Date(mpPayment.date_approved).getTime() / 1000) : null},
            raw_payload_json = ${JSON.stringify(mpPayment)},
            updated_at = unixepoch()
        WHERE id = ${externalRef}`,
  );

  // Se aprovado, upgrade workspace plan
  if (mpPayment.status === 'approved') {
    const meta = mpPayment.metadata ?? {};
    const workspaceId = (meta as any).workspace_id;
    const plan = (meta as any).plan;

    if (workspaceId && plan) {
      await db.run(
        sql`UPDATE workspaces SET plan = ${plan}, updated_at = unixepoch() WHERE id = ${workspaceId}`,
      );
    }

    // TODO Sprint 5.1: emitir NF-e via NFE.io
  }

  return Response.json({ ok: true, status: mpPayment.status });
}

// Mercado Pago às vezes faz GET pra verificar URL — responde OK
export async function GET() {
  return Response.json({ ok: true, service: 'univercert mercadopago webhook' });
}
