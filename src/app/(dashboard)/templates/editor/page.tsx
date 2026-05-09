// UniverCert · /templates/editor (Sprint 21 / S22d hotfix UX)
// Editor V2 GODMODE: import-first + zones drag

import { eq, and } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { getDb } from '@/db/client';
import { templates } from '@/db/schema';
import { requireRole, RbacError, getCurrentSession } from '@/lib/rbac';
import type { LayoutV2 } from '@/lib/layout-v2';
import PageHeader from '@/components/PageHeader';
import EditorWrapper from './EditorWrapper';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export default async function TemplateEditorPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  let sess;
  try {
    sess = await requireRole('editor');
  } catch (e) {
    if (e instanceof RbacError) {
      if (e.code === 'UNAUTHENTICATED') {
        redirect('/sign-in?next=/templates/editor');
      }
      // FORBIDDEN — pega role atual + workspace pra UI clara
      const cur = await getCurrentSession().catch(() => null);
      const role = cur?.member.role ?? 'desconhecido';
      const wsName = cur?.workspace.name ?? 'workspace atual';
      return (
        <main className="page">
          <div className="card text-center py-16 mx-auto" style={{ maxWidth: 480 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔒</div>
            <h2 className="text-base font-semibold mb-2">Sem permissão pra editar templates</h2>
            <p className="text-sm text-[rgb(var(--fg-muted))] mb-1">
              Sua role em <strong>{wsName}</strong>: <code style={{ background: 'rgba(99,102,241,0.1)', padding: '2px 8px', borderRadius: 6 }}>{role}</code>
            </p>
            <p className="text-sm text-[rgb(var(--fg-muted))] mb-4">
              Necessário <strong>editor</strong> ou superior. Peça pra um admin do workspace promover sua role, ou troque de workspace na sidebar.
            </p>
            <a href="/templates" className="btn-primary btn-sm" style={{ borderRadius: 10 }}>← Voltar pra galeria</a>
          </div>
        </main>
      );
    }
    throw e;
  }

  const sp = await searchParams;
  let initialLayout: LayoutV2 | undefined;
  let templateName = 'Meu template';
  let templateId = sp.id;

  if (sp.id) {
    const db = getDb();
    const [t] = await db
      .select()
      .from(templates)
      .where(and(eq(templates.id, sp.id), eq(templates.workspaceId, sess.workspace.id)))
      .limit(1);
    if (t) {
      templateName = t.name;
      try {
        const parsed = JSON.parse(t.layoutJson);
        if (parsed.version === 2) initialLayout = parsed;
      } catch {}
    }
  }

  return (
    <main className="page" style={{ maxWidth: 1600 }}>
      <PageHeader
        title={templateId ? 'Editar template' : 'Novo template'}
        subtitle="Suba seu design (PNG/JPG/PDF/SVG) e posicione os campos. QR de verificação é obrigatório."
        actions={
          <a href="/templates" className="btn-ghost btn-sm">← Voltar</a>
        }
      />
      <EditorWrapper templateId={templateId} templateName={templateName} initialLayout={initialLayout} />
    </main>
  );
}
