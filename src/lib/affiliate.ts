// UniverCert · Affiliate helpers (S44 + S45)
// Cookie 'uc_ref' captura ?ref=CODE em qualquer landing → atribui ao signup.

import { cookies } from 'next/headers';
import { eq, sql } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { affiliates, referrals } from '@/db/schema';
import { ID } from '@/lib/ulid';

const COOKIE = 'uc_ref';
const TTL_DAYS = 60;

export async function setReferralCookie(code: string): Promise<void> {
  const c = await cookies();
  c.set(COOKIE, code, {
    httpOnly: false, secure: true, sameSite: 'lax',
    path: '/', maxAge: 60 * 60 * 24 * TTL_DAYS,
  });
}

export async function getReferralCookie(): Promise<string | null> {
  try {
    const c = await cookies();
    return c.get(COOKIE)?.value ?? null;
  } catch { return null; }
}

export async function clearReferralCookie(): Promise<void> {
  try { (await cookies()).delete(COOKIE); } catch {}
}

/** Chamado no signup (server action) — registra referral se houver cookie */
export async function attributeSignup(referredUserId: string): Promise<{ ok: boolean; referralId?: string }> {
  const code = await getReferralCookie();
  if (!code) return { ok: false };

  const db = getDb();
  const [aff] = await db.select().from(affiliates).where(eq(affiliates.code, code)).limit(1);
  if (!aff || aff.status !== 'active') return { ok: false };

  const refId = ID.referral();
  await db.insert(referrals).values({
    id: refId,
    affiliateId: aff.id,
    referredUserId,
    status: 'signup',
    source: 'cookie',
  });

  await db.update(affiliates).set({
    totalSignups: sql`${affiliates.totalSignups} + 1`,
  }).where(eq(affiliates.id, aff.id)).catch(() => {});

  await clearReferralCookie();
  return { ok: true, referralId: refId };
}

/** Chamado no Stripe webhook invoice.paid — credita comissao */
export async function creditConversion(referredUserId: string, amountBrlCents: number): Promise<void> {
  const db = getDb();
  // Busca referral aberto pra esse user
  const rows = await db.select().from(referrals).where(eq(referrals.referredUserId, referredUserId)).limit(1);
  const ref = rows[0];
  if (!ref) return;

  const [aff] = await db.select().from(affiliates).where(eq(affiliates.id, ref.affiliateId)).limit(1);
  if (!aff) return;

  const commission = Math.floor((amountBrlCents * aff.commissionPct) / 100);

  await db.update(referrals).set({
    status: 'paying',
    firstPaymentAt: ref.firstPaymentAt ?? Math.floor(Date.now() / 1000),
    totalPaidByReferredBrlCents: sql`${referrals.totalPaidByReferredBrlCents} + ${amountBrlCents}`,
    commissionEarnedBrlCents: sql`${referrals.commissionEarnedBrlCents} + ${commission}`,
  }).where(eq(referrals.id, ref.id));

  await db.update(affiliates).set({
    totalPayingReferred: ref.firstPaymentAt ? affiliates.totalPayingReferred : sql`${affiliates.totalPayingReferred} + 1`,
    totalCommissionBrlCents: sql`${affiliates.totalCommissionBrlCents} + ${commission}`,
  } as any).where(eq(affiliates.id, aff.id));
}

/** Cria affiliate pro workspace (1 por ws) */
export async function createAffiliate(args: { workspaceId: string; code: string; tier?: 'standard' | 'educator' | 'vip'; commissionPct?: number }) {
  const tier = args.tier ?? 'standard';
  const pct = args.commissionPct ?? (tier === 'educator' ? 20 : tier === 'vip' ? 30 : 10);
  const db = getDb();
  const id = ID.affiliate();
  await db.insert(affiliates).values({
    id, workspaceId: args.workspaceId,
    code: args.code.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 30),
    tier, commissionPct: pct, status: 'active',
  });
  return { id, code: args.code, tier, commissionPct: pct };
}
