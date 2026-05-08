import type { Metadata } from 'next';
import './globals.css';

// Cloudflare Pages exige edge runtime
export const runtime = 'edge';

export const metadata: Metadata = {
  title: 'UniverCert · Certificados digitais para escolas brasileiras',
  description:
    'Plataforma brasileira de certificados digitais. Pix, Boleto, NF-e e WhatsApp. Integrado com Hotmart, Memberkit, Fluent Community e mais.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
