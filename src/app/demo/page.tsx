// UniverCert · Demo pública (Sprint 10) · entry point

import DemoClient from './DemoClient';

export const runtime = 'edge';

export const metadata = {
  title: 'Demo · Emita um certificado de teste em 30 segundos',
  description:
    'Teste o UniverCert sem cadastro. Em 30 segundos, você emite um certificado real, com URL de verificação pública e QR code. Sem cartão de crédito.',
};

export default function DemoPage() {
  return <DemoClient />;
}
