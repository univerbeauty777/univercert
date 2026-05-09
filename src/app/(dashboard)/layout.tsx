// UniverCert · Dashboard shell GODMODE 2.0 — sidebar fixa colapsável + multi-workspace (S23)

import { eq, and, count } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { certificateRequests } from '@/db/schema';
import Sidebar from '@/components/Sidebar';
import { getCurrentSession, listMyWorkspaces } from '@/lib/rbac';

export const runtime = 'edge';

async function getShellData() {
  try {
    const sess = await getCurrentSession();
    if (!sess) return { workspaceName: 'UniverCert', pendingCount: 0, workspaces: [], current: null };

    const memberships = await listMyWorkspaces();
    const db = getDb();
    const [pending] = await db
      .select({ value: count() })
      .from(certificateRequests)
      .where(and(eq(certificateRequests.workspaceId, sess.workspace.id), eq(certificateRequests.status, 'pending')));

    return {
      workspaceName: sess.workspace.name,
      pendingCount: pending?.value ?? 0,
      workspaces: memberships,
      current: { id: sess.workspace.id, slug: sess.workspace.slug, name: sess.workspace.name, role: sess.member.role },
    };
  } catch {
    return { workspaceName: 'UniverCert', pendingCount: 0, workspaces: [], current: null };
  }
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { workspaceName, pendingCount, workspaces, current } = await getShellData();
  return (
    <div className="min-h-screen bg-[rgb(var(--bg))] text-[rgb(var(--fg))]">
      <Sidebar
        workspaceName={workspaceName}
        pendingCount={pendingCount}
        currentWorkspace={current ?? undefined}
        workspaces={workspaces}
      />
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
