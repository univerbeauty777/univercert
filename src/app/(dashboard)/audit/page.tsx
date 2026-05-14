// UniverCert · Audit log · Sprint 11 GODMODE

import { eq, desc } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { getDb } from '@/db/client';
import { auditLogs, users } from '@/db/schema';
import PageHeader from '@/components/PageHeader';
import EmptyState from '@/components/EmptyState';
import { getCurrentSession } from '@/lib/rbac';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

const ACTION_BADGE: Record<string, string> = {
  'request.approve': 'badge-success',
  'request.reject': 'badge-danger',
  'credential.revoke': 'badge-danger',
  'credential.issue': 'badge-success',
  'webhook.received': 'badge-primary',
};

export default async function AuditPage() {
  const sess = await getCurrentSession();
  if (!sess) redirect('/sign-in');
  const db = getDb();
  const workspaceId = sess.workspace.id;

  const list = await db
    .select({ log: auditLogs, user: users })
    .from(auditLogs)
    .leftJoin(users, eq(auditLogs.userId, users.id))
    .where(eq(auditLogs.workspaceId, workspaceId))
    .orderBy(desc(auditLogs.createdAt))
    .limit(200);

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-6">
      <div className="max-w-7xl mx-auto">
        <PageHeader icon="📋" title="Audit log"
          subtitle={`${list.length} ${list.length === 1 ? 'evento registrado' : 'eventos registrados'} · histórico imutável`} />

        {list.length === 0 ? (
          <EmptyState icon="📋" title="Audit log vazio"
            description="Quando você aprovar requests, revogar certificados ou receber webhooks, os eventos aparecem aqui — todos com IP e timestamp." />
        ) : (
          <div className="card !p-0 overflow-hidden animate-fade-in">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50/50 text-[10px] uppercase tracking-widest text-ink-500 font-bold">
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
                    <tr key={log.id} className="border-t border-gray-100 hover:bg-primary-soft/40 transition">
                      <td className="px-4 py-3 text-xs text-ink-500 whitespace-nowrap">{new Date(log.createdAt * 1000).toLocaleString('pt-BR')}</td>
                      <td className="px-4 py-3 font-medium text-ink-900">{user?.name ?? user?.email ?? '🤖 sistema'}</td>
                      <td className="px-4 py-3"><span className={ACTION_BADGE[log.action] ?? 'badge bg-gray-100 text-ink-700'}>{log.action}</span></td>
                      <td className="px-4 py-3 text-xs">
                        {log.entityType && <span className="text-ink-500 font-mono">{log.entityType}/</span>}
                        <span className="font-mono text-ink-700">{log.entityId?.slice(0, 16) ?? '—'}</span>
                      </td>
                      <td className="px-4 py-3 text-xs font-mono text-ink-500">{log.ip ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
