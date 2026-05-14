'use server';

import { revalidatePath } from 'next/cache';
import { eq, and } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { integrations } from '@/db/schema';
import { ID } from '@/lib/ulid';
import { requireRole, RbacError } from '@/lib/rbac';

type Provider = 'fluent' | 'hotmart' | 'memberkit' | 'kiwify' | 'eduzz' | 'hubla' | 'greenn' | 'wordpress' | 'zapier' | 'api';

export async function upsertIntegrationAction(args: { provider: Provider; isActive: boolean }) {
  let sess;
  try {
    sess = await requireRole('admin');
  } catch (e) {
    if (e instanceof RbacError) return { ok: false as const, error: e.code };
    throw e;
  }
  const workspaceId = sess.workspace.id;
  const db = getDb();
  const [existing] = await db
    .select()
    .from(integrations)
    .where(and(eq(integrations.workspaceId, workspaceId), eq(integrations.provider, args.provider)))
    .limit(1);

  if (existing) {
    await db
      .update(integrations)
      .set({ isActive: args.isActive ? 1 : 0 })
      .where(eq(integrations.id, existing.id));
  } else {
    await db.insert(integrations).values({
      id: ID.integration(),
      workspaceId,
      provider: args.provider,
      configJson: '{}',
      isActive: args.isActive ? 1 : 0,
    });
  }

  revalidatePath('/integrations');
  return { ok: true as const };
}

export async function generateSecretAction(provider: Provider) {
  let sess;
  try {
    sess = await requireRole('admin');
  } catch (e) {
    if (e instanceof RbacError) return { ok: false as const, error: e.code };
    throw e;
  }
  const workspaceId = sess.workspace.id;
  const db = getDb();

  const buf = new Uint8Array(32);
  crypto.getRandomValues(buf);
  const secret = Array.from(buf)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  const [existing] = await db
    .select()
    .from(integrations)
    .where(and(eq(integrations.workspaceId, workspaceId), eq(integrations.provider, provider)))
    .limit(1);

  if (existing) {
    await db
      .update(integrations)
      .set({ webhookSecret: secret, isActive: 1 })
      .where(eq(integrations.id, existing.id));
  } else {
    await db.insert(integrations).values({
      id: ID.integration(),
      workspaceId,
      provider,
      configJson: '{}',
      webhookSecret: secret,
      isActive: 1,
    });
  }

  revalidatePath('/integrations');
  return { ok: true as const, secret };
}
