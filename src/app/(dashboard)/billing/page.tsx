// UniverCert · /billing GODMODE (S37)

import { redirect } from 'next/navigation';
import { getCurrentSession } from '@/lib/rbac';
import BillingClient from './BillingClient';
import PageHeader from '@/components/PageHeader';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export default async function BillingPage() {
  const sess = await getCurrentSession();
  if (!sess) redirect('/sign-in?next=/billing');
  return (
    <main className="page" style={{ maxWidth: 1200 }}>
      <PageHeader
        title="Billing & uso"
        subtitle="Plano atual, consumo do mês, histórico de faturas"
      />
      <BillingClient userEmail={sess.user.email} workspaceName={sess.workspace.name} />
    </main>
  );
}
