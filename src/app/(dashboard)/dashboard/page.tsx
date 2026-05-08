// UniverCert · dashboard com analytics básico

import { eq, count, and, sql } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { credentials, certificateRequests, verifyLogs } from '@/db/schema';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const db = getDb();
  const workspaceId = 'ws_univerhair';

  const [emitted] = await db
    .select({ value: count() })
    .from(credentials)
    .where(eq(credentials.workspaceId, workspaceId));
  const [pending] = await db
    .select({ value: count() })
    .from(certificateRequests)
    .where(and(eq(certificateRequests.workspaceId, workspaceId), eq(certificateRequests.status, 'pending')));
  const [emittedToday] = await db
    .select({ value: count() })
    .from(credentials)
    .where(
      and(
        eq(credentials.workspaceId, workspaceId),
        sql`${credentials.issuedAt} >= ${Math.floor(Date.now() / 1000) - 24 * 3600}`,
      ),
    );

  // Top recent verify views (proxy de "alunos compartilharam")
  const [verifyCount] = await db
    .select({ value: count() })
    .from(verifyLogs)
    .leftJoin(credentials, eq(verifyLogs.credentialId, credentials.id))
    .where(eq(credentials.workspaceId, workspaceId));

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-extrabold mb-6">Dashboard · UniverHair</h1>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Stat label="Total emitidos" value={emitted?.value ?? 0} color="primary" />
          <Stat label="Hoje" value={emittedToday?.value ?? 0} color="success" />
          <Stat label="Na fila" value={pending?.value ?? 0} color="warning" highlight={(pending?.value ?? 0) > 0} />
          <Stat label="Verificações totais" value={verifyCount?.value ?? 0} color="accent" />
        </div>

        <div className="card">
          <h2 className="font-bold mb-3">Próximos passos</h2>
          <ul className="space-y-2 text-sm">
            <Step done href="/integrations">Configurar integrações Fluent / Hotmart / Memberkit</Step>
            <Step done href="/queue">Aprovar requests pendentes</Step>
            <Step done href="/bulk">Importar alunos antigos via CSV</Step>
            <Step done href="/templates">Personalizar templates de certificado</Step>
          </ul>
        </div>
      </div>
    </main>
  );
}

function Stat({ label, value, color, highlight }: { label: string; value: number; color: string; highlight?: boolean }) {
  const colorClass: Record<string, string> = {
    primary: 'text-primary',
    success: 'text-success',
    warning: 'text-warning',
    accent: 'text-accent',
  };
  return (
    <div className={`card ${highlight ? 'ring-2 ring-warning/50' : ''}`}>
      <div className="text-xs uppercase tracking-wider text-gray-400 font-bold">{label}</div>
      <div className={`text-3xl font-extrabold mt-1 ${colorClass[color] ?? ''}`}>{value.toLocaleString('pt-BR')}</div>
    </div>
  );
}

function Step({ children, done, href }: { children: React.ReactNode; done?: boolean; href: string }) {
  return (
    <li>
      <a href={href} className="flex items-center gap-2 hover:bg-gray-50 -mx-2 px-2 py-1 rounded">
        <span className={done ? 'text-success' : 'text-gray-400'}>{done ? '→' : '○'}</span>
        <span className="text-primary underline">{children}</span>
      </a>
    </li>
  );
}
