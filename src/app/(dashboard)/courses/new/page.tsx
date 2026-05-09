// UniverCert · /courses/new (S22)

import { eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { templates } from '@/db/schema';
import { requireRole, RbacError } from '@/lib/rbac';
import PageHeader from '@/components/PageHeader';
import CourseEditorClient from '../[id]/CourseEditorClient';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export default async function NewCoursePage() {
  let sess;
  try { sess = await requireRole('editor'); } catch (e) {
    if (e instanceof RbacError) return <main className="page"><div className="card text-center py-16"><p className="text-sm text-[rgb(var(--fg-muted))]">Sem permissão (editor+)</p></div></main>;
    throw e;
  }
  const db = getDb();
  const tpls = await db.select({ id: templates.id, name: templates.name }).from(templates).where(eq(templates.workspaceId, sess.workspace.id));

  return (
    <main className="page">
      <PageHeader
        title="Novo curso"
        subtitle="Defina nome, horas, template e requisitos extras pra solicitação de cert."
        actions={<a href="/courses" className="btn-ghost btn-sm">← Voltar</a>}
      />
      <CourseEditorClient
        workspaceSlug={sess.workspace.slug}
        templateOptions={tpls.map(t => ({ id: t.id, name: t.name }))}
      />
    </main>
  );
}
