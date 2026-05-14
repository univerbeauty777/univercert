// UniverCert · /marketplace (S43 + TopNav)

import type { Metadata } from 'next';
import MarketplaceClient from './MarketplaceClient';
import TopNav from '@/components/TopNav';

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
      <TopNav current="marketplace" />

      <header style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px 20px' }}>
        <h1 style={{ fontSize: 36, fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>Marketplace</h1>
        <p style={{ fontSize: 15, color: '#64748b', marginTop: 6 }}>Templates criados pela comunidade. Use grátis ou suba o seu.</p>
      </header>

      <MarketplaceClient />
    </main>
  );
}
