import type { Metadata, Viewport } from 'next';
import './globals.css';
import WhatsAppFAB from '@/components/WhatsAppFAB';
import PwaInstallPrompt from '@/components/PwaInstallPrompt';
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister';

// Cloudflare Pages exige edge runtime
export const runtime = 'edge';

const SITE_URL = 'https://univercert.net';
const SITE_NAME = 'UniverCert';
const SITE_TITLE = 'UniverCert · Certificados digitais brasileiros';
const SITE_DESCRIPTION =
  'A plataforma brasileira de certificados digitais. Pix, Boleto, NF-e e WhatsApp. Integrado com Hotmart, Memberkit, Fluent Community, Kiwify e Eduzz. 50 certificados grátis/mês.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: '%s · UniverCert',
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: 'DXPRO Univerbeauty Tecnologia LTDA' }],
  generator: 'Next.js',
  keywords: [
    'certificado digital',
    'certificado online',
    'certificado curso',
    'certificado verificável',
    'emissão de certificados',
    'certificado WhatsApp',
    'Hotmart certificado',
    'Memberkit certificado',
    'Fluent Community',
    'Kiwify certificado',
    'plataforma certificados Brasil',
    'Open Badges',
    'certificado verificação QR',
  ],
  category: 'education',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/icon', type: 'image/png', sizes: '64x64' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/icon',
    apple: [
      { url: '/apple-icon', type: 'image/png', sizes: '180x180' },
    ],
    other: [
      { rel: 'mask-icon', url: '/icon.svg', color: '#1B2D5E' },
    ],
  },
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: '#1B2D5E',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        {/* Anti-flash: aplica tema antes do paint */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('uc_theme')||'system';var d=t==='dark'||(t==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(d)document.documentElement.classList.add('dark');}catch(e){}})();`,
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'SoftwareApplication',
              name: 'UniverCert',
              applicationCategory: 'BusinessApplication',
              operatingSystem: 'Web',
              offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'BRL',
                description: '50 certificados grátis/mês',
              },
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: '4.9',
                ratingCount: '23',
              },
              description: SITE_DESCRIPTION,
              url: SITE_URL,
              inLanguage: 'pt-BR',
              author: {
                '@type': 'Organization',
                name: 'DXPRO Univerbeauty Tecnologia LTDA',
                url: SITE_URL,
              },
            }),
          }}
        />
      </head>
      <body>
        {children}
        <WhatsAppFAB />
        <PwaInstallPrompt />
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
