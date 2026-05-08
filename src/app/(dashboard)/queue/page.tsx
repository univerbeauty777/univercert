// UniverCert · fila de aprovação (Sprint 1 — aprovação real funcional)

import { eq, and, desc } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { certificateRequests, recipients } from '@/db/schema';
import QueueRow from './QueueRow';

export const runtime = 'edge';
export const dynamic = 'force-dynamic'; // sempre fresco — fila muda direto

export default async function QueuePage() {
  const db = getDb();
  const workspaceId = 'ws_univerhair'; // TODO Sprint 1.5: pegar do session

  const pending = await db
    .select({
      request: certificateRequests,
      recipient: recipients,
    })
    .from(certificateRequests)
    .leftJoin(recipients, eq(certificateRequests.recipientId, recipients.id))
    .where(and(eq(certificateRequests.workspaceId, workspaceId), eq(certificateRequests.status, 'pending')))
    .orderBy(desc(certificateRequests.createdAt))
    .limit(50);

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-extrabold">Fila de aprovação</h1>
            <p className="text-sm text-gray-500 mt-1">
              {pending.length} solicitação{pending.length !== 1 ? 'ões' : ''} aguardando
            </p>
          </div>
        </div>

        {pending.length === 0 ? (
          <div className="card text-center py-16">
            <div className="text-5xl mb-4">📭</div>
            <p className="text-lg font-semibold">Nenhuma solicitação pendente</p>
            <p className="text-sm text-gray-500 mt-2">
              Quando alunos completarem cursos no Fluent Community ou enviarem o form, vão aparecer aqui.
            </p>
          </div>
        ) : (
          <div className="card overflow-hidden p-0">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="px-4 py-3 text-left">Aluno</th>
                  <th className="px-4 py-3 text-left">Curso</th>
                  <th className="px-4 py-3 text-left">Origem</th>
                  <th className="px-4 py-3 text-left">Solicitado</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {pending.map(({ request, recipient }) => (
                  <QueueRow
                    key={request.id}
                    request={{
                      id: request.id,
                      courseName: request.courseName,
                      source: request.source,
                      createdAt: request.createdAt,
                    }}
                    recipient={recipient}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="text-xs text-gray-400 mt-4">
          Sprint 1 ✓ aprovação cria credential com hash SHA-256 · Sprint 1.5 implementa render PDF + email/WhatsApp.
        </p>
      </div>
    </main>
  );
}
