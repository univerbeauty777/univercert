'use server';

import { eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { workspaces, workspaceMembers, users } from '@/db/schema';
import { sql } from 'drizzle-orm';
import { ID } from '@/lib/ulid';
import { createCheckoutPreference, PLAN_DETAILS, type Plan } from '@/lib/mercadopago';

export async function startCheckoutAction(args: { plan: Plan; workspaceId: string }) {
  try {
    const db = getDb();
    const [ws] = await db.select().from(workspaces).where(eq(workspaces.id, args.workspaceId)).limit(1);
    if (!ws) return { ok: false as const, error: 'workspace_not_found' };

    // Pega email do primeiro admin do workspace (ou fallback)
    const admins = await db
      .select({ email: users.email })
      .from(workspaceMembers)
      .innerJoin(users, eq(workspaceMembers.userId, users.id))
      .where(eq(workspaceMembers.workspaceId, args.workspaceId))
      .limit(1);

    const payerEmail = admins[0]?.email ?? 'admin@example.com';

    // Cria registro de payment pending
    const paymentId = `pay_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const detail = PLAN_DETAILS[args.plan];

    await db.run(
      sql`INSERT INTO payments (id, workspace_id, provider, plan, amount_cents, status, created_at)
          VALUES (${paymentId}, ${args.workspaceId}, 'mercadopago', ${args.plan}, ${detail.amountCents}, 'pending', unixepoch())`,
    );

    // Cria preference no MP
    const baseUrl = process.env.APP_URL || 'https://univercert.pages.dev';
    const pref = await createCheckoutPreference({
      plan: args.plan,
      payerEmail,
      workspaceId: args.workspaceId,
      externalReference: paymentId,
      baseUrl,
    });

    // Atualiza payment com preference_id
    await db.run(
      sql`UPDATE payments SET preference_id = ${pref.id} WHERE id = ${paymentId}`,
    );

    return {
      ok: true as const,
      initPoint: pref.init_point,
      preferenceId: pref.id,
      externalReference: paymentId,
    };
  } catch (e) {
    console.error('startCheckoutAction error:', e);
    return { ok: false as const, error: (e as Error).message };
  }
}
