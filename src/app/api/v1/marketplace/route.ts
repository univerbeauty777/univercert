// UniverCert · GET /api/v1/marketplace?category=...&q=...&lang=pt (S43)

import { eq, and, desc, like, inArray } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { templateMarketplace } from '@/db/schema';

export const runtime = 'edge';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const category = url.searchParams.get('category');
  const q = url.searchParams.get('q')?.trim();
  const lang = url.searchParams.get('lang') ?? 'pt';
  const onlyApproved = inArray(templateMarketplace.status, ['approved', 'featured']);

  const db = getDb();
  const conds: any[] = [onlyApproved, eq(templateMarketplace.language, lang)];
  if (category && category !== 'all') conds.push(eq(templateMarketplace.category, category));
  if (q) conds.push(like(templateMarketplace.name, `%${q}%`));

  const rows = await db.select({
    id: templateMarketplace.id,
    name: templateMarketplace.name,
    description: templateMarketplace.description,
    category: templateMarketplace.category,
    language: templateMarketplace.language,
    previewUrl: templateMarketplace.previewUrl,
    downloads: templateMarketplace.downloads,
    ratingAvg: templateMarketplace.ratingAvg,
    ratingCount: templateMarketplace.ratingCount,
    status: templateMarketplace.status,
    isPremium: templateMarketplace.isPremium,
    priceBrlCents: templateMarketplace.priceBrlCents,
    createdAt: templateMarketplace.createdAt,
  })
    .from(templateMarketplace)
    .where(and(...conds))
    .orderBy(desc(templateMarketplace.status), desc(templateMarketplace.downloads))
    .limit(60);

  const categories = ['all', 'beauty', 'education', 'tech', 'sports', 'mba', 'general'];

  return Response.json({
    ok: true,
    items: rows.map((r) => ({ ...r, ratingAvg: r.ratingAvg / 10 })),
    categories,
    languages: ['pt', 'en', 'es'],
  });
}
