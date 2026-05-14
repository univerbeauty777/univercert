'use server';

// UniverCert · Templates · server actions

import { eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { brandKits, auditLogs } from '@/db/schema';
import { ID } from '@/lib/ulid';
import { requireRole, RbacError } from '@/lib/rbac';

const HEX_RE = /^#[0-9A-Fa-f]{6}$/;
const VALID_VARIANTS = ['classic', 'modern', 'gold', 'minimal', 'executive', 'creative'];

type SaveArgs = {
  primaryColor: string;
  secondaryColor: string;
  activeTemplate?: string;
};

export async function saveBrandKitAction(
  args: SaveArgs,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!HEX_RE.test(args.primaryColor) || !HEX_RE.test(args.secondaryColor)) {
    return { ok: false, error: 'Cores devem ser hex válido (#RRGGBB)' };
  }
  if (args.activeTemplate && !VALID_VARIANTS.includes(args.activeTemplate)) {
    return { ok: false, error: 'Template inválido' };
  }

  let sess;
  try {
    sess = await requireRole('admin');
  } catch (e) {
    if (e instanceof RbacError) return { ok: false, error: e.code };
    throw e;
  }
  const workspaceId = sess.workspace.id;
  const db = getDb();

  try {
    const [existing] = await db
      .select()
      .from(brandKits)
      .where(eq(brandKits.workspaceId, workspaceId))
      .limit(1);

    const now = Math.floor(Date.now() / 1000);

    if (existing) {
      await db
        .update(brandKits)
        .set({
          primaryColor: args.primaryColor,
          secondaryColor: args.secondaryColor,
          updatedAt: now,
        })
        .where(eq(brandKits.workspaceId, workspaceId));
    } else {
      await db.insert(brandKits).values({
        id: ID.brandKit(),
        workspaceId,
        primaryColor: args.primaryColor,
        secondaryColor: args.secondaryColor,
        updatedAt: now,
      });
    }

    try {
      await db.insert(auditLogs).values({
        id: ID.auditLog(),
        workspaceId,
        userId: sess.user.id,
        action: 'brand_kit.update',
        entityType: 'brand_kit',
        entityId: workspaceId,
        metadataJson: JSON.stringify({
          primaryColor: args.primaryColor,
          secondaryColor: args.secondaryColor,
          activeTemplate: args.activeTemplate,
        }),
      });
    } catch {
      // audit log falha não bloqueia
    }

    return { ok: true };
  } catch (e) {
    console.error('saveBrandKitAction', e);
    return { ok: false, error: (e as Error).message };
  }
}
