import type { MetadataRoute } from 'next';

export const runtime = 'edge';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'UniverCert · Certificados digitais brasileiros',
    short_name: 'UniverCert',
    description:
      'Plataforma brasileira de certificados digitais. Pix, Boleto, NF-e e WhatsApp. Integrado com Hotmart, Memberkit, Fluent Community.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#6366f1',
    icons: [
      {
        src: '/icon.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
