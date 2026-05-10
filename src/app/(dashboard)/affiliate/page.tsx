// UniverCert · /affiliate dashboard (S44 + S45)

import { redirect } from 'next/navigation';
import { getCurrentSession } from '@/lib/rbac';
import AffiliateClient from './AffiliateClient';
import PageHeader from '@/components/PageHeader';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export default async function AffiliatePage() {
  const sess = await getCurrentSession();
  if (!sess) redirect('/sign-in?next=/affiliate');
  return (
    <main className="page" style={{ maxWidth: 1100 }}>
      <PageHeader title="Programa de afiliados" subtitle="Indique a UniverCert e ganhe % das mensalidades dos referidos" />
      <AffiliateClient />
    </main>
  );
}
