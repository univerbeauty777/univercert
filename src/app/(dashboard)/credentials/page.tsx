// UniverCert · lista de credenciais emitidas

import { eq, desc } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { credentials, recipients } from '@/db/schema';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export default async function CredentialsPage() {
  const db = getDb();
  const workspaceId = 'ws_univerhair';

  const list = await db
    .select({
      credential: credentials,
      recipient: recipients,
    })
    .from(credentials)
    .leftJoin(recipients, eq(credentials.recipientId, recipients.id))
    .where(eq(credentials.workspaceId, workspaceId))
    .orderBy(desc(credentials.issuedAt))
    .limit(200);

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-extrabold">Certificados emitidos</h1>
            <p className="text-sm text-gray-500 mt-1">
              {list.length} certificado{list.length !== 1 ? 's' : ''} {list.length !== 1 ? 'emitidos' : 'emitido'}
            </p>
          </div>
        </div>

        {list.length === 0 ? (
          <div className="card text-center py-16">
            <div className="text-5xl mb-4">🏆</div>
            <p className="text-lg font-semibold">Nenhum certificado emitido ainda</p>
            <p className="text-sm text-gray-500 mt-2">
              Aprove requests da fila ou use bulk emit pra começar.
            </p>
          </div>
        ) : (
          <div className="card p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="px-4 py-3 text-left">Aluno</th>
                  <th className="px-4 py-3 text-left">Curso</th>
                  <th className="px-4 py-3 text-center">CH</th>
                  <th className="px-4 py-3 text-left">Emitido</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {list.map(({ credential: c, recipient: r }) => {
                  const isRevoked = c.revokedAt !== null;
                  const isExpired = c.expiresAt && c.expiresAt < Math.floor(Date.now() / 1000);
                  const status = isRevoked ? 'Revogado' : isExpired ? 'Expirado' : 'Ativo';
                  const statusClass = isRevoked
                    ? 'bg-danger/10 text-danger'
                    : isExpired
                    ? 'bg-warning/10 text-warning'
                    : 'bg-success/10 text-success';

                  return (
                    <tr key={c.id} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-semibold">{r?.name ?? '—'}</div>
                        <div className="text-xs text-gray-500">{r?.email ?? '—'}</div>
                      </td>
                      <td className="px-4 py-3">{c.courseName}</td>
                      <td className="px-4 py-3 text-center">{c.courseHours ?? '—'}h</td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {new Date(c.issuedAt * 1000).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${statusClass}`}>
                          {status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <a
                          href={`/v/${c.id}`}
                          target="_blank"
                          rel="noopener"
                          className="text-primary text-xs font-semibold hover:underline mr-3"
                        >
                          Verify
                        </a>
                        <a
                          href={`/api/v1/credentials/${c.id}/pdf`}
                          target="_blank"
                          rel="noopener"
                          className="text-primary text-xs font-semibold hover:underline"
                        >
                          PDF
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
