// UniverCert · Credentials list · Sprint 11 GODMODE

import { eq, desc } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { getDb } from '@/db/client';
import { credentials, recipients } from '@/db/schema';
import PageHeader from '@/components/PageHeader';
import StatsBar from '@/components/StatsBar';
import EmptyState from '@/components/EmptyState';
import { getCurrentSession } from '@/lib/rbac';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export default async function CredentialsPage() {
  const sess = await getCurrentSession();
  if (!sess) redirect('/sign-in');
  const db = getDb();
  const workspaceId = sess.workspace.id;
  const now = Math.floor(Date.now() / 1000);

  const list = await db
    .select({ credential: credentials, recipient: recipients })
    .from(credentials)
    .leftJoin(recipients, eq(credentials.recipientId, recipients.id))
    .where(eq(credentials.workspaceId, workspaceId))
    .orderBy(desc(credentials.issuedAt))
    .limit(200);

  const total = list.length;
  const active = list.filter(l => !l.credential.revokedAt && (!l.credential.expiresAt || l.credential.expiresAt >= now)).length;
  const revoked = list.filter(l => l.credential.revokedAt).length;
  const last7d = list.filter(l => l.credential.issuedAt >= now - 7 * 24 * 3600).length;

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-6">
      <div className="max-w-7xl mx-auto">
        <PageHeader
          icon="🏆"
          title="Certificados"
          subtitle={`${total.toLocaleString('pt-BR')} certificado${total !== 1 ? 's' : ''} ${total !== 1 ? 'emitidos' : 'emitido'}`}
          actions={<>
            <a href="/queue" className="btn-secondary text-sm">Ver fila</a>
            <a href="/bulk" className="btn-primary text-sm">+ Bulk emit</a>
          </>}
        />

        <StatsBar stats={[
          { label: 'Total emitidos', value: total.toLocaleString('pt-BR'), icon: '🏆', tone: 'primary' },
          { label: 'Ativos', value: active.toLocaleString('pt-BR'), icon: '✓', tone: 'success' },
          { label: 'Últimos 7 dias', value: last7d.toLocaleString('pt-BR'), icon: '⚡', tone: 'gold' },
          { label: 'Revogados', value: revoked.toLocaleString('pt-BR'), icon: '✗', tone: 'danger' },
        ]} />

        {list.length === 0 ? (
          <EmptyState icon="🏆" title="Nenhum certificado emitido ainda"
            description="Aprove requests da fila ou use bulk emit pra começar a emitir."
            cta={{ label: 'Ver fila de aprovação', href: '/queue' }} />
        ) : (
          <div className="card !p-0 overflow-hidden animate-fade-in stagger-2">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50/50 text-[10px] uppercase tracking-widest text-ink-500 font-bold">
                  <tr>
                    <th className="px-4 py-3 text-left">Aluno</th>
                    <th className="px-4 py-3 text-left">Curso</th>
                    <th className="px-4 py-3 text-center">Carga</th>
                    <th className="px-4 py-3 text-left">Emitido</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-left">Hash</th>
                    <th className="px-4 py-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map(({ credential: c, recipient: r }) => {
                    const isRevoked = c.revokedAt !== null;
                    const isExpired = c.expiresAt && c.expiresAt < now;
                    const status = isRevoked ? 'Revogado' : isExpired ? 'Expirado' : 'Ativo';
                    const cls = isRevoked ? 'badge-danger' : isExpired ? 'badge-warning' : 'badge-success';
                    return (
                      <tr key={c.id} className="border-t border-gray-100 hover:bg-primary-soft/40 transition">
                        <td className="px-4 py-3">
                          <div className="font-bold text-ink-900">{r?.name ?? '—'}</div>
                          <div className="text-xs text-ink-500">{r?.email ?? '—'}</div>
                        </td>
                        <td className="px-4 py-3 text-ink-700 font-medium">{c.courseName}</td>
                        <td className="px-4 py-3 text-center text-ink-700 font-semibold">{c.courseHours ?? '—'}h</td>
                        <td className="px-4 py-3 text-xs text-ink-500">{new Date(c.issuedAt * 1000).toLocaleDateString('pt-BR')}</td>
                        <td className="px-4 py-3 text-center"><span className={cls}>{status}</span></td>
                        <td className="px-4 py-3"><span className="text-[10px] font-mono text-ink-500/70 select-all">{c.hashSha256.slice(0, 10)}…</span></td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <a href={`/v/${c.id}`} target="_blank" rel="noopener" className="text-primary text-xs font-bold hover:underline mr-3">Verify</a>
                          <a href={`/api/v1/credentials/${c.id}/pdf`} target="_blank" rel="noopener" className="text-primary text-xs font-bold hover:underline">PDF</a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
