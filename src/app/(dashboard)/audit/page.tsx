// UniverCert · audit log

import { eq, desc } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { auditLogs, users } from '@/db/schema';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export default async function AuditPage() {
  const db = getDb();
  const workspaceId = 'ws_univerhair';

  const list = await db
    .select({ log: auditLogs, user: users })
    .from(auditLogs)
    .leftJoin(users, eq(auditLogs.userId, users.id))
    .where(eq(auditLogs.workspaceId, workspaceId))
    .orderBy(desc(auditLogs.createdAt))
    .limit(200);

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-extrabold mb-2">Audit log</h1>
        <p className="text-sm text-gray-500 mb-6">Histórico de ações no workspace</p>

        {list.length === 0 ? (
          <div className="card text-center py-16">
            <div className="text-5xl mb-4">📋</div>
            <p className="text-lg font-semibold">Nenhuma ação registrada ainda</p>
            <p className="text-sm text-gray-500 mt-2">
              Sprint 5 vai registrar todas as ações administrativas (aprovações, edições, etc).
            </p>
          </div>
        ) : (
          <div className="card p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="px-4 py-3 text-left">Quando</th>
                  <th className="px-4 py-3 text-left">Quem</th>
                  <th className="px-4 py-3 text-left">Ação</th>
                  <th className="px-4 py-3 text-left">Entidade</th>
                  <th className="px-4 py-3 text-left">IP</th>
                </tr>
              </thead>
              <tbody>
                {list.map(({ log, user }) => (
                  <tr key={log.id} className="border-t border-gray-100">
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {new Date(log.createdAt * 1000).toLocaleString('pt-BR')}
                    </td>
                    <td className="px-4 py-3">{user?.name ?? user?.email ?? 'sistema'}</td>
                    <td className="px-4 py-3 font-mono text-xs">{log.action}</td>
                    <td className="px-4 py-3 text-xs">
                      {log.entityType && <span className="text-gray-500">{log.entityType}/</span>}
                      <span className="font-mono">{log.entityId ?? '—'}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{log.ip ?? '—'}</td>
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
