// UniverCert · gestão de templates

import { eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { templates } from '@/db/schema';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

const VERTICAL_COLORS: Record<string, string> = {
  cabelo: 'bg-blue-100 text-blue-800',
  estetica: 'bg-pink-100 text-pink-800',
  barbearia: 'bg-gray-200 text-gray-800',
  manicure: 'bg-yellow-100 text-yellow-800',
  livre: 'bg-purple-100 text-purple-800',
};

export default async function TemplatesPage() {
  const db = getDb();
  const workspaceId = 'ws_univerhair';

  const list = await db.select().from(templates).where(eq(templates.workspaceId, workspaceId));

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-extrabold">Templates</h1>
            <p className="text-sm text-gray-500 mt-1">
              {list.length} template{list.length !== 1 ? 's' : ''} ativo{list.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button className="btn-primary opacity-50 cursor-not-allowed" disabled title="Sprint 5: editor Konva.js">
            + Novo template (Sprint 5)
          </button>
        </div>

        {list.length === 0 ? (
          <div className="card text-center py-16">
            <div className="text-5xl mb-4">📐</div>
            <p className="text-lg font-semibold">Nenhum template ainda</p>
            <p className="text-sm text-gray-500 mt-2">Sprint 5 traz o editor visual.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {list.map((t) => (
              <div key={t.id} className="card hover:shadow-lg transition">
                <div className="aspect-video bg-gradient-to-br from-primary/10 to-accent/10 rounded-lg flex items-center justify-center text-5xl mb-3 border border-gray-100">
                  🏆
                </div>
                <div className="flex items-start justify-between gap-2">
                  <div className="font-bold flex-1">{t.name}</div>
                  <span className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded ${VERTICAL_COLORS[t.vertical ?? 'livre'] ?? 'bg-gray-100'}`}>
                    {t.vertical ?? 'livre'}
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-1 flex justify-between items-center">
                  <span>{t.isPublished ? '✓ Publicado' : '○ Rascunho'}</span>
                  <span className="font-mono">{t.id.slice(0, 16)}…</span>
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="text-xs text-gray-400 mt-6">
          Sprint 5 implementa editor visual Konva.js com drag-and-drop, upload de logo/fundo/assinatura, campos dinâmicos.
        </p>
      </div>
    </main>
  );
}
