// UniverCert · GET /api/v1/embed/badge/[ws]?variant=badge|counter|featured (S46)
// Retorna SVG embedavel pra escola colar no site.

import { eq, and, count } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { workspaces, workspaceBrand, credentials, embedViews } from '@/db/schema';
import { ID } from '@/lib/ulid';
import { hashIp } from '@/lib/share-urls';
import { getClientIp } from '@/lib/rate-limit';

export const runtime = 'edge';

export async function GET(req: Request, ctx: { params: Promise<{ ws: string }> }) {
  const { ws } = await ctx.params;
  const url = new URL(req.url);
  const variant = url.searchParams.get('variant') ?? 'badge';

  const db = getDb();
  const [workspace] = await db.select().from(workspaces).where(eq(workspaces.slug, ws)).limit(1);
  if (!workspace) {
    return new Response('not_found', { status: 404 });
  }
  const [brand] = await db.select().from(workspaceBrand).where(eq(workspaceBrand.workspaceId, workspace.id)).limit(1);
  const [certCount] = await db.select({ value: count() }).from(credentials)
    .where(and(eq(credentials.workspaceId, workspace.id), eq(credentials.status, 'issued')));

  const name = brand?.displayName ?? workspace.name;
  const accent = brand?.brandColor ?? '#1B2D5E';
  const total = certCount?.value ?? 0;

  // Track impression (fire and forget)
  const referer = req.headers.get('referer');
  const refererDomain = referer ? new URL(referer).host : null;
  const ip = getClientIp(req);
  const ipH = ip ? await hashIp(ip).catch(() => null) : null;
  db.insert(embedViews).values({
    id: ID.embedView(),
    workspaceId: workspace.id,
    variant,
    refererDomain,
    userAgent: req.headers.get('user-agent')?.slice(0, 200) ?? null,
    ipHash: ipH,
  }).catch(() => {});

  const baseUrl = new URL(req.url).origin;
  const issuerUrl = `${baseUrl}/escola/${workspace.slug}`;

  let svg = '';
  if (variant === 'counter') {
    svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="60" viewBox="0 0 200 60">
  <a href="${issuerUrl}" target="_blank">
    <rect width="200" height="60" rx="10" fill="${accent}"/>
    <text x="100" y="24" text-anchor="middle" fill="#fff" font-family="system-ui,-apple-system,sans-serif" font-size="11" font-weight="600" opacity="0.85">Certificados emitidos</text>
    <text x="100" y="46" text-anchor="middle" fill="#fff" font-family="system-ui,-apple-system,sans-serif" font-size="20" font-weight="800">${total.toLocaleString('pt-BR')}</text>
  </a>
</svg>`;
  } else if (variant === 'featured') {
    svg = `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="80" viewBox="0 0 240 80">
  <a href="${issuerUrl}" target="_blank">
    <rect width="240" height="80" rx="12" fill="#fff" stroke="${accent}" stroke-width="2"/>
    <circle cx="40" cy="40" r="20" fill="${accent}"/>
    <path d="M32 40 l5 5 l11 -11" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/>
    <text x="76" y="34" fill="#0f172a" font-family="system-ui,-apple-system,sans-serif" font-size="13" font-weight="700">${escapeXml(name)}</text>
    <text x="76" y="52" fill="#64748b" font-family="system-ui,-apple-system,sans-serif" font-size="10">Verificado por UniverCert</text>
  </a>
</svg>`;
  } else {
    // default: 'badge'
    svg = `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="36" viewBox="0 0 180 36">
  <a href="${issuerUrl}" target="_blank">
    <rect width="180" height="36" rx="8" fill="#0f172a"/>
    <text x="12" y="23" fill="#D4A937" font-family="system-ui,-apple-system,sans-serif" font-size="12" font-weight="700">univer</text>
    <text x="58" y="23" fill="#fff" font-family="system-ui,-apple-system,sans-serif" font-size="12" font-weight="700">CERT</text>
    <line x1="100" y1="8" x2="100" y2="28" stroke="rgba(255,255,255,0.2)"/>
    <text x="108" y="22" fill="#fff" font-family="system-ui,-apple-system,sans-serif" font-size="10" font-weight="500">verificado ✓</text>
  </a>
</svg>`;
  }

  return new Response(svg, {
    headers: {
      'content-type': 'image/svg+xml; charset=utf-8',
      'cache-control': 'public, max-age=3600',
      'access-control-allow-origin': '*',
    },
  });
}

function escapeXml(s: string): string {
  return s.replace(/[<>&"']/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' }[c]!));
}
