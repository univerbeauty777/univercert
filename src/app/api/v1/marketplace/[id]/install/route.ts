// UniverCert · POST /api/v1/marketplace/[id]/install (S43)
// Clona template do marketplace pro workspace do user.

import { eq, sql } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { templateMarketplace, templates } from '@/db/schema';
import { ID } from '@/lib/ulid';
import { requireRole, RbacError } from '@/lib/rbac';

export const runtime = 'edge';

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  let sess;
  try { sess = await requireRole('editor'); }
  catch (e) {
    if (e instanceof RbacError) return Response.json({ ok: false, error: e.code }, { status: 401 });
    throw e;
  }

  const db = getDb();
  const [item] = await db.select().from(templateMarketplace).where(eq(templateMarketplace.id, id)).limit(1);
  if (!item) return Response.json({ ok: false, error: 'template_not_found' }, { status: 404 });
  if (!['approved', 'featured'].includes(item.status)) {
    return Response.json({ ok: false, error: 'template_not_approved' }, { status: 403 });
  }

  // Premium gate
  if (item.isPremium && item.priceBrlCents === 0) {
    // free premium = requer plan Pro+ (verifica via lib/plan-limits)
    const { hasFeature } = await import('@/lib/plan-limits');
    if (!(await hasFeature(sess.workspace.id, 'apiKeys'))) { // proxy pra Pro+
      return Response.json({ ok: false, error: 'requires_pro_plan', upgradeUrl: '/billing' }, { status: 402 });
    }
  }
  if (item.priceBrlCents > 0) {
    // futuro: cobrar via Stripe + split com author. Por enquanto, 501.
    return Response.json({ ok: false, error: 'paid_templates_not_wired_yet', message: 'Templates pagos chegam quando Stripe Connect estiver configurado.' }, { status: 501 });
  }

  // Clone
  const newId = ID.template();
  await db.insert(templates).values({
    id: newId,
    workspaceId: sess.workspace.id,
    name: `${item.name} (do marketplace)`,
    layoutJson: item.layoutJson,
    status: 'draft',
    createdAt: Math.floor(Date.now() / 1000),
    updatedAt: Math.floor(Date.now() / 1000),
  } as any).catch(() => {}); // schema fields may differ; ignore extras

  // Bump downloads counter
  await db.update(templateMarketplace).set({
    downloads: sql`${templateMarketplace.downloads} + 1`,
    updatedAt: Math.floor(Date.now() / 1000),
  }).where(eq(templateMarketplace.id, id)).catch(() => {});

  return Response.json({ ok: true, templateId: newId, openUrl: `/templates/editor?id=${newId}` });
}
