// UniverCert · Embed widget /embed/student/[email]
// Iframe-friendly, sem auth (publico). Mostra certs do aluno (workspace especifico via ?ws=slug).
// Usado pelo shortcode WP [univercert_certificates].

import { eq, and, desc } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { credentials, recipients, workspaces } from '@/db/schema';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

type Search = { ws?: string; limit?: string; theme?: 'light' | 'dark' };

export default async function EmbedStudentPage({
  params,
  searchParams,
}: {
  params: Promise<{ email: string }>;
  searchParams: Promise<Search>;
}) {
  const { email: emailRaw } = await params;
  const sp = await searchParams;
  const email = decodeURIComponent(emailRaw).toLowerCase().trim();
  const wsSlug = sp.ws?.toLowerCase().trim();
  const limit = Math.min(50, Math.max(1, parseInt(sp.limit ?? '20', 10) || 20));
  const theme = sp.theme === 'dark' ? 'dark' : 'light';

  // Validacao basica
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return <EmbedShell theme={theme}><Empty msg="Email inválido" /></EmbedShell>;
  }
  if (!wsSlug) {
    return <EmbedShell theme={theme}><Empty msg="Parâmetro ?ws=&lt;slug&gt; obrigatório" /></EmbedShell>;
  }

  const db = getDb();

  // 1. Acha workspace
  const [ws] = await db.select().from(workspaces).where(eq(workspaces.slug, wsSlug)).limit(1);
  if (!ws) {
    return <EmbedShell theme={theme}><Empty msg="Workspace não encontrado" /></EmbedShell>;
  }

  // 2. Acha recipient pelo email no workspace
  const [recipient] = await db
    .select()
    .from(recipients)
    .where(and(eq(recipients.workspaceId, ws.id), eq(recipients.email, email)))
    .limit(1);

  if (!recipient) {
    return (
      <EmbedShell theme={theme} workspaceName={ws.name}>
        <Empty msg="Você ainda não tem certificados" hint="Quando concluir um curso, ele aparece aqui automaticamente." />
      </EmbedShell>
    );
  }

  // 3. Lista certs deste recipient
  const certs = await db
    .select()
    .from(credentials)
    .where(and(eq(credentials.workspaceId, ws.id), eq(credentials.recipientId, recipient.id)))
    .orderBy(desc(credentials.issuedAt))
    .limit(limit);

  if (certs.length === 0) {
    return (
      <EmbedShell theme={theme} workspaceName={ws.name}>
        <Empty msg="Nenhum certificado emitido ainda" hint="Os certificados aparecem aqui assim que forem emitidos." />
      </EmbedShell>
    );
  }

  return (
    <EmbedShell theme={theme} workspaceName={ws.name}>
      <ul className="cert-list">
        {certs.map((c) => {
          const date = c.issuedAt
            ? new Date(c.issuedAt * 1000).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
            : '';
          const revoked = !!c.revokedAt;
          return (
            <li key={c.id} className={`cert-item ${revoked ? 'revoked' : ''}`}>
              <div className="cert-icon">
                {revoked ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="8" r="6" /><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
                  </svg>
                )}
              </div>
              <div className="cert-info">
                <h3 className="cert-title">{c.courseName}</h3>
                <p className="cert-meta">
                  {c.courseHours ? `${c.courseHours}h · ` : ''}
                  Emitido em {date}
                  {revoked && ' · revogado'}
                </p>
              </div>
              <div className="cert-actions">
                <a href={`/v/${c.id}`} target="_blank" rel="noopener" className="cert-btn cert-btn-primary">
                  Verificar
                </a>
                <a
                  href={`/api/v1/credentials/${c.id}/pdf`}
                  target="_blank"
                  rel="noopener"
                  className="cert-btn cert-btn-secondary"
                  title="Baixar PDF"
                >
                  PDF
                </a>
              </div>
            </li>
          );
        })}
      </ul>
    </EmbedShell>
  );
}

/* ----------------------------------------------------------------------- */

function EmbedShell({
  children,
  theme,
  workspaceName,
}: {
  children: React.ReactNode;
  theme: 'light' | 'dark';
  workspaceName?: string;
}) {
  const isDark = theme === 'dark';
  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            html, body { margin: 0; padding: 0; background: ${isDark ? '#09090f' : '#ffffff'}; color: ${isDark ? '#f3f4f6' : '#111827'}; font-family: 'Inter', system-ui, -apple-system, sans-serif; -webkit-font-smoothing: antialiased; }
            .embed-root { padding: 16px; max-width: 880px; margin: 0 auto; }
            .embed-header { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid ${isDark ? '#27272a' : '#e5e7eb'}; }
            .embed-logo { display: inline-flex; align-items: center; gap: 4px; font-weight: 700; font-size: 14px; letter-spacing: -0.02em; }
            .embed-logo .uc-blue { color: #1B2D5E; }
            .dark .embed-logo .uc-blue { color: #8291C8; }
            .embed-logo .uc-gold { color: #D4A937; }
            .embed-ws { font-size: 12px; color: ${isDark ? '#9ca3af' : '#6b7280'}; margin-left: auto; }
            .cert-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 8px; }
            .cert-item { display: flex; align-items: center; gap: 12px; padding: 14px; border: 1px solid ${isDark ? '#262d3c' : '#e5e7eb'}; border-radius: 10px; background: ${isDark ? '#10141e' : '#ffffff'}; transition: border-color 0.15s ease, transform 0.15s ease; }
            .cert-item:hover { border-color: ${isDark ? '#374151' : '#d1d5db'}; transform: translateY(-1px); }
            .cert-item.revoked { opacity: 0.6; }
            .cert-icon { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; background: ${isDark ? '#1c2338' : '#ebeef7'}; color: #1B2D5E; }
            .dark .cert-icon { color: #8291C8; }
            .cert-item.revoked .cert-icon { background: ${isDark ? '#3f1d1d' : '#fee2e2'}; color: #dc2626; }
            .cert-info { flex: 1; min-width: 0; }
            .cert-title { font-size: 14px; font-weight: 600; margin: 0 0 2px; line-height: 1.3; }
            .cert-meta { font-size: 12px; color: ${isDark ? '#9ca3af' : '#6b7280'}; margin: 0; }
            .cert-actions { display: flex; gap: 6px; flex-shrink: 0; }
            .cert-btn { display: inline-flex; align-items: center; padding: 6px 12px; font-size: 12px; font-weight: 600; text-decoration: none; border-radius: 6px; border: 1px solid; transition: all 0.15s ease; white-space: nowrap; }
            .cert-btn-primary { background: #1B2D5E; color: #fff; border-color: #1B2D5E; }
            .cert-btn-primary:hover { background: #0F1B3E; }
            .cert-btn-secondary { background: transparent; color: ${isDark ? '#f3f4f6' : '#111827'}; border-color: ${isDark ? '#374151' : '#e5e7eb'}; }
            .cert-btn-secondary:hover { background: ${isDark ? '#1c2338' : '#f9fafb'}; }
            .empty { text-align: center; padding: 40px 16px; color: ${isDark ? '#9ca3af' : '#6b7280'}; }
            .empty .empty-icon { width: 56px; height: 56px; margin: 0 auto 12px; border-radius: 50%; background: ${isDark ? '#10141e' : '#f9fafb'}; display: flex; align-items: center; justify-content: center; }
            .empty h2 { font-size: 15px; font-weight: 600; margin: 0 0 4px; color: ${isDark ? '#f3f4f6' : '#111827'}; }
            .empty p { font-size: 12px; margin: 0; }
            .embed-footer { margin-top: 14px; padding-top: 10px; border-top: 1px solid ${isDark ? '#27272a' : '#f3f4f6'}; font-size: 11px; color: ${isDark ? '#6b7280' : '#9ca3af'}; text-align: center; }
            .embed-footer a { color: inherit; text-decoration: none; font-weight: 600; }
            .embed-footer a:hover { color: ${isDark ? '#9ca3af' : '#374151'}; }
          `,
        }}
      />
      <div className="embed-root">
        <header className="embed-header">
          <span className="embed-logo">
            <span className="uc-blue">univer</span>
            <span className="uc-gold">CERT</span>
          </span>
          {workspaceName && <span className="embed-ws">{workspaceName}</span>}
        </header>
        {children}
        <div className="embed-footer">
          Powered by <a href="https://univercert.com.br" target="_blank" rel="noopener">UniverCert</a> · plataforma brasileira de certificados verificáveis
        </div>
      </div>
    </>
  );
}

function Empty({ msg, hint }: { msg: string; hint?: string }) {
  return (
    <div className="empty">
      <div className="empty-icon">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="8" r="6" />
          <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
        </svg>
      </div>
      <h2>{msg}</h2>
      {hint && <p>{hint}</p>}
    </div>
  );
}

export const metadata = {
  title: 'Meus certificados · UniverCert',
  robots: { index: false, follow: false },
};
