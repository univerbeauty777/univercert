// UniverCert · White-label helper (S60 + S62 + S63)
// Detecta se request veio via custom domain (cliente Pro/Enterprise) e aplica branding.

import { headers } from 'next/headers';
import { eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { workspaces, workspaceBrand } from '@/db/schema';
import { getWorkspacePlan } from '@/lib/plan-limits';
import { getPlan } from '@/lib/plans';

export type WhiteLabelContext = {
  isCustomDomain: boolean;       // true se host !== univercert.net
  hideUniverCertBrand: boolean;   // true se Pro+ + custom domain
  removeWatermark: boolean;       // true se Pro+ (independente de custom domain)
  workspaceSlug: string | null;
  workspaceName: string;
  brandColor: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  brand: any | null;             // workspace_brand row
};

const NATIVE_DOMAINS = ['univercert.net', 'www.univercert.net', 'univercert.pages.dev'];

/** Detecta white-label context baseado no host header + workspace */
export async function getWhiteLabelContext(workspaceId?: string | null): Promise<WhiteLabelContext> {
  let host: string | null = null;
  try {
    const h = await headers();
    host = h.get('host') ?? h.get('x-forwarded-host');
  } catch {}

  const isCustomDomain = !!host && !NATIVE_DOMAINS.some((d) => host === d || host.endsWith(`.${d}`) || host.endsWith('.pages.dev'));

  // Se nao tem workspaceId, retorna defaults UniverCert
  if (!workspaceId) {
    return {
      isCustomDomain, hideUniverCertBrand: false, removeWatermark: false,
      workspaceSlug: null, workspaceName: 'UniverCert',
      brandColor: '#1B2D5E', logoUrl: null, faviconUrl: null, brand: null,
    };
  }

  const db = getDb();
  const [ws] = await db.select().from(workspaces).where(eq(workspaces.id, workspaceId)).limit(1);
  const [brand] = await db.select().from(workspaceBrand).where(eq(workspaceBrand.workspaceId, workspaceId)).limit(1);
  const planId = await getWorkspacePlan(workspaceId);
  const plan = getPlan(planId);

  return {
    isCustomDomain,
    hideUniverCertBrand: isCustomDomain && plan.limits.removeWatermark,
    removeWatermark: plan.limits.removeWatermark,
    workspaceSlug: ws?.slug ?? null,
    workspaceName: brand?.displayName ?? ws?.name ?? 'UniverCert',
    brandColor: brand?.brandColor ?? '#1B2D5E',
    logoUrl: brand?.logoUrl ?? null,
    faviconUrl: brand?.logoUrl ?? null,
    brand: brand ?? null,
  };
}

/** Renderiza CSS variables customizadas pra injetar via <style> */
export function whiteLabelCss(ctx: WhiteLabelContext): string {
  return `:root { --brand-color: ${ctx.brandColor}; --brand-color-soft: ${ctx.brandColor}22; }`;
}

/** Footer string baseado em white-label */
export function whiteLabelFooter(ctx: WhiteLabelContext): string {
  if (ctx.hideUniverCertBrand) {
    return `Certificados de ${ctx.workspaceName}`;
  }
  return `Powered by UniverCert · Certificados verificáveis`;
}

/** Watermark string pro PDF (so aparece em planos free/starter) */
export function pdfWatermark(ctx: WhiteLabelContext): string | null {
  if (ctx.removeWatermark) return null;
  return 'univercert.net';
}
