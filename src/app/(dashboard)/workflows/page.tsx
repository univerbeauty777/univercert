// UniverCert · Workflows · Sprint 17
// Listagem de templates email/WhatsApp customizados por trigger event

import { eq, desc } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { workflows, workspaces } from '@/db/schema';
import PageHeader from '@/components/PageHeader';
import StatsBar from '@/components/StatsBar';
import EmptyState from '@/components/EmptyState';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

const EVENT_LABELS: Record<string, { label: string; emoji: string }> = {
  'credential.issued': { label: 'Certificado emitido', emoji: '🏆' },
  'credential.revoked': { label: 'Certificado revogado', emoji: '⚠' },
  'request.created': { label: 'Solicitação criada', emoji: '📋' },
  'nps.d7': { label: 'NPS D+7', emoji: '💛' },
};

export default async function WorkflowsPage() {
  const db = getDb();
  const workspaceSlug = 'univerhair';

  const [ws] = await db.select().from(workspaces).where(eq(workspaces.slug, workspaceSlug)).limit(1);
  const list = ws
    ? await db.select().from(workflows).where(eq(workflows.workspaceId, ws.id)).orderBy(desc(workflows.updatedAt))
    : [];

  const total = list.length;
  const active = list.filter((w) => w.isActive).length;
  const emailCount = list.filter((w) => w.channel === 'email').length;
  const waCount = list.filter((w) => w.channel === 'whatsapp').length;

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-ink-900 py-8 px-6">
      <div className="max-w-7xl mx-auto">
        <PageHeader
          icon="📨"
          title="Workflows · email & WhatsApp"
          subtitle={`${total} ${total === 1 ? 'workflow' : 'workflows'} · ${active} ${active === 1 ? 'ativo' : 'ativos'} · personalize cada notificação que sai`}
          actions={
            <a href="/workflows/new" className="btn-gradient text-sm">
              ✏ Novo workflow
            </a>
          }
        />

        <StatsBar
          stats={[
            { label: 'Total workflows', value: total, icon: '📨', tone: 'primary' },
            { label: 'Ativos', value: active, icon: '✓', tone: 'success' },
            { label: 'Email', value: emailCount, icon: '📧', tone: 'gold' },
            { label: 'WhatsApp', value: waCount, icon: '💬', tone: 'success' },
          ]}
        />

        {list.length === 0 ? (
          <EmptyState
            icon="📨"
            title="Nenhum workflow custom ainda"
            description="Workflows substituem os textos padrão de email/WhatsApp por templates personalizados com variáveis dinâmicas. Comece com um dos triggers abaixo:"
            cta={{ label: 'Criar primeiro workflow', href: '/workflows/new' }}
          />
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {list.map((w) => {
              const ev = EVENT_LABELS[w.triggerEvent] ?? { label: w.triggerEvent, emoji: '◯' };
              return (
                <a
                  key={w.id}
                  href={`/workflows/${w.id}`}
                  className="card-hover relative animate-slide-up"
                >
                  {!w.isActive && (
                    <div className="absolute top-3 right-3 px-2.5 py-1 bg-gray-200 dark:bg-ink-700 text-ink-500 text-[10px] font-bold uppercase tracking-widest rounded-full">
                      Pausado
                    </div>
                  )}
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${
                      w.channel === 'email' ? 'bg-gold/10 text-amber-700' : 'bg-success/10 text-success'
                    }`}>
                      {w.channel === 'email' ? '📧' : '💬'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs">{ev.emoji}</span>
                        <span className="text-[10px] uppercase tracking-widest text-ink-500 font-bold">
                          {ev.label}
                        </span>
                      </div>
                      <h3 className="font-bold text-base tracking-tight truncate">{w.name}</h3>
                      {w.subject && (
                        <p className="text-xs text-ink-500 mt-1 truncate">📋 {w.subject}</p>
                      )}
                      {w.delaySeconds > 0 && (
                        <p className="text-[10px] text-ink-500 mt-1">⏱ Delay: {Math.round(w.delaySeconds / 60)}min</p>
                      )}
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        )}

        {/* Triggers disponíveis quando vazio */}
        {list.length === 0 && (
          <div className="grid md:grid-cols-2 gap-3 mt-6">
            {Object.entries(EVENT_LABELS).map(([k, v]) => (
              <a key={k} href={`/workflows/new?event=${k}`} className="card-hover !p-4 flex items-center gap-3">
                <span className="text-2xl">{v.emoji}</span>
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-ink-500 font-bold">Trigger</div>
                  <div className="font-bold text-sm">{v.label}</div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
