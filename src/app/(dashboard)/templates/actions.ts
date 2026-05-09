'use server';

// UniverCert · Templates · server actions

import { eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { brandKits, workspaces, auditLogs } from '@/db/schema';
import { ID } from '@/lib/ulid';

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
  // Validação defensiva (anti-XSS via cor)
  if (!HEX_RE.test(args.primaryColor) || !HEX_RE.test(args.secondaryColor)) {
    return { ok: false, error: 'Cores devem ser hex válido (#RRGGBB)' };
  }
  if (args.activeTemplate && !VALID_VARIANTS.includes(args.activeTemplate)) {
    return { ok: false, error: 'Template inválido' };
  }

  const db = getDb();
  const workspaceSlug = 'univerhair';

  try {
    const [ws] = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.slug, workspaceSlug))
      .limit(1);
    if (!ws) return { ok: false, error: 'Workspace não encontrado' };

    const [existing] = await db
      .select()
      .from(brandKits)
      .where(eq(brandKits.workspaceId, ws.id))
      .limit(1);

    const now = Math.floor(Date.now() / 1000);
    const metadata = JSON.stringify({ activeTemplate: args.activeTemplate ?? 'classic' });

    if (existing) {
      await db
        .update(brandKits)
        .set({
          primaryColor: args.primaryColor,
          secondaryColor: args.secondaryColor,
          updatedAt: now,
        })
        .where(eq(brandKits.workspaceId, ws.id));
    } else {
      await db.insert(brandKits).values({
        id: ID.brandKit(),
        workspaceId: ws.id,
        primaryColor: args.primaryColor,
        secondaryColor: args.secondaryColor,
        updatedAt: now,
      });
    }

    // Audit log
    try {
      await db.insert(auditLogs).values({
        id: ID.auditLog(),
        workspaceId: ws.id,
        action: 'brand_kit.update',
        entityType: 'brand_kit',
        entityId: ws.id,
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
