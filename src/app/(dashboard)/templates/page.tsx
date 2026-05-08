// UniverCert · gestão de templates (Sprint 1 implementa editor Konva.js)

import { eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { templates } from '@/db/schema';

export const runtime = 'edge';

export default async function TemplatesPage() {
  const db = getDb();
  const workspaceId = 'ws_univerhair';

  const list = await db.select().from(templates).where(eq(templates.workspaceId, workspaceId));

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-extrabold">Templates</h1>
          <button className="btn-primary">+ Novo template</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {list.map((t) => (
            <div key={t.id} className="card hover:shadow-lg transition">
              <div className="aspect-video bg-gradient-to-br from-primary/10 to-accent/10 rounded-lg flex items-center justify-center text-4xl mb-3">
                🏆
              </div>
              <div className="font-bold">{t.name}</div>
              <div className="text-xs text-gray-500 mt-1">
                {t.vertical} · {t.isPublished ? 'Publicado' : 'Rascunho'}
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-gray-400 mt-4">
          Sprint 1: editor visual Konva.js · upload de logo/fundo/assinatura.
        </p>
      </div>
    </main>
  );
}
