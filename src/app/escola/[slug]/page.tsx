// UniverCert · /escola/[slug] — Issuer profile page (S31)
// Página pública SEO-friendly. Mostra escola, certs emitidos, cursos, depoimentos.

import { eq, and, desc, count } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { getDb } from '@/db/client';
import { workspaces, workspaceBrand, credentials, recipients, certificateRequests } from '@/db/schema';
import type { Metadata } from 'next';

export const runtime = 'edge';
export const revalidate = 600; // 10 min

type Props = { params: Promise<{ slug: string }> };

async function getIssuer(slug: string) {
  const db = getDb();
  const [ws] = await db.select().from(workspaces).where(eq(workspaces.slug, slug)).limit(1);
  if (!ws) return null;
  const [brand] = await db.select().from(workspaceBrand).where(eq(workspaceBrand.workspaceId, ws.id)).limit(1);
  const [certCount] = await db
    .select({ value: count() })
    .from(credentials)
    .where(and(eq(credentials.workspaceId, ws.id), eq(credentials.status, 'issued')));
  const recentCerts = await db
    .select({
      id: credentials.id, courseName: credentials.courseName, issuedAt: credentials.issuedAt,
      recipientName: recipients.name,
    })
    .from(credentials)
    .leftJoin(recipients, eq(recipients.id, credentials.recipientId))
    .where(and(eq(credentials.workspaceId, ws.id), eq(credentials.status, 'issued')))
    .orderBy(desc(credentials.issuedAt))
    .limit(12);
  return { ws, brand, certCount: certCount?.value ?? 0, recentCerts };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await getIssuer(slug).catch(() => null);
  if (!data) return { title: 'Escola não encontrada · UniverCert' };
  const name = data.brand?.displayName ?? data.ws.name;
  const desc = data.brand?.description ?? data.brand?.tagline ?? `${name} · ${data.certCount.toLocaleString('pt-BR')} certificados emitidos via UniverCert`;
  return {
    title: `${name} · UniverCert`,
    description: desc,
    openGraph: { title: name, description: desc, type: 'profile', images: data.brand?.coverUrl ? [data.brand.coverUrl] : data.brand?.logoUrl ? [data.brand.logoUrl] : [] },
    twitter: { card: 'summary_large_image', title: name, description: desc },
  };
}

export default async function IssuerPage({ params }: Props) {
  const { slug } = await params;
  const data = await getIssuer(slug);
  if (!data) notFound();
  const { ws, brand, certCount, recentCerts } = data;
  const name = brand?.displayName ?? ws.name;
  const tagline = brand?.tagline ?? 'Certificados verificáveis · UniverCert';
  const accent = brand?.brandColor ?? '#1B2D5E';
  const testimonials: Array<{ author: string; role?: string; text: string }> = (() => {
    try { return JSON.parse(brand?.testimonialsJson ?? '[]'); } catch { return []; }
  })();

  return (
    <main style={{ minHeight: '100vh', background: '#fafafa' }}>
      {/* Cover banner */}
      <div style={{
        height: 220, background: brand?.coverUrl ? `url(${brand.coverUrl}) center/cover` : `linear-gradient(135deg, ${accent}, #06B6D4)`,
        position: 'relative', borderBottom: '1px solid rgba(0,0,0,0.06)',
      }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 60%, rgba(0,0,0,0.4))' }} />
      </div>

      {/* Header card */}
      <div style={{ maxWidth: 1100, margin: '-80px auto 0', padding: '0 24px', position: 'relative', zIndex: 1 }}>
        <div style={{ background: '#fff', borderRadius: 20, padding: 28, boxShadow: '0 8px 32px rgba(0,0,0,0.08)', display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div style={{ width: 96, height: 96, borderRadius: 24, background: brand?.logoUrl ? `url(${brand.logoUrl}) center/cover` : accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
            {!brand?.logoUrl && name.slice(0, 2).toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 240 }}>
            <h1 style={{ fontSize: 32, fontWeight: 800, margin: 0, color: '#0f172a', letterSpacing: '-0.02em' }}>{name}</h1>
            <p style={{ fontSize: 15, color: '#64748b', margin: '6px 0 0' }}>{tagline}</p>
            <div style={{ display: 'flex', gap: 24, marginTop: 16, flexWrap: 'wrap' }}>
              {brand?.showCertCount !== 0 && (
                <div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: accent }}>{certCount.toLocaleString('pt-BR')}</div>
                  <div style={{ fontSize: 12, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Certificados emitidos</div>
                </div>
              )}
              {brand?.websiteUrl && (
                <a href={brand.websiteUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, border: `1px solid ${accent}`, color: accent, textDecoration: 'none', fontWeight: 600, fontSize: 13 }}>
                  Visitar site →
                </a>
              )}
            </div>
            {(brand?.socialInstagram || brand?.socialYoutube || brand?.socialLinkedin) && (
              <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                {brand?.socialInstagram && <a href={`https://instagram.com/${brand.socialInstagram.replace('@','')}`} target="_blank" rel="noopener noreferrer" style={{ color: '#64748b', textDecoration: 'none', fontSize: 13 }}>📷 @{brand.socialInstagram.replace('@','')}</a>}
                {brand?.socialYoutube && <a href={`https://youtube.com/${brand.socialYoutube}`} target="_blank" rel="noopener noreferrer" style={{ color: '#64748b', textDecoration: 'none', fontSize: 13 }}>▶ {brand.socialYoutube}</a>}
                {brand?.socialLinkedin && <a href={`https://linkedin.com/company/${brand.socialLinkedin}`} target="_blank" rel="noopener noreferrer" style={{ color: '#64748b', textDecoration: 'none', fontSize: 13 }}>💼 {brand.socialLinkedin}</a>}
              </div>
            )}
          </div>
        </div>

        {/* Bio */}
        {brand?.description && (
          <section style={{ background: '#fff', borderRadius: 20, padding: 28, marginTop: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 12px', color: '#0f172a' }}>Sobre</h2>
            <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{brand.description}</p>
          </section>
        )}

        {/* Recent certs grid */}
        {brand?.showRecentCerts !== 0 && recentCerts.length > 0 && (
          <section style={{ background: '#fff', borderRadius: 20, padding: 28, marginTop: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 16px', color: '#0f172a' }}>Certificados recentes</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
              {recentCerts.map((c) => (
                <a key={c.id} href={`/c/${c.id}`} style={{ display: 'block', padding: 16, borderRadius: 14, border: '1px solid rgba(0,0,0,0.06)', textDecoration: 'none', color: 'inherit', transition: 'all 0.15s' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 4 }}>{c.courseName}</div>
                  {c.recipientName && <div style={{ fontSize: 12, color: '#64748b' }}>{c.recipientName}</div>}
                  {c.issuedAt && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>{new Date(c.issuedAt * 1000).toLocaleDateString('pt-BR')}</div>}
                </a>
              ))}
            </div>
          </section>
        )}

        {/* Testimonials */}
        {testimonials.length > 0 && (
          <section style={{ background: '#fff', borderRadius: 20, padding: 28, marginTop: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 16px', color: '#0f172a' }}>Depoimentos</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
              {testimonials.map((t, i) => (
                <blockquote key={i} style={{ margin: 0, padding: 18, borderRadius: 14, background: '#f8fafc', borderLeft: `3px solid ${accent}` }}>
                  <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.6, margin: '0 0 10px', fontStyle: 'italic' }}>"{t.text}"</p>
                  <cite style={{ fontSize: 12, color: '#0f172a', fontWeight: 600, fontStyle: 'normal' }}>— {t.author}{t.role && <span style={{ color: '#94a3b8', fontWeight: 400 }}> · {t.role}</span>}</cite>
                </blockquote>
              ))}
            </div>
          </section>
        )}

        {/* Footer */}
        <footer style={{ textAlign: 'center', padding: '32px 0 48px', color: '#94a3b8', fontSize: 12 }}>
          <a href="/" style={{ color: '#94a3b8', textDecoration: 'none' }}>Powered by <strong>UniverCert</strong> · Certificados verificáveis</a>
        </footer>
      </div>
    </main>
  );
}
