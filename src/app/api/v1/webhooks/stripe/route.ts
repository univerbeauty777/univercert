// UniverCert · POST /api/v1/webhooks/stripe (S35)
// Eventos: customer.subscription.created/updated/deleted, invoice.paid/finalized/payment_failed

import { eq } from 'drizzle-orm';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { getDb } from '@/db/client';
import { subscriptions, invoices } from '@/db/schema';
import { ID } from '@/lib/ulid';
import { verifyStripeSignature } from '@/lib/stripe-client';

export const runtime = 'edge';

export async function POST(req: Request) {
  const { env } = getRequestContext();
  const secret = (env as any).STRIPE_WEBHOOK_SECRET;
  if (!secret) return Response.json({ ok: false, error: 'STRIPE_WEBHOOK_SECRET nao configurado' }, { status: 501 });

  const payload = await req.text();
  const sigHeader = req.headers.get('stripe-signature') ?? '';
  const valid = await verifyStripeSignature(payload, sigHeader, secret);
  if (!valid) return Response.json({ ok: false, error: 'invalid_signature' }, { status: 400 });

  let event: any;
  try { event = JSON.parse(payload); } catch { return Response.json({ ok: false, error: 'invalid_json' }, { status: 400 }); }

  const db = getDb();
  const obj = event.data?.object ?? {};
  const wsId = obj.metadata?.workspace_id ?? obj.subscription_metadata?.workspace_id;

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const planFromPrice = (priceId: string): string => {
          if (!priceId) return 'free';
          if (priceId.includes('starter')) return 'starter';
          if (priceId.includes('pro')) return 'pro';
          if (priceId.includes('enterprise')) return 'enterprise';
          return 'starter';
        };
        const priceId = obj.items?.data?.[0]?.price?.id;
        const plan = planFromPrice(priceId);
        if (!wsId) break;

        const [existing] = await db.select().from(subscriptions).where(eq(subscriptions.workspaceId, wsId)).limit(1);
        const data = {
          plan,
          status: obj.status ?? 'active',
          provider: 'stripe',
          providerCustomerId: obj.customer,
          providerSubscriptionId: obj.id,
          currentPeriodStart: obj.current_period_start,
          currentPeriodEnd: obj.current_period_end,
          cancelAtPeriodEnd: obj.cancel_at_period_end ? 1 : 0,
          trialEndsAt: obj.trial_end ?? null,
          amountBrlCents: obj.items?.data?.[0]?.price?.unit_amount ?? null,
          updatedAt: Math.floor(Date.now() / 1000),
        };
        if (existing) {
          await db.update(subscriptions).set(data).where(eq(subscriptions.workspaceId, wsId));
        } else {
          await db.insert(subscriptions).values({ id: ID.subscription(), workspaceId: wsId, ...data });
        }
        break;
      }
      case 'customer.subscription.deleted': {
        if (!wsId) break;
        await db.update(subscriptions).set({ status: 'canceled', plan: 'free', updatedAt: Math.floor(Date.now() / 1000) })
          .where(eq(subscriptions.workspaceId, wsId));
        break;
      }
      case 'invoice.paid':
      case 'invoice.finalized':
      case 'invoice.payment_failed': {
        const status = event.type === 'invoice.paid' ? 'paid' : event.type === 'invoice.payment_failed' ? 'failed' : 'open';
        const invWsId = obj.subscription_details?.metadata?.workspace_id ?? wsId;
        if (!invWsId) break;
        await db.insert(invoices).values({
          id: ID.invoice(),
          workspaceId: invWsId,
          subscriptionId: obj.subscription ?? null,
          provider: 'stripe',
          providerInvoiceId: obj.id,
          status,
          amountBrlCents: obj.amount_paid ?? obj.amount_due ?? 0,
          currency: (obj.currency ?? 'brl').toUpperCase(),
          description: obj.description ?? `Invoice ${obj.number ?? obj.id}`,
          invoicePdfUrl: obj.invoice_pdf ?? obj.hosted_invoice_url ?? null,
          paidAt: obj.status_transitions?.paid_at ?? null,
          dueAt: obj.due_date ?? null,
        }).onConflictDoNothing().catch(() => {});
        break;
      }
      default:
        // ignora outros eventos por enquanto
        break;
    }
    return Response.json({ ok: true, type: event.type });
  } catch (e) {
    return Response.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}
