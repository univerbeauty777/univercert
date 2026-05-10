import type { MetadataRoute } from 'next';

export const runtime = 'edge';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'UniverCert · Certificados digitais brasileiros',
    short_name: 'UniverCert',
    description:
      'Plataforma brasileira de certificados digitais. Pix, Boleto, NF-e e WhatsApp. Integrado com Hotmart, Memberkit, Fluent Community.',
    start_url: '/dashboard',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#0A0E1A',
    theme_color: '#1B2D5E',
    lang: 'pt-BR',
    dir: 'ltr',
    categories: ['business', 'education', 'productivity'],
    scope: '/',
    icons: [
      { src: '/icon', sizes: '64x64', type: 'image/png', purpose: 'any' },
      { src: '/apple-icon', sizes: '180x180', type: 'image/png', purpose: 'any maskable' },
    ],
    shortcuts: [
      {
        name: 'Visão geral',
        short_name: 'Dashboard',
        description: 'Estatísticas + ações pendentes',
        url: '/dashboard',
      },
      {
        name: 'Fila de aprovação',
        short_name: 'Fila',
        description: 'Aprovar requests pendentes',
        url: '/queue',
      },
      {
        name: 'Analytics',
        short_name: 'Analytics',
        description: 'Shares + verificações',
        url: '/analytics',
      },
      {
        name: 'Verificar certificado',
        short_name: 'Verificar',
        description: 'Validar autenticidade',
        url: '/verificar',
      },
      {
        name: 'Demo',
        short_name: 'Demo',
        description: 'Emitir cert de teste',
        url: '/demo',
      },
    ],
    // PWA install pode aparecer com prompt customizado (S34)
    prefer_related_applications: false,
  };
}
