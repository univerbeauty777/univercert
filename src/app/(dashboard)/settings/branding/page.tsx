// UniverCert · /settings/branding GODMODE (S62b)

import { redirect } from 'next/navigation';
import { getCurrentSession } from '@/lib/rbac';
import BrandingClient from './BrandingClient';
import PageHeader from '@/components/PageHeader';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export default async function BrandingPage() {
  const sess = await getCurrentSession();
  if (!sess) redirect('/sign-in?next=/settings/branding');
  return (
    <main className="page" style={{ maxWidth: 900 }}>
      <PageHeader
        title="Identidade visual"
        subtitle="Logo, cores, descrição e depoimentos da sua escola"
        actions={<a href={`/escola/${sess.workspace.slug}`} target="_blank" rel="noopener" className="btn-secondary btn-sm" style={{ borderRadius: 10 }}>Ver página pública →</a>}
      />
      <BrandingClient workspaceSlug={sess.workspace.slug} />
    </main>
  );
}
