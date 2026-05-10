// UniverCert · /analytics — Dashboard analytics GODMODE (S32)

import { redirect } from 'next/navigation';
import { getCurrentSession } from '@/lib/rbac';
import AnalyticsClient from './AnalyticsClient';
import PageHeader from '@/components/PageHeader';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export default async function AnalyticsPage() {
  const sess = await getCurrentSession();
  if (!sess) redirect('/sign-in?next=/analytics');
  return (
    <main className="page" style={{ maxWidth: 1400 }}>
      <PageHeader
        title="Analytics"
        subtitle="Shares, verificações e top certificados"
      />
      <AnalyticsClient />
    </main>
  );
}
