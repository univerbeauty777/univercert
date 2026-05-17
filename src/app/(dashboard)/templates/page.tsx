// UniverCert · Templates · galeria + editor de personalização (Sprint 12+14)

import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { getDb } from '@/db/client';
import { brandKits, workspaces, templates } from '@/db/schema';
import { CERT_VARIANTS } from '@/lib/cert-template';
import { getCurrentSession } from '@/lib/rbac';
import PageHeader from '@/components/PageHeader';
import TemplatesGalleryClient from './TemplatesGalleryClient';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export default async function TemplatesPage() {
  const sess = await getCurrentSession();
  if (!sess) redirect('/sign-in');

  const db = getDb();
  const [ws] = await db
    .select({ workspace: workspaces, brand: brandKits })
    .from(workspaces)
    .leftJoin(brandKits, eq(brandKits.workspaceId, workspaces.id))
    .where(eq(workspaces.id, sess.workspace.id))
    .limit(1);

  // Templates customizados do workspace
  const customTemplates = ws?.workspace
    ? await db
        .select()
        .from(templates)
        .where(eq(templates.workspaceId, ws.workspace.id))
        .limit(50)
    : [];

  const initialPrimary = ws?.brand?.primaryColor ?? '#1B2D5E';
  const initialAccent = ws?.brand?.secondaryColor ?? '#D4A937';
  const workspaceName = ws?.workspace?.name ?? 'UniverCert';

  return (
    <main className="page">
      <PageHeader
        title="Templates de certificado"
        subtitle={`${CERT_VARIANTS.length} variantes premium · ${customTemplates.length} customizado${customTemplates.length !== 1 ? 's' : ''} · personalize cores ou crie do zero`}
        actions={
          <>
            <a href="/templates/new" className="btn-secondary btn-sm">Editor antigo</a>
            <a href="/templates/editor" className="btn-primary btn-sm">+ Novo template</a>
          </>
        }
      />

      <TemplatesGalleryClient
        variants={CERT_VARIANTS as any}
        customTemplates={customTemplates.map((t) => ({ id: t.id, name: t.name, vertical: t.vertical ?? 'livre' }))}
        initialPrimary={initialPrimary}
        initialAccent={initialAccent}
        workspaceName={workspaceName}
      />
    </main>
  );
}
