// UniverCert · Custom domain wizard

import { eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { workspaces } from '@/db/schema';
import DomainWizard from './DomainWizard';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export default async function DomainPage() {
  const db = getDb();
  const workspaceId = 'ws_univerhair';
  const [ws] = await db.select().from(workspaces).where(eq(workspaces.id, workspaceId)).limit(1);

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-extrabold mb-2">Domínio próprio</h1>
        <p className="text-sm text-gray-500 mb-6">
          Configure <code className="text-primary">cert.suaescola.com.br</code> para servir os certificados
          com sua marca completa.
        </p>

        <DomainWizard
          workspaceId={workspaceId}
          currentDomain={ws?.customDomain ?? null}
          fallbackHost="univercert.pages.dev"
        />

        <div className="mt-8 card text-sm text-gray-600">
          <h3 className="font-bold text-gray-900 mb-2">Como funciona</h3>
          <ol className="list-decimal list-inside space-y-2">
            <li>Você adiciona <code>cert.suaescola.com.br</code> abaixo</li>
            <li>Criamos o custom hostname no Cloudflare for SaaS automaticamente</li>
            <li>Você cria um <strong>CNAME</strong> no DNS apontando para <code>univercert.pages.dev</code></li>
            <li>Cloudflare emite SSL automático (Let's Encrypt) em segundos</li>
            <li>Suas verify pages, emails e branding aparecem com sua marca</li>
          </ol>
          <p className="text-xs text-gray-400 mt-3">
            Disponível a partir do plano <strong>Pro (R$ 297/mês)</strong>.
          </p>
        </div>
      </div>
    </main>
  );
}
