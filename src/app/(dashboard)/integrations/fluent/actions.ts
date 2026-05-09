'use server';

// UniverCert · Fluent integration server actions

import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { getDb } from '@/db/client';
import { integrations } from '@/db/schema';
import { ID } from '@/lib/ulid';
import { requireRole, RbacError } from '@/lib/rbac';

type FluentConfig = {
  auto_approve: boolean;
  send_email: boolean;
  default_template: string;
  course_template_map: Record<string, string>;
};

const DEFAULT_CFG: FluentConfig = {
  auto_approve: true,
  send_email: true,
  default_template: 'classic',
  course_template_map: {},
};

export async function getFluentConfig(): Promise<{ ok: boolean; config?: FluentConfig; secret?: string | null; error?: string }> {
  try {
    const sess = await requireRole('editor');
    const db = getDb();
    const [integ] = await db
      .select()
      .from(integrations)
      .where(and(eq(integrations.workspaceId, sess.workspace.id), eq(integrations.provider, 'fluent')))
      .limit(1);
    let cfg = DEFAULT_CFG;
    if (integ?.configJson) {
      try {
        const parsed = JSON.parse(integ.configJson);
        cfg = { ...DEFAULT_CFG, ...parsed };
      } catch {}
    }
    return { ok: true, config: cfg, secret: integ?.webhookSecret ?? null };
  } catch (e) {
    if (e instanceof RbacError) return { ok: false, error: 'sem permissao (editor+)' };
    return { ok: false, error: (e as Error).message };
  }
}

export async function saveFluentConfigAction(input: Partial<FluentConfig>) {
  try {
    const sess = await requireRole('editor');
    const db = getDb();
    const [existing] = await db
      .select()
      .from(integrations)
      .where(and(eq(integrations.workspaceId, sess.workspace.id), eq(integrations.provider, 'fluent')))
      .limit(1);

    const current = existing?.configJson ? safeParse(existing.configJson) : {};
    const merged = { ...DEFAULT_CFG, ...current, ...input };

    if (existing) {
      await db
        .update(integrations)
        .set({ configJson: JSON.stringify(merged), isActive: 1 })
        .where(eq(integrations.id, existing.id));
    } else {
      await db.insert(integrations).values({
        id: ID.integration(),
        workspaceId: sess.workspace.id,
        provider: 'fluent',
        configJson: JSON.stringify(merged),
        isActive: 1,
      });
    }
    revalidatePath('/integrations/fluent');
    return { ok: true as const, config: merged };
  } catch (e) {
    if (e instanceof RbacError) return { ok: false as const, error: 'sem permissao (editor+)' };
    return { ok: false as const, error: (e as Error).message };
  }
}

export async function generateFluentSecretAction() {
  try {
    const sess = await requireRole('admin');
    const db = getDb();

    const buf = new Uint8Array(32);
    crypto.getRandomValues(buf);
    const secret = Array.from(buf)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    const [existing] = await db
      .select()
      .from(integrations)
      .where(and(eq(integrations.workspaceId, sess.workspace.id), eq(integrations.provider, 'fluent')))
      .limit(1);

    if (existing) {
      await db.update(integrations).set({ webhookSecret: secret, isActive: 1 }).where(eq(integrations.id, existing.id));
    } else {
      await db.insert(integrations).values({
        id: ID.integration(),
        workspaceId: sess.workspace.id,
        provider: 'fluent',
        configJson: JSON.stringify(DEFAULT_CFG),
        webhookSecret: secret,
        isActive: 1,
      });
    }
    revalidatePath('/integrations/fluent');
    return { ok: true as const, secret };
  } catch (e) {
    if (e instanceof RbacError) return { ok: false as const, error: 'sem permissao (admin)' };
    return { ok: false as const, error: (e as Error).message };
  }
}

function safeParse(j: string): Partial<FluentConfig> {
  try { return JSON.parse(j); } catch { return {}; }
}
