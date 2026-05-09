// UniverCert · /templates/editor (Sprint 21)
// Editor V2 GODMODE: import-first + zones drag

import { eq, and } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { templates } from '@/db/schema';
import { requireRole, RbacError } from '@/lib/rbac';
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
      return <main className="page"><div className="card text-center py-16"><p className="text-sm text-[rgb(var(--fg-muted))]">Sem permissão (editor+).</p></div></main>;
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
