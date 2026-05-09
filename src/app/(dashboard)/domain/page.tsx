// UniverCert · Domain wizard · Sprint 19 GODMODE

import { eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { workspaces } from '@/db/schema';
import DomainWizard from './DomainWizard';
import PageHeader from '@/components/PageHeader';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export default async function DomainPage() {
  const db = getDb();
  const workspaceSlug = 'univerhair';
  const [ws] = await db.select().from(workspaces).where(eq(workspaces.slug, workspaceSlug)).limit(1);

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-ink-900 py-8 px-6">
      <div className="max-w-4xl mx-auto">
        <PageHeader
          icon="🌐"
          title="Domínio próprio"
          subtitle="cert.suaescola.com.br · sua marca em todo certificado emitido"
        />

        <DomainWizard
          workspaceId={ws?.id ?? ''}
          currentDomain={ws?.customDomain ?? null}
          fallbackHost="univercert.pages.dev"
        />
      </div>
    </main>
  );
}
