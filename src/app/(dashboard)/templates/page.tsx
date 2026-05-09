// UniverCert · Templates · galeria + editor de personalização (Sprint 12)

import { eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { brandKits, workspaces } from '@/db/schema';
import { CERT_VARIANTS } from '@/lib/cert-template';
import PageHeader from '@/components/PageHeader';
import TemplatesGalleryClient from './TemplatesGalleryClient';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export default async function TemplatesPage() {
  const db = getDb();
  const workspaceSlug = 'univerhair';

  const [ws] = await db
    .select({ workspace: workspaces, brand: brandKits })
    .from(workspaces)
    .leftJoin(brandKits, eq(brandKits.workspaceId, workspaces.id))
    .where(eq(workspaces.slug, workspaceSlug))
    .limit(1);

  const initialPrimary = ws?.brand?.primaryColor ?? '#1B2D5E';
  const initialAccent = ws?.brand?.secondaryColor ?? '#D4A937';
  const workspaceName = ws?.workspace?.name ?? 'UniverCert';

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-6">
      <div className="max-w-7xl mx-auto">
        <PageHeader
          icon="🎨"
          title="Templates de certificado"
          subtitle={`${CERT_VARIANTS.length} variantes premium · personalize cores e veja o preview ao vivo`}
        />

        <TemplatesGalleryClient
          variants={CERT_VARIANTS as any}
          initialPrimary={initialPrimary}
          initialAccent={initialAccent}
          workspaceName={workspaceName}
        />
      </div>
    </main>
  );
}
