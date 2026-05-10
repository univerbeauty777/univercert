// UniverCert · POST /api/v1/billing/checkout (S35)
// Cria Stripe Checkout Session ou Pagar.me link de pagamento.

import { requireRole, RbacError } from '@/lib/rbac';
import { getPlan, type PlanId } from '@/lib/plans';
import { createCheckoutSession } from '@/lib/stripe-client';

export const runtime = 'edge';

export async function POST(req: Request) {
  let sess;
  try {
    sess = await requireRole('admin');
  } catch (e) {
    if (e instanceof RbacError) return Response.json({ ok: false, error: e.code }, { status: e.code === 'UNAUTHENTICATED' ? 401 : 403 });
    throw e;
  }

  const body = await req.json().catch(() => ({})) as {
    plan?: PlanId;
    cycle?: 'monthly' | 'yearly';
    provider?: 'stripe' | 'pagarme';
    trialDays?: number;
  };

  if (!body.plan || body.plan === 'free') {
    return Response.json({ ok: false, error: 'plan invalido (use starter/pro/enterprise)' }, { status: 400 });
  }
  if (body.plan === 'enterprise') {
    return Response.json({ ok: false, error: 'enterprise eh custom — fala com vendas em contato@univercert.net' }, { status: 400 });
  }

  const plan = getPlan(body.plan);
  const cycle = body.cycle ?? 'monthly';
  const provider = body.provider ?? 'stripe';
  const baseUrl = new URL(req.url).origin;

  if (provider === 'stripe') {
    const priceId = cycle === 'yearly' ? plan.stripePriceIdYearly : plan.stripePriceIdMonthly;
    if (!priceId) {
      return Response.json({ ok: false, error: 'Stripe price_id nao configurado pra esse plano. Configure STRIPE_PRICE_*  vars no Cloudflare Pages env.' }, { status: 501 });
    }
    try {
      const session = await createCheckoutSession({
        workspaceId: sess.workspace.id,
        customerEmail: sess.user.email,
        priceId,
        successUrl: `${baseUrl}/billing?session=success`,
        cancelUrl: `${baseUrl}/billing?session=canceled`,
        trialDays: body.trialDays ?? 14,
      });
      return Response.json({ ok: true, provider: 'stripe', checkoutUrl: session.url, sessionId: session.id });
    } catch (e) {
      return Response.json({ ok: false, error: (e as Error).message }, { status: 500 });
    }
  }

  if (provider === 'pagarme') {
    // Pagar.me v5 API requer setup similar — stub honesto
    return Response.json({
      ok: false,
      error: 'pagarme_not_wired_yet',
      message: 'Configure PAGARME_API_KEY + plan IDs nas env vars. Pagar.me v5 checkout link sera implementado quando creds plugadas.',
      setup_url: 'https://docs.pagar.me/reference',
    }, { status: 501 });
  }

  return Response.json({ ok: false, error: 'provider invalido' }, { status: 400 });
}
