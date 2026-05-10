// UniverCert · /marketplace (S43)

import type { Metadata } from 'next';
import MarketplaceClient from './MarketplaceClient';

export const runtime = 'edge';
export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Marketplace de templates · UniverCert',
  description: 'Templates de certificados gratuitos e premium criados pela comunidade. Use na sua escola em 1 clique.',
  openGraph: {
    title: 'Marketplace UniverCert · Templates da comunidade',
    description: '+200 templates de certificados pra escolas. Beleza, educação, tech, MBA.',
  },
};

export default function MarketplacePage() {
  return (
    <main style={{ minHeight: '100vh', background: '#fafafa' }}>
      <nav style={{ background: '#fff', borderBottom: '1px solid rgba(0,0,0,0.06)', padding: '14px 24px', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <a href="/" style={{ fontWeight: 800, fontSize: 16, textDecoration: 'none', color: '#0f172a' }}>
            <span style={{ color: '#1B2D5E' }}>univer</span><span style={{ color: '#D4A937' }}>CERT</span>
          </a>
          <div style={{ display: 'flex', gap: 12 }}>
            <a href="/sign-in" style={{ textDecoration: 'none', color: '#64748b', fontSize: 13 }}>Entrar</a>
            <a href="/sign-up" style={{ background: '#1B2D5E', color: '#fff', padding: '6px 14px', borderRadius: 8, textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>Grátis</a>
          </div>
        </div>
      </nav>

      <header style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px 20px' }}>
        <h1 style={{ fontSize: 36, fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>Marketplace</h1>
        <p style={{ fontSize: 15, color: '#64748b', marginTop: 6 }}>Templates criados pela comunidade. Use grátis ou suba o seu.</p>
      </header>

      <MarketplaceClient />
    </main>
  );
}
