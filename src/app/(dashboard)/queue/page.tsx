// UniverCert · fila de aprovação (Sprint 3 implementa aprovação real)

import { eq, and, desc } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { certificateRequests, recipients } from '@/db/schema';

export const runtime = 'edge';

export default async function QueuePage() {
  const db = getDb();
  const workspaceId = 'ws_univerhair'; // TODO Sprint 1: pegar do session

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
        <h1 className="text-2xl font-extrabold mb-6">Fila de aprovação</h1>

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
                  <tr key={request.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-semibold">{recipient?.name}</div>
                      <div className="text-xs text-gray-500">{recipient?.email}</div>
                    </td>
                    <td className="px-4 py-3">{request.courseName}</td>
                    <td className="px-4 py-3 text-xs">
                      <span className="inline-block px-2 py-1 bg-primary/10 text-primary rounded font-bold uppercase">
                        {request.source}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {new Date(request.createdAt * 1000).toLocaleString('pt-BR')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button className="btn-primary text-xs px-3 py-1.5">Aprovar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="text-xs text-gray-400 mt-4">
          Sprint 3: aprovação real, rejeição com motivo, aprovação em massa.
        </p>
      </div>
    </main>
  );
}
