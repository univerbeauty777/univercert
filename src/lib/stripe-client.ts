// UniverCert · Stripe API client (S35) — fetch-based, edge-compatible
// Sem SDK official porque @stripe/stripe-node usa Node primitives.

import { getRequestContext } from '@cloudflare/next-on-pages';

function getKey(): string {
  const { env } = getRequestContext();
  const key = (env as any).STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY nao configurada');
  return key;
}

export async function stripeFetch<T = any>(path: string, init: RequestInit = {}): Promise<T> {
  const key = getKey();
  const r = await fetch(`https://api.stripe.com/v1${path}`, {
    ...init,
    headers: {
      'authorization': `Bearer ${key}`,
      'content-type': 'application/x-www-form-urlencoded',
      ...init.headers,
    },
  });
  if (!r.ok) {
    const errText = await r.text();
    throw new Error(`Stripe API ${r.status}: ${errText.slice(0, 500)}`);
  }
  return await r.json() as T;
}

/** form-urlencoded body builder (Stripe nao aceita JSON no v1) */
export function form(obj: Record<string, any>): string {
  const parts: string[] = [];
  for (const [k, v] of Object.entries(obj)) {
    if (v == null) continue;
    if (typeof v === 'object') {
      // suporta nested { metadata: { workspace_id: 'x' } } -> 'metadata[workspace_id]=x'
      for (const [k2, v2] of Object.entries(v)) {
        parts.push(`${encodeURIComponent(`${k}[${k2}]`)}=${encodeURIComponent(String(v2))}`);
      }
    } else {
      parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
    }
  }
  return parts.join('&');
}

/** Cria Checkout Session pra plan signup */
export async function createCheckoutSession(args: {
  workspaceId: string;
  customerEmail: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  trialDays?: number;
}) {
  return stripeFetch<{ id: string; url: string }>('/checkout/sessions', {
    method: 'POST',
    body: form({
      mode: 'subscription',
      'line_items[0][price]': args.priceId,
      'line_items[0][quantity]': 1,
      success_url: args.successUrl,
      cancel_url: args.cancelUrl,
      customer_email: args.customerEmail,
      'metadata[workspace_id]': args.workspaceId,
      'subscription_data[metadata][workspace_id]': args.workspaceId,
      ...(args.trialDays ? { 'subscription_data[trial_period_days]': args.trialDays } : {}),
      allow_promotion_codes: 'true',
    }),
  });
}

/** Cria Customer Portal session (gerenciar plano, cartao, invoices) */
export async function createPortalSession(customerId: string, returnUrl: string) {
  return stripeFetch<{ url: string }>('/billing_portal/sessions', {
    method: 'POST',
    body: form({ customer: customerId, return_url: returnUrl }),
  });
}

/** Verifica HMAC SHA-256 do webhook (Stripe-Signature header) */
export async function verifyStripeSignature(payload: string, sigHeader: string, secret: string, toleranceSec = 300): Promise<boolean> {
  try {
    const parts = Object.fromEntries(
      sigHeader.split(',').map((p) => {
        const [k, v] = p.split('=');
        return [k, v];
      }),
    );
    const t = parts.t;
    const v1 = parts.v1;
    if (!t || !v1) return false;

    const tsNum = parseInt(t, 10);
    if (Math.abs(Math.floor(Date.now() / 1000) - tsNum) > toleranceSec) return false;

    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const sigBuf = await crypto.subtle.sign('HMAC', key, enc.encode(`${t}.${payload}`));
    const computed = Array.from(new Uint8Array(sigBuf)).map((b) => b.toString(16).padStart(2, '0')).join('');
    return timingSafeEqual(computed, v1);
  } catch {
    return false;
  }
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}
