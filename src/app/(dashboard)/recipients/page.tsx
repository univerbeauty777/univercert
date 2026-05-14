// UniverCert · Recipients · Sprint 11 GODMODE

import { eq, desc, sql } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { getDb } from '@/db/client';
import { recipients } from '@/db/schema';
import PageHeader from '@/components/PageHeader';
import StatsBar from '@/components/StatsBar';
import EmptyState from '@/components/EmptyState';
import { getCurrentSession } from '@/lib/rbac';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export default async function RecipientsPage() {
  const sess = await getCurrentSession();
  if (!sess) redirect('/sign-in');
  const db = getDb();
  const workspaceId = sess.workspace.id;

  const list = await db
    .select({
      recipient: recipients,
      credentialCount: sql<number>`(SELECT COUNT(*) FROM credentials WHERE credentials.recipient_id = recipients.id)`,
    })
    .from(recipients)
    .where(eq(recipients.workspaceId, workspaceId))
    .orderBy(desc(recipients.createdAt))
    .limit(200);

  const total = list.length;
  const withCerts = list.filter(l => l.credentialCount > 0).length;
  const withWa = list.filter(l => l.recipient.phoneWhatsapp).length;
  const withConsent = list.filter(l => l.recipient.lgpdConsentAt).length;

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-6">
      <div className="max-w-7xl mx-auto">
        <PageHeader
          icon="👥"
          title="Alunos"
          subtitle={`${total.toLocaleString('pt-BR')} aluno${total !== 1 ? 's' : ''} cadastrado${total !== 1 ? 's' : ''}`}
          actions={<>
            <a href="/uh/solicitar" className="btn-secondary text-sm" target="_blank">Form público</a>
            <a href="/bulk" className="btn-primary text-sm">+ Importar CSV</a>
          </>}
        />

        <StatsBar stats={[
          { label: 'Total cadastrados', value: total.toLocaleString('pt-BR'), icon: '👥', tone: 'primary' },
          { label: 'Com certificado', value: withCerts.toLocaleString('pt-BR'), icon: '🏆', tone: 'success' },
          { label: 'Com WhatsApp', value: withWa.toLocaleString('pt-BR'), icon: '💬', tone: 'gold' },
          { label: 'Consentimento LGPD', value: withConsent.toLocaleString('pt-BR'), icon: '🔐', tone: 'primary' },
        ]} />

        {list.length === 0 ? (
          <EmptyState icon="👥" title="Nenhum aluno cadastrado"
            description="Eles aparecem quando alguém preenche o form público de solicitação ou via webhook das integrações."
            cta={{ label: 'Configurar integrações', href: '/integrations' }} />
        ) : (
          <div className="card !p-0 overflow-hidden animate-fade-in stagger-2">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50/50 text-[10px] uppercase tracking-widest text-ink-500 font-bold">
                  <tr>
                    <th className="px-4 py-3 text-left">Nome</th>
                    <th className="px-4 py-3 text-left">Email</th>
                    <th className="px-4 py-3 text-left">CPF</th>
                    <th className="px-4 py-3 text-left">WhatsApp</th>
                    <th className="px-4 py-3 text-center">Certs</th>
                    <th className="px-4 py-3 text-center">LGPD</th>
                    <th className="px-4 py-3 text-left">Cadastrado</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map(({ recipient: r, credentialCount }) => (
                    <tr key={r.id} className="border-t border-gray-100 hover:bg-primary-soft/40 transition">
                      <td className="px-4 py-3 font-bold text-ink-900">{r.name}</td>
                      <td className="px-4 py-3 text-ink-700 truncate max-w-[200px]">{r.email ?? '—'}</td>
                      <td className="px-4 py-3 font-mono text-xs text-ink-700">{r.cpf ?? '—'}</td>
                      <td className="px-4 py-3 text-xs text-ink-700">{r.phoneWhatsapp ?? '—'}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={credentialCount > 0 ? 'badge-success' : 'badge bg-gray-100 text-ink-500'}>{credentialCount}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {r.lgpdConsentAt ? <span className="text-success" title="Consentimento dado">✓</span> : <span className="text-ink-500/40" title="Sem consentimento">○</span>}
                      </td>
                      <td className="px-4 py-3 text-xs text-ink-500">{new Date(r.createdAt * 1000).toLocaleDateString('pt-BR')}</td>
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
