// UniverCert · /integrations/api-keys (S39)

import { redirect } from 'next/navigation';
import { getCurrentSession } from '@/lib/rbac';
import ApiKeysClient from './ApiKeysClient';
import PageHeader from '@/components/PageHeader';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export default async function ApiKeysPage() {
  const sess = await getCurrentSession();
  if (!sess) redirect('/sign-in?next=/integrations/api-keys');
  return (
    <main className="page" style={{ maxWidth: 1100 }}>
      <PageHeader
        title="API keys"
        subtitle="Bearer tokens pra integrar com Zapier, Make, scripts próprios"
        actions={<a href="/integrations" className="btn-ghost btn-sm">← Integrações</a>}
      />
      <ApiKeysClient />
    </main>
  );
}
