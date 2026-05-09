// UniverCert · /courses/[id] (S22)

import { eq, and } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { templates, courses } from '@/db/schema';
import { requireRole, RbacError } from '@/lib/rbac';
import PageHeader from '@/components/PageHeader';
import CourseEditorClient from './CourseEditorClient';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export default async function CourseEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let sess;
  try { sess = await requireRole('editor'); } catch (e) {
    if (e instanceof RbacError) return <main className="page"><div className="card text-center py-16"><p className="text-sm text-[rgb(var(--fg-muted))]">Sem permissão (editor+)</p></div></main>;
    throw e;
  }
  const db = getDb();
  const [c] = await db
    .select()
    .from(courses)
    .where(and(eq(courses.id, id), eq(courses.workspaceId, sess.workspace.id)))
    .limit(1);

  if (!c) {
    return <main className="page"><div className="card text-center py-16"><p className="text-sm text-[rgb(var(--fg-muted))]">Curso não encontrado.</p><a href="/courses" className="btn-secondary btn-sm mt-3">← Voltar</a></div></main>;
  }

  const tpls = await db.select({ id: templates.id, name: templates.name }).from(templates).where(eq(templates.workspaceId, sess.workspace.id));

  let initialReqs: any = null;
  if (c.requirementsJson) {
    try { initialReqs = JSON.parse(c.requirementsJson); } catch {}
  }

  return (
    <main className="page">
      <PageHeader
        title={c.name}
        subtitle={
          <>
            <code className="font-mono text-[11px]">{`/solicitar/${sess.workspace.slug}/${c.slug}`}</code>
            <a href={`/solicitar/${sess.workspace.slug}/${c.slug}`} target="_blank" rel="noopener" className="ml-2 text-xs text-[rgb(var(--brand))] underline">abrir form</a>
          </>
        }
        actions={<a href="/courses" className="btn-ghost btn-sm">← Voltar</a>}
      />
      <CourseEditorClient
        workspaceSlug={sess.workspace.slug}
        templateOptions={tpls.map(t => ({ id: t.id, name: t.name }))}
        initial={{
          id: c.id,
          name: c.name,
          slug: c.slug,
          description: c.description ?? '',
          hours: c.hours ?? undefined,
          defaultTemplateId: c.defaultTemplateId ?? undefined,
          requirements: initialReqs,
          vertical: c.vertical ?? '',
          isPublic: c.isPublic === 1,
          isActive: c.isActive === 1,
          autoApprove: c.autoApprove === 1,
        }}
      />
    </main>
  );
}
