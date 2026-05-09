// UniverCert · Dashboard shell GODMODE 2.0 — sidebar fixa colapsável

import { eq, and, count } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { workspaces, certificateRequests } from '@/db/schema';
import Sidebar from '@/components/Sidebar';

export const runtime = 'edge';

async function getShellData() {
  try {
    const db = getDb();
    const slug = 'univerhair';
    const [ws] = await db.select().from(workspaces).where(eq(workspaces.slug, slug)).limit(1);
    if (!ws) return { workspaceName: 'UniverCert', pendingCount: 0 };
    const [pending] = await db
      .select({ value: count() })
      .from(certificateRequests)
      .where(and(eq(certificateRequests.workspaceId, ws.id), eq(certificateRequests.status, 'pending')));
    return { workspaceName: ws.name, pendingCount: pending?.value ?? 0 };
  } catch {
    return { workspaceName: 'UniverCert', pendingCount: 0 };
  }
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { workspaceName, pendingCount } = await getShellData();
  return (
    <div className="min-h-screen bg-[rgb(var(--bg))] text-[rgb(var(--fg))]">
      <Sidebar workspaceName={workspaceName} pendingCount={pendingCount} />
      <div className="with-sidebar min-h-screen flex flex-col" id="uc-main">
        {children}
      </div>
      {/* Sincroniza padding-left do main com estado collapsed da sidebar */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            (function(){
              try {
                var collapsed = localStorage.getItem('uc_sidebar_collapsed') === '1';
                var main = document.getElementById('uc-main');
                if (main && collapsed) main.classList.add('collapsed');
                document.documentElement.classList.toggle('sidebar-collapsed', collapsed);
              } catch(e){}
            })();
          `,
        }}
      />
      <style
        dangerouslySetInnerHTML={{
          __html: `html.sidebar-collapsed #uc-main { padding-left: var(--sidebar-collapsed-w); }`,
        }}
      />
    </div>
  );
}
