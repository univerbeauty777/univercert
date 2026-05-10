// UniverCert · GET /api/v1/billing/usage (S36)
// Retorna plano + uso atual + limites + próximas invoices

import { eq, desc } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { subscriptions, invoices } from '@/db/schema';
import { requireRole, RbacError } from '@/lib/rbac';
import { getPlan } from '@/lib/plans';
import { getCurrentUsage, getWorkspacePlan } from '@/lib/plan-limits';

export const runtime = 'edge';

export async function GET(_req: Request) {
  let sess;
  try {
    sess = await requireRole('viewer');
  } catch (e) {
    if (e instanceof RbacError) return Response.json({ ok: false, error: e.code }, { status: 401 });
    throw e;
  }
  const db = getDb();

  const [sub, planId, usage, recentInvoices] = await Promise.all([
    db.select().from(subscriptions).where(eq(subscriptions.workspaceId, sess.workspace.id)).limit(1).then((r) => r[0]),
    getWorkspacePlan(sess.workspace.id),
    getCurrentUsage(sess.workspace.id),
    db.select().from(invoices).where(eq(invoices.workspaceId, sess.workspace.id)).orderBy(desc(invoices.createdAt)).limit(12),
  ]);

  const plan = getPlan(planId);

  return Response.json({
    ok: true,
    plan: {
      id: plan.id, name: plan.name, monthlyBrlCents: plan.monthlyBrlCents,
      yearlyBrlCents: plan.yearlyBrlCents, limits: plan.limits, features: plan.features,
    },
    subscription: sub ? {
      status: sub.status, provider: sub.provider,
      currentPeriodStart: sub.currentPeriodStart, currentPeriodEnd: sub.currentPeriodEnd,
      cancelAtPeriodEnd: !!sub.cancelAtPeriodEnd, trialEndsAt: sub.trialEndsAt,
    } : null,
    usage: {
      periodYm: usage.periodYm,
      certsEmitted: usage.certsEmitted,
      aiJobsCount: usage.aiJobsCount,
      aiCostBrlCents: usage.aiCostBrlCents,
      pctCertsUsed: plan.limits.certsPerMonth === -1 ? 0 : Math.round((usage.certsEmitted / plan.limits.certsPerMonth) * 100),
      pctAiUsed: plan.limits.aiJobsPerMonth === -1 ? 0 : Math.round((usage.aiJobsCount / plan.limits.aiJobsPerMonth) * 100),
    },
    invoices: recentInvoices.map((i) => ({
      id: i.id, status: i.status, amountBrlCents: i.amountBrlCents, currency: i.currency,
      description: i.description, invoicePdfUrl: i.invoicePdfUrl, paidAt: i.paidAt, dueAt: i.dueAt,
      createdAt: i.createdAt,
    })),
  });
}
