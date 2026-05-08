// UniverCert · Billing page

import { eq, desc } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { workspaces } from '@/db/schema';
import { sql } from 'drizzle-orm';
import BillingPlans from './BillingPlans';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export default async function BillingPage() {
  const db = getDb();
  const workspaceId = 'ws_univerhair';

  const [ws] = await db.select().from(workspaces).where(eq(workspaces.id, workspaceId)).limit(1);
  const currentPlan = ws?.plan ?? 'free';

  // Fetch últimos 10 payments
  const recentPayments = await db.run(
    sql`SELECT id, plan, amount_cents, status, payment_method, paid_at, created_at FROM payments WHERE workspace_id = ${workspaceId} ORDER BY created_at DESC LIMIT 10`,
  );

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-extrabold mb-2">Billing</h1>
        <p className="text-sm text-gray-500 mb-6">
          Plano atual: <span className="font-bold uppercase text-primary">{currentPlan}</span>
        </p>

        <BillingPlans currentPlan={currentPlan} workspaceId={workspaceId} />

        {recentPayments.results && recentPayments.results.length > 0 && (
          <div className="mt-8 card p-0 overflow-hidden">
            <h2 className="font-bold p-4 border-b border-gray-100">Histórico de pagamentos</h2>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="px-4 py-3 text-left">Data</th>
                  <th className="px-4 py-3 text-left">Plano</th>
                  <th className="px-4 py-3 text-right">Valor</th>
                  <th className="px-4 py-3 text-left">Método</th>
                  <th className="px-4 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {(recentPayments.results as any[]).map((p, i) => (
                  <tr key={i} className="border-t border-gray-100">
                    <td className="px-4 py-3 text-xs">
                      {new Date((p.created_at as number) * 1000).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-4 py-3 uppercase font-semibold">{p.plan}</td>
                    <td className="px-4 py-3 text-right font-mono">
                      R$ {((p.amount_cents as number) / 100).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-xs">{p.payment_method ?? '—'}</td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs font-bold ${
                          p.status === 'approved'
                            ? 'bg-success/10 text-success'
                            : p.status === 'pending'
                            ? 'bg-warning/10 text-warning'
                            : 'bg-danger/10 text-danger'
                        }`}
                      >
                        {p.status}
                      </span>
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
