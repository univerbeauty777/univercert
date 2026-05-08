// UniverCert · dashboard placeholder (Sprint 5 implementa analytics rico)

import { eq, count } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { credentials, certificateRequests } from '@/db/schema';

export const runtime = 'edge';

export default async function DashboardPage() {
  const db = getDb();
  // TODO Sprint 1: pegar workspace do session/auth
  const workspaceId = 'ws_univerhair';

  const [emitted] = await db
    .select({ value: count() })
    .from(credentials)
    .where(eq(credentials.workspaceId, workspaceId));
  const [pending] = await db
    .select({ value: count() })
    .from(certificateRequests)
    .where(eq(certificateRequests.workspaceId, workspaceId));

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-extrabold mb-6">Dashboard · UniverHair</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card">
            <div className="text-xs uppercase tracking-wider text-gray-400 font-bold">
              Certificados emitidos
            </div>
            <div className="text-3xl font-extrabold mt-1">{emitted?.value ?? 0}</div>
          </div>
          <div className="card">
            <div className="text-xs uppercase tracking-wider text-gray-400 font-bold">
              Na fila de aprovação
            </div>
            <div className="text-3xl font-extrabold mt-1 text-warning">{pending?.value ?? 0}</div>
          </div>
          <div className="card">
            <div className="text-xs uppercase tracking-wider text-gray-400 font-bold">
              Próximos passos
            </div>
            <div className="text-sm mt-1">
              Sprint 1 implementa o editor de templates. Vá em{' '}
              <a href="/queue" className="text-primary underline">
                fila
              </a>{' '}
              ou{' '}
              <a href="/templates" className="text-primary underline">
                templates
              </a>
              .
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
