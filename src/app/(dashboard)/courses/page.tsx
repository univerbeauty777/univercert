// UniverCert · /courses · lista de cursos do workspace (S22)

import { eq, desc } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { courses, workspaces } from '@/db/schema';
import { requireRole, RbacError } from '@/lib/rbac';
import PageHeader from '@/components/PageHeader';
import EmptyState from '@/components/EmptyState';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export default async function CoursesPage() {
  let sess;
  try { sess = await requireRole('viewer'); } catch (e) {
    if (e instanceof RbacError) {
      return <main className="page"><div className="card text-center py-16"><p className="text-sm text-[rgb(var(--fg-muted))]">Faça login</p></div></main>;
    }
    throw e;
  }

  const db = getDb();
  const list = await db
    .select()
    .from(courses)
    .where(eq(courses.workspaceId, sess.workspace.id))
    .orderBy(desc(courses.updatedAt));

  return (
    <main className="page">
      <PageHeader
        title="Cursos"
        subtitle="Cada curso pode ter formulário próprio de solicitação (fotos, vídeos, etc) e template default."
        actions={<a href="/courses/new" className="btn-primary btn-sm">+ Novo curso</a>}
      />

      {list.length === 0 ? (
        <EmptyState
          icon="📘"
          title="Nenhum curso cadastrado"
          description="Crie cursos pra organizar emissões e configurar requisitos personalizados (fotos antes/depois, vídeos, etc)."
          cta={{ label: '+ Criar primeiro curso', href: '/courses/new' }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {list.map((c) => {
            const reqs = c.requirementsJson ? safeParseFields(c.requirementsJson) : 0;
            return (
              <a
                key={c.id}
                href={`/courses/${c.id}`}
                className="card-hover block"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-sm truncate">{c.name}</h3>
                    <p className="text-[11px] text-[rgb(var(--fg-subtle))] truncate font-mono mt-0.5">
                      /solicitar/{sess.workspace.slug}/{c.slug}
                    </p>
                  </div>
                  {!c.isActive && <span className="badge badge-neutral">inativo</span>}
                  {c.isActive && c.autoApprove && <span className="badge badge-success">auto</span>}
                </div>
                <div className="flex items-center gap-2 text-xs text-[rgb(var(--fg-muted))] flex-wrap mt-3">
                  {c.hours && <span>{c.hours}h</span>}
                  {c.vertical && <span>· {c.vertical}</span>}
                  <span>· {reqs > 0 ? `${reqs} req` : 'sem form'}</span>
                </div>
              </a>
            );
          })}
        </div>
      )}
    </main>
  );
}

function safeParseFields(j: string): number {
  try { return JSON.parse(j).fields?.length ?? 0; } catch { return 0; }
}
