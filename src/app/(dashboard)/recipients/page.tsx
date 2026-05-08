// UniverCert · lista de recipients (alunos) do workspace

import { eq, desc } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { recipients, credentials } from '@/db/schema';
import { sql } from 'drizzle-orm';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export default async function RecipientsPage() {
  const db = getDb();
  const workspaceId = 'ws_univerhair';

  const list = await db
    .select({
      recipient: recipients,
      credentialCount: sql<number>`(SELECT COUNT(*) FROM credentials WHERE credentials.recipient_id = recipients.id)`,
    })
    .from(recipients)
    .where(eq(recipients.workspaceId, workspaceId))
    .orderBy(desc(recipients.createdAt))
    .limit(200);

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-extrabold">Alunos</h1>
            <p className="text-sm text-gray-500 mt-1">
              {list.length} recipient{list.length !== 1 ? 's' : ''} cadastrado{list.length !== 1 ? 's' : ''}
            </p>
          </div>
          <a href="/bulk" className="btn-primary text-sm">
            + Importar CSV
          </a>
        </div>

        {list.length === 0 ? (
          <div className="card text-center py-16">
            <div className="text-5xl mb-4">👥</div>
            <p className="text-lg font-semibold">Nenhum aluno ainda</p>
            <p className="text-sm text-gray-500 mt-2">
              Eles aparecem quando alguém preenche o form de solicitação ou via webhook das suas integrações.
            </p>
          </div>
        ) : (
          <div className="card p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="px-4 py-3 text-left">Nome</th>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-left">CPF</th>
                  <th className="px-4 py-3 text-left">WhatsApp</th>
                  <th className="px-4 py-3 text-center">Certificados</th>
                  <th className="px-4 py-3 text-left">Cadastrado</th>
                </tr>
              </thead>
              <tbody>
                {list.map(({ recipient: r, credentialCount }) => (
                  <tr key={r.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 font-semibold">{r.name}</td>
                    <td className="px-4 py-3 text-gray-600">{r.email ?? '—'}</td>
                    <td className="px-4 py-3 font-mono text-xs">{r.cpf ?? '—'}</td>
                    <td className="px-4 py-3 text-xs">{r.phoneWhatsapp ?? '—'}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${credentialCount > 0 ? 'bg-success/10 text-success' : 'bg-gray-100 text-gray-500'}`}>
                        {credentialCount}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {new Date(r.createdAt * 1000).toLocaleDateString('pt-BR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
