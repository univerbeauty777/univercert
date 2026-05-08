// UniverCert · Mercado Pago wrapper REST (Sprint 5)
// Docs: https://www.mercadopago.com.br/developers/pt/reference
//
// Vars necessárias:
//   MERCADOPAGO_ACCESS_TOKEN  → Production access token (Bearer)
//   MERCADOPAGO_WEBHOOK_SECRET → secret pra validar header x-signature

import { getRequestContext } from '@cloudflare/next-on-pages';

const MP_API = 'https://api.mercadopago.com';

function getToken(): string {
  const { env } = getRequestContext();
  const t = (env as any).MERCADOPAGO_ACCESS_TOKEN as string | undefined;
  if (!t) throw new Error('MERCADOPAGO_ACCESS_TOKEN not configured');
  return t;
}

export type Plan = 'starter' | 'pro' | 'enterprise';

export const PLAN_DETAILS: Record<Plan, { title: string; amountCents: number; description: string }> = {
  starter: { title: 'UniverCert Starter', amountCents: 9700, description: 'Plano Starter · 500 certificados/mês' },
  pro: { title: 'UniverCert Pro', amountCents: 29700, description: 'Plano Pro · 5000 certificados/mês + domínio próprio' },
  enterprise: { title: 'UniverCert Enterprise', amountCents: 149700, description: 'Plano Enterprise · ilimitado + white-label' },
};

/**
 * Cria uma preference de Checkout Pro. Retorna init_point pra redirecionar.
 */
export async function createCheckoutPreference(args: {
  plan: Plan;
  payerEmail: string;
  workspaceId: string;
  externalReference: string;
  baseUrl: string;
}) {
  const detail = PLAN_DETAILS[args.plan];
  if (!detail) throw new Error(`invalid_plan:${args.plan}`);

  const body = {
    items: [
      {
        id: `plan_${args.plan}`,
        title: detail.title,
        description: detail.description,
        quantity: 1,
        currency_id: 'BRL',
        unit_price: detail.amountCents / 100,
      },
    ],
    payer: { email: args.payerEmail },
    payment_methods: {
      installments: 12,
    },
    back_urls: {
      success: `${args.baseUrl}/billing/sucesso?ref=${args.externalReference}`,
      pending: `${args.baseUrl}/billing/pendente?ref=${args.externalReference}`,
      failure: `${args.baseUrl}/billing/falha?ref=${args.externalReference}`,
    },
    auto_return: 'approved',
    external_reference: args.externalReference,
    notification_url: `${args.baseUrl}/api/webhooks/mercadopago`,
    statement_descriptor: 'UniverCert',
    metadata: { workspace_id: args.workspaceId, plan: args.plan },
  };

  const resp = await fetch(`${MP_API}/checkout/preferences`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getToken()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`mp_preference_failed:${resp.status}:${txt}`);
  }

  return (await resp.json()) as {
    id: string;
    init_point: string;
    sandbox_init_point: string;
    external_reference: string;
  };
}

/**
 * Busca um Payment pelo ID (usado quando webhook chega).
 */
export async function fetchPayment(paymentId: string) {
  const resp = await fetch(`${MP_API}/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!resp.ok) throw new Error(`mp_fetch_payment_${resp.status}`);
  return (await resp.json()) as MercadoPagoPayment;
}

export type MercadoPagoPayment = {
  id: number;
  status: 'pending' | 'approved' | 'authorized' | 'in_process' | 'in_mediation' | 'rejected' | 'cancelled' | 'refunded' | 'charged_back';
  status_detail: string;
  external_reference: string | null;
  transaction_amount: number;
  currency_id: string;
  payment_method_id: string;
  payment_type_id: string;
  installments: number;
  date_approved: string | null;
  date_created: string;
  payer: { email: string; identification?: { type: string; number: string } };
  metadata?: Record<string, unknown>;
};

/**
 * Valida assinatura do webhook MP.
 * https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks#bookmark_validar_origem_da_notificação
 */
export async function verifyWebhookSignature(
  rawBody: string,
  signatureHeader: string,
  requestId: string,
  dataId: string,
  secret: string,
): Promise<boolean> {
  if (!signatureHeader) return false;

  // Header format: "ts=<timestamp>,v1=<hash>"
  const parts = Object.fromEntries(
    signatureHeader.split(',').map((kv) => kv.trim().split('=').map((s) => s.trim())),
  );
  const ts = parts.ts;
  const v1 = parts.v1;
  if (!ts || !v1) return false;

  const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(manifest));
  const computed = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return timingSafeEqual(computed, v1);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}
