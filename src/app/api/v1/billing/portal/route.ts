// UniverCert · POST /api/v1/billing/portal (S35)
// Cria Stripe Customer Portal session pra gerenciar plano/cartao/invoices.

import { eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { subscriptions } from '@/db/schema';
import { requireRole, RbacError } from '@/lib/rbac';
import { createPortalSession } from '@/lib/stripe-client';

export const runtime = 'edge';

export async function POST(req: Request) {
  let sess;
  try {
    sess = await requireRole('admin');
  } catch (e) {
    if (e instanceof RbacError) return Response.json({ ok: false, error: e.code }, { status: 401 });
    throw e;
  }

  const db = getDb();
  const [sub] = await db.select().from(subscriptions).where(eq(subscriptions.workspaceId, sess.workspace.id)).limit(1);
  if (!sub?.providerCustomerId || sub.provider !== 'stripe') {
    return Response.json({ ok: false, error: 'sem subscription Stripe ativa pra esse workspace' }, { status: 400 });
  }

  const baseUrl = new URL(req.url).origin;
  try {
    const session = await createPortalSession(sub.providerCustomerId, `${baseUrl}/billing`);
    return Response.json({ ok: true, url: session.url });
  } catch (e) {
    return Response.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}
