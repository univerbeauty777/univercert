// UniverCert · dashboard · Sprint 11 GODMODE

import { eq, count, and, sql } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { credentials, certificateRequests, verifyLogs } from '@/db/schema';
import PageHeader from '@/components/PageHeader';
import StatsBar from '@/components/StatsBar';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const db = getDb();
  const workspaceId = 'ws_univerhair';

  const [emitted] = await db.select({ value: count() }).from(credentials).where(eq(credentials.workspaceId, workspaceId));
  const [pending] = await db.select({ value: count() }).from(certificateRequests)
    .where(and(eq(certificateRequests.workspaceId, workspaceId), eq(certificateRequests.status, 'pending')));
  const [emittedToday] = await db.select({ value: count() }).from(credentials)
    .where(and(eq(credentials.workspaceId, workspaceId), sql`${credentials.issuedAt} >= ${Math.floor(Date.now() / 1000) - 24 * 3600}`));
  const [verifyCount] = await db.select({ value: count() }).from(verifyLogs)
    .leftJoin(credentials, eq(verifyLogs.credentialId, credentials.id))
    .where(eq(credentials.workspaceId, workspaceId));

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-6">
      <div className="max-w-7xl mx-auto">
        <PageHeader
          icon="📊"
          title="Visão geral"
          subtitle={`UniverHair · ${(emitted?.value ?? 0).toLocaleString('pt-BR')} certificados emitidos`}
          actions={
            <>
              <a href="/queue" className="btn-secondary text-sm">Ver fila ({pending?.value ?? 0})</a>
              <a href="/credentials" className="btn-primary text-sm">Emitir manual</a>
            </>
          }
        />

        <StatsBar stats={[
          { label: 'Total emitidos', value: (emitted?.value ?? 0).toLocaleString('pt-BR'), icon: '🏆', tone: 'primary', hint: 'desde o início' },
          { label: 'Hoje', value: (emittedToday?.value ?? 0).toLocaleString('pt-BR'), icon: '⚡', tone: 'success', hint: 'últimas 24h' },
          { label: 'Na fila', value: (pending?.value ?? 0).toLocaleString('pt-BR'), icon: '📋', tone: 'warning', hint: (pending?.value ?? 0) > 0 ? 'aprovar' : 'limpa' },
          { label: 'Verificações', value: (verifyCount?.value ?? 0).toLocaleString('pt-BR'), icon: '👁', tone: 'gold', hint: 'views totais' },
        ]} />

        <div className="grid md:grid-cols-3 gap-4">
          <div className="md:col-span-2 card animate-slide-up stagger-2">
            <h2 className="font-bold mb-4 tracking-tight flex items-center gap-2"><span className="text-success">✓</span> Próximos passos</h2>
            <ul className="space-y-1">
              <Step href="/integrations">Configurar integrações Fluent / Hotmart / Memberkit</Step>
              <Step href="/queue">Aprovar requests pendentes</Step>
              <Step href="/bulk">Importar alunos antigos via CSV</Step>
              <Step href="/templates">Personalizar templates de certificado</Step>
              <Step href="/domain">Configurar domínio próprio</Step>
              <Step href="/billing">Revisar plano e billing</Step>
            </ul>
          </div>
          <div className="card animate-slide-up stagger-3 bg-gradient-to-br from-primary-soft via-white to-accent/5 border-primary/20">
            <div className="text-[10px] uppercase tracking-widest text-primary font-bold mb-2">💡 Dica</div>
            <h3 className="font-display text-lg font-semibold mb-2 tracking-tight">Conecte WhatsApp pra triplicar engajamento</h3>
            <p className="text-xs text-ink-500 mb-4 leading-relaxed">
              Aluno que recebe certificado no Zap visualiza 4× mais que por email. Configure em <a href="/integrations" className="text-primary font-bold">Integrações</a> em 2 minutos.
            </p>
            <a href="/integrations" className="btn-primary text-xs px-4 py-2">Configurar agora →</a>
          </div>
        </div>
      </div>
    </main>
  );
}

function Step({ children, href }: { children: React.ReactNode; href: string }) {
  return (
    <li>
      <a href={href} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-primary-soft/50 group transition">
        <span className="w-6 h-6 rounded-lg bg-gray-100 group-hover:bg-primary group-hover:text-white text-ink-500 text-xs font-bold flex items-center justify-center transition">→</span>
        <span className="text-sm text-ink-700 group-hover:text-primary transition flex-1 font-medium">{children}</span>
      </a>
    </li>
  );
}
