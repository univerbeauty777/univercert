// UniverCert · Plan limits enforcement (S36)

import { eq, and, sql } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { subscriptions, usageMeters } from '@/db/schema';
import { getPlan, currentPeriodYM, type PlanId } from '@/lib/plans';

export type LimitCheck =
  | { ok: true; usage: number; limit: number; plan: PlanId; pctUsed: number }
  | { ok: false; reason: 'limit_reached' | 'soft_warning'; usage: number; limit: number; plan: PlanId; pctUsed: number; message: string };

/** Pega plano ativo do workspace (ou 'free' se nao tem subscription) */
export async function getWorkspacePlan(workspaceId: string): Promise<PlanId> {
  try {
    const db = getDb();
    const [sub] = await db.select().from(subscriptions).where(eq(subscriptions.workspaceId, workspaceId)).limit(1);
    if (!sub) return 'free';
    if (sub.status === 'active' || sub.status === 'trialing') return (sub.plan as PlanId) ?? 'free';
    return 'free';
  } catch {
    return 'free';
  }
}

/** Pega usage current period */
export async function getCurrentUsage(workspaceId: string) {
  const db = getDb();
  const ym = currentPeriodYM();
  const [meter] = await db.select().from(usageMeters)
    .where(and(eq(usageMeters.workspaceId, workspaceId), eq(usageMeters.periodYm, ym)))
    .limit(1);
  return meter ?? { workspaceId, periodYm: ym, certsEmitted: 0, aiJobsCount: 0, aiCostBrlCents: 0, storageBytes: 0, updatedAt: 0 };
}

/** Incrementa contador (atomic upsert) */
export async function incrementUsage(workspaceId: string, field: 'certsEmitted' | 'aiJobsCount', delta: number = 1, costBrlCents: number = 0) {
  const db = getDb();
  const ym = currentPeriodYM();
  // Upsert via INSERT ... ON CONFLICT
  await db.run(sql`
    INSERT INTO usage_meters (workspace_id, period_ym, ${sql.raw(field === 'certsEmitted' ? 'certs_emitted' : 'ai_jobs_count')}, ai_cost_brl_cents, updated_at)
    VALUES (${workspaceId}, ${ym}, ${delta}, ${costBrlCents}, unixepoch())
    ON CONFLICT(workspace_id, period_ym) DO UPDATE SET
      ${sql.raw(field === 'certsEmitted' ? 'certs_emitted = certs_emitted + ' + delta : 'ai_jobs_count = ai_jobs_count + ' + delta)},
      ai_cost_brl_cents = ai_cost_brl_cents + ${costBrlCents},
      updated_at = unixepoch();
  `).catch(() => {});
}

/** Check antes de emitir cert. Retorna ok:false se hit hard limit. */
export async function checkCertLimit(workspaceId: string): Promise<LimitCheck> {
  const planId = await getWorkspacePlan(workspaceId);
  const plan = getPlan(planId);
  const limit = plan.limits.certsPerMonth;
  const usage = (await getCurrentUsage(workspaceId)).certsEmitted;

  if (limit === -1) return { ok: true, usage, limit: -1, plan: planId, pctUsed: 0 };

  const pctUsed = Math.round((usage / limit) * 100);

  if (usage >= limit) {
    return {
      ok: false, reason: 'limit_reached', usage, limit, plan: planId, pctUsed,
      message: `Limite de ${limit} certificados/mês do plano ${plan.name} atingido. Upgrade pra continuar emitindo.`,
    };
  }
  if (pctUsed >= 80) {
    // Soft warning — nao bloqueia mas avisa
    return {
      ok: true, usage, limit, plan: planId, pctUsed,
      // @ts-expect-error - soft return ok:true mas com warning info
      warning: `${pctUsed}% do limite usado. Considere upgrade.`,
    } as any;
  }
  return { ok: true, usage, limit, plan: planId, pctUsed };
}

/** Check antes de chamar AI. Mais flexivel — soft block pra free, hard pra resto. */
export async function checkAiLimit(workspaceId: string): Promise<LimitCheck> {
  const planId = await getWorkspacePlan(workspaceId);
  const plan = getPlan(planId);
  const limit = plan.limits.aiJobsPerMonth;
  const usage = (await getCurrentUsage(workspaceId)).aiJobsCount;

  if (limit === -1) return { ok: true, usage, limit: -1, plan: planId, pctUsed: 0 };

  const pctUsed = Math.round((usage / limit) * 100);

  if (usage >= limit) {
    return {
      ok: false, reason: 'limit_reached', usage, limit, plan: planId, pctUsed,
      message: `Limite de ${limit} requisições AI/mês do plano ${plan.name} atingido. Upgrade pro plano Pro pra ter 500 AI calls/mês.`,
    };
  }
  return { ok: true, usage, limit, plan: planId, pctUsed };
}

/** Verifica se feature esta habilitada no plano */
export async function hasFeature(workspaceId: string, feature: keyof ReturnType<typeof getPlan>['limits']): Promise<boolean> {
  const planId = await getWorkspacePlan(workspaceId);
  const plan = getPlan(planId);
  const v = (plan.limits as any)[feature];
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v === -1 || v > 0;
  return false;
}
