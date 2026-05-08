// UniverCert · Configuração de integrações (Sprint 2)
// Mostra URLs de webhook por provider + permite gerar/copiar webhook secret.

import { eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { integrations } from '@/db/schema';
import IntegrationCard from './IntegrationCard';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

const PROVIDERS = [
  { id: 'fluent' as const, name: 'Fluent Community', emoji: '🌊', desc: 'Plugin WordPress que dispara quando aluno conclui curso.' },
  { id: 'hotmart' as const, name: 'Hotmart', emoji: '🔥', desc: 'Compra aprovada / produto entregue.' },
  { id: 'memberkit' as const, name: 'Memberkit', emoji: '📚', desc: 'Curso concluído na sua plataforma Memberkit.' },
  { id: 'kiwify' as const, name: 'Kiwify', emoji: '🥝', desc: 'Compra aprovada na Kiwify.' },
  { id: 'eduzz' as const, name: 'Eduzz', emoji: '🎓', desc: 'Pagamento aprovado na Eduzz.' },
  { id: 'hubla' as const, name: 'Hubla', emoji: '💬', desc: 'Assinatura ativada na Hubla.' },
];

export default async function IntegrationsPage() {
  const db = getDb();
  const workspaceId = 'ws_univerhair';
  const wsSlug = 'univerhair';

  const existing = await db
    .select()
    .from(integrations)
    .where(eq(integrations.workspaceId, workspaceId));

  const existingByProvider = new Map(existing.map((i) => [i.provider, i]));
  const baseUrl = 'https://univercert.com.br';

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-extrabold mb-2">Integrações</h1>
        <p className="text-sm text-gray-500 mb-6">
          Configure webhooks na sua plataforma de cursos para emissão automática.
        </p>

        <div className="space-y-3">
          {PROVIDERS.map((p) => {
            const existing = existingByProvider.get(p.id);
            return (
              <IntegrationCard
                key={p.id}
                provider={p.id}
                name={p.name}
                emoji={p.emoji}
                description={p.desc}
                webhookUrl={`${baseUrl}/api/webhooks/${p.id}?ws=${wsSlug}`}
                isActive={!!existing && existing.isActive === 1}
                hasSecret={!!existing?.webhookSecret}
              />
            );
          })}
        </div>
      </div>
    </main>
  );
}
