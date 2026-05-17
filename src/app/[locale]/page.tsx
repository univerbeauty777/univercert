// UniverCert · Landing GODMODE multilingue (PT/EN/ES/FR)
// Geo-redirect via middleware. Locale via URL segment.

import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { t, type Locale, ALL_LOCALES } from '@/lib/i18n';
import { FEATURES, COMPARISON, getCategoryLabel, pickML } from '@/lib/landing-data';
import TopNav from '@/components/TopNav';

export const runtime = 'edge';
export const revalidate = 3600; // 1h ISR

type Params = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale: l } = await params;
  if (!ALL_LOCALES.includes(l as Locale)) return {};
  const loc = l as Locale;
  return {
    title: `UniverCert · ${t(loc, 'hero.title.line1')} ${t(loc, 'hero.title.line2')}`,
    description: t(loc, 'hero.subtitle'),
    alternates: {
      canonical: `/${loc}`,
      languages: { pt: '/pt', en: '/en', es: '/es', fr: '/fr', 'x-default': '/pt' },
    },
    openGraph: {
      title: `UniverCert · ${t(loc, 'hero.title.line1')}`,
      description: t(loc, 'hero.subtitle'),
      locale: loc === 'pt' ? 'pt_BR' : loc === 'en' ? 'en_US' : loc === 'es' ? 'es_ES' : 'fr_FR',
    },
  };
}

export default async function LandingPage({ params }: Params) {
  const { locale: l } = await params;
  if (!ALL_LOCALES.includes(l as Locale)) notFound();
  const loc = l as Locale;

  const cats = ['editor', 'ai', 'delivery', 'integrations', 'security', 'business', 'branding', 'standards'];

  return (
    <main style={{ minHeight: '100vh', background: '#fff', color: '#0f172a', fontFamily: 'Inter, -apple-system, system-ui, sans-serif' }}>
      <TopNav locale={loc} current="landing" />


      {/* HERO */}
      <section style={{ position: 'relative', overflow: 'hidden', padding: '80px 24px 60px' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 30% 20%, rgba(27,45,94,0.06), transparent 50%), radial-gradient(circle at 80% 80%, rgba(212,169,55,0.06), transparent 50%)', zIndex: -1 }} />
        <div style={{ maxWidth: 1100, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 100, background: 'rgba(27,45,94,0.08)', color: '#1B2D5E', fontSize: 12, fontWeight: 700, letterSpacing: '0.05em', marginBottom: 28 }}>
            {t(loc, 'hero.badge')}
          </div>
          <h1 style={{ fontSize: 'clamp(40px, 6vw, 72px)', fontWeight: 800, lineHeight: 1.05, margin: 0, letterSpacing: '-0.03em' }}>
            {t(loc, 'hero.title.line1')}<br />
            <span style={{ background: 'linear-gradient(135deg, #1B2D5E, #06B6D4, #D4A937)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {t(loc, 'hero.title.line2')}
            </span>
          </h1>
          <p style={{ fontSize: 18, color: '#475569', maxWidth: 720, margin: '24px auto 36px', lineHeight: 1.6 }}>
            {t(loc, 'hero.subtitle')}
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
            <a href="/sign-up" style={{ padding: '16px 32px', background: '#1B2D5E', color: '#fff', borderRadius: 14, textDecoration: 'none', fontWeight: 700, fontSize: 15 }}>
              {t(loc, 'hero.cta.primary')}
            </a>
            <a href="/demo" style={{ padding: '16px 32px', background: '#fff', color: '#1B2D5E', borderRadius: 14, textDecoration: 'none', fontWeight: 700, fontSize: 15, border: '1px solid rgba(27,45,94,0.2)' }}>
              {t(loc, 'hero.cta.secondary')}
            </a>
          </div>
          <p style={{ fontSize: 12, color: '#94a3b8' }}>{t(loc, 'hero.trust')}</p>
        </div>
      </section>

      {/* TRUST BAR */}
      <section style={{ padding: '20px 24px', background: '#fafafa', borderTop: '1px solid rgba(0,0,0,0.04)', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: 32, color: '#64748b', fontSize: 13 }}>
          <span>✓ Cloudflare Edge · 300+ POPs</span>
          <span>✓ W3C VC + Open Badges 3.0</span>
          <span>✓ LGPD · GDPR · SOC 2 prep</span>
          <span>✓ Claude AI nativo</span>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" style={{ padding: '80px 24px', background: '#fff' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, textAlign: 'center', margin: 0, letterSpacing: '-0.02em' }}>
            {t(loc, 'features.title')}
          </h2>
          <p style={{ fontSize: 16, color: '#64748b', textAlign: 'center', marginTop: 12, marginBottom: 48 }}>{t(loc, 'features.subtitle')}</p>

          {cats.map((cat) => {
            const items = FEATURES.filter((f) => f.cat === cat);
            return (
              <div key={cat} style={{ marginBottom: 48 }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1B2D5E', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 6, height: 24, background: 'linear-gradient(180deg, #1B2D5E, #D4A937)', borderRadius: 4 }} />
                  {getCategoryLabel(cat, loc)}
                  <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>· {items.length}</span>
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
                  {items.map((f, i) => (
                    <div key={i} style={{
                      padding: 18,
                      borderRadius: 14,
                      border: f.highlight ? '1.5px solid #D4A937' : '1px solid rgba(0,0,0,0.06)',
                      background: f.highlight ? 'linear-gradient(135deg, #fff, #fffbeb)' : '#fff',
                      boxShadow: f.highlight ? '0 4px 16px rgba(212,169,55,0.18)' : 'none',
                      transition: 'all 0.2s',
                    }}>
                      <div style={{ fontSize: 26, marginBottom: 8 }}>{f.icon}</div>
                      <h4 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 6px', color: '#0f172a' }}>{pickML(f.title, loc)}</h4>
                      <p style={{ fontSize: 12.5, color: '#64748b', lineHeight: 1.5, margin: 0 }}>{pickML(f.desc, loc)}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* COMPARISON */}
      <section id="compare" style={{ padding: '80px 24px', background: 'linear-gradient(180deg, #fafafa, #fff)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, textAlign: 'center', margin: 0, letterSpacing: '-0.02em' }}>
            {t(loc, 'compare.title')}
          </h2>
          <p style={{ fontSize: 16, color: '#64748b', textAlign: 'center', marginTop: 12, marginBottom: 48 }}>{t(loc, 'compare.subtitle')}</p>

          <div style={{ overflowX: 'auto', borderRadius: 16, border: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
            <table style={{ width: '100%', minWidth: 800, borderCollapse: 'collapse', background: '#fff' }}>
              <thead style={{ background: 'linear-gradient(90deg, #1B2D5E, #06B6D4)', color: '#fff' }}>
                <tr>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{t(loc, 'compare.feature')}</th>
                  <th style={{ padding: '14px 16px', textAlign: 'center', fontSize: 12, fontWeight: 700, background: 'rgba(212,169,55,0.3)' }}>
                    🏆 {t(loc, 'compare.us')}
                  </th>
                  <th style={{ padding: '14px 16px', textAlign: 'center', fontSize: 12, fontWeight: 700 }}>Credly</th>
                  <th style={{ padding: '14px 16px', textAlign: 'center', fontSize: 12, fontWeight: 700 }}>Accredible</th>
                  <th style={{ padding: '14px 16px', textAlign: 'center', fontSize: 12, fontWeight: 700 }}>Sertifier</th>
                  <th style={{ padding: '14px 16px', textAlign: 'center', fontSize: 12, fontWeight: 700 }}>Hotmart</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((row, i) => (
                  <tr key={i} style={{ borderTop: '1px solid rgba(0,0,0,0.06)', background: i % 2 ? '#fafafa' : '#fff' }}>
                    <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 500, color: '#0f172a' }}>{pickML(row.feature, loc)}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#10b981', background: 'rgba(212,169,55,0.05)' }}>{row.uc}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'center', fontSize: 13, color: '#64748b' }}>{row.credly}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'center', fontSize: 13, color: '#64748b' }}>{row.accredible}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'center', fontSize: 13, color: '#64748b' }}>{row.sertifier}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'center', fontSize: 13, color: '#64748b' }}>{row.hotmart}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: '#94a3b8' }}>
            ✅ Recurso completo · ⚠ Limitado/cobrado à parte · ❌ Não disponível
          </p>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" style={{ padding: '80px 24px', background: '#fff' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, textAlign: 'center', margin: 0, letterSpacing: '-0.02em' }}>
            {t(loc, 'pricing.title')}
          </h2>
          <p style={{ fontSize: 16, color: '#64748b', textAlign: 'center', marginTop: 12, marginBottom: 48 }}>{t(loc, 'pricing.subtitle')}</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, alignItems: 'stretch' }}>
            {[
              { id: 'free', name: 'Free', price: 'R$ 0', limits: '50 certs/mês', features: ['1 usuário', 'Templates prontos', 'Verificação pública', 'Open Badges 3.0'], cta: t(loc, 'pricing.cta.free') },
              { id: 'starter', name: 'Starter', price: 'R$ 97', limits: '500 certs/mês', features: ['3 usuários', 'Bulk export', 'Webhooks Hotmart/etc', 'Workflows email + WA'], cta: t(loc, 'pricing.cta.starter') },
              { id: 'pro', name: 'Pro', price: 'R$ 297', limits: '5.000 certs/mês', features: ['15 usuários · 3 workspaces', 'Domínio próprio + SSL', 'Sem marca UniverCert', 'API keys · Audit export', 'AI · Apple/Google Wallet'], cta: t(loc, 'pricing.cta.pro'), popular: true },
              { id: 'enterprise', name: 'Enterprise', price: 'Custom', limits: 'Ilimitado', features: ['SSO SAML', 'SLA 99.9% · Account manager', 'White-label total', 'SOC 2 · LGPD audit'], cta: t(loc, 'pricing.cta.enterprise') },
            ].map((p) => (
              <div key={p.id} style={{ position: 'relative', padding: 28, borderRadius: 18, border: p.popular ? '2px solid #1B2D5E' : '1px solid rgba(0,0,0,0.08)', background: '#fff', boxShadow: p.popular ? '0 8px 40px rgba(27,45,94,0.18)' : '0 2px 12px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column' }}>
                {p.popular && <span style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(90deg, #1B2D5E, #06B6D4)', color: '#fff', padding: '4px 14px', borderRadius: 100, fontSize: 11, fontWeight: 700, letterSpacing: '0.05em' }}>{t(loc, 'pricing.popular')}</span>}
                <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>{p.name}</h3>
                <div style={{ fontSize: 36, fontWeight: 800, color: '#1B2D5E', marginTop: 8 }}>{p.price}{p.price !== 'Custom' && <span style={{ fontSize: 14, color: '#94a3b8', fontWeight: 500 }}>{t(loc, 'pricing.month')}</span>}</div>
                <p style={{ fontSize: 13, color: '#64748b', marginTop: 4, marginBottom: 18 }}>{p.limits}</p>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', fontSize: 13, color: '#475569', flex: 1 }}>
                  {p.features.map((f, i) => (<li key={i} style={{ padding: '5px 0' }}>✓ {f}</li>))}
                </ul>
                <a href={p.id === 'enterprise' ? 'mailto:contato@univercert.net' : '/sign-up'} style={{ display: 'block', textAlign: 'center', padding: 12, background: p.popular ? '#1B2D5E' : 'transparent', color: p.popular ? '#fff' : '#1B2D5E', borderRadius: 10, textDecoration: 'none', fontWeight: 700, fontSize: 13, border: p.popular ? 'none' : '1px solid #1B2D5E' }}>{p.cta}</a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section style={{ padding: '80px 24px', background: 'linear-gradient(135deg, #0A0E1A 0%, #1B2D5E 50%, #06B6D4 100%)', color: '#fff' }}>
        <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>{t(loc, 'cta.title')}</h2>
          <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.85)', marginTop: 16, marginBottom: 32, lineHeight: 1.5 }}>{t(loc, 'cta.subtitle')}</p>
          <a href="/sign-up" style={{ display: 'inline-block', padding: '18px 40px', background: '#D4A937', color: '#0A0E1A', borderRadius: 14, textDecoration: 'none', fontWeight: 700, fontSize: 16 }}>{t(loc, 'cta.button')}</a>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ padding: '40px 24px', background: '#0A0E1A', color: '#94a3b8', fontSize: 13 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 32 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 10 }}>
              <span style={{ color: '#fff' }}>univer</span><span style={{ color: '#D4A937' }}>CERT</span>
            </div>
            <p style={{ fontSize: 12, lineHeight: 1.5 }}>{t(loc, 'footer.tagline')}</p>
          </div>
          <div>
            <h4 style={{ color: '#fff', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>{t(loc, 'footer.product')}</h4>
            <a href="#features" style={{ display: 'block', color: '#94a3b8', textDecoration: 'none', padding: '3px 0' }}>{t(loc, 'nav.features')}</a>
            <a href="#pricing" style={{ display: 'block', color: '#94a3b8', textDecoration: 'none', padding: '3px 0' }}>{t(loc, 'nav.pricing')}</a>
            <a href="#compare" style={{ display: 'block', color: '#94a3b8', textDecoration: 'none', padding: '3px 0' }}>{t(loc, 'nav.compare')}</a>
            <a href="/marketplace" style={{ display: 'block', color: '#94a3b8', textDecoration: 'none', padding: '3px 0' }}>Marketplace</a>
          </div>
          <div>
            <h4 style={{ color: '#fff', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>{t(loc, 'footer.resources')}</h4>
            <a href="/verificar" style={{ display: 'block', color: '#94a3b8', textDecoration: 'none', padding: '3px 0' }}>Verificar cert</a>
            <a href="/partner/apply" style={{ display: 'block', color: '#94a3b8', textDecoration: 'none', padding: '3px 0' }}>Programa Educator</a>
            <a href="/affiliate" style={{ display: 'block', color: '#94a3b8', textDecoration: 'none', padding: '3px 0' }}>Afiliados</a>
            <a href="/docs" style={{ display: 'block', color: '#94a3b8', textDecoration: 'none', padding: '3px 0' }}>API docs</a>
          </div>
          <div>
            <h4 style={{ color: '#fff', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>{t(loc, 'footer.legal')}</h4>
            <a href="/termos" style={{ display: 'block', color: '#94a3b8', textDecoration: 'none', padding: '3px 0' }}>Termos</a>
            <a href="/privacidade" style={{ display: 'block', color: '#94a3b8', textDecoration: 'none', padding: '3px 0' }}>Privacidade</a>
            <a href="/lgpd" style={{ display: 'block', color: '#94a3b8', textDecoration: 'none', padding: '3px 0' }}>LGPD</a>
          </div>
        </div>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: 32, paddingTop: 20, textAlign: 'center', fontSize: 11 }}>
          {t(loc, 'footer.rights')}
        </div>
      </footer>
    </main>
  );
}
