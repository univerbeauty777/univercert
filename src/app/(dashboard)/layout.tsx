// UniverCert · dashboard shell com nav completa

export const runtime = 'edge';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <a href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-sm">
                🏆
              </div>
              <span className="font-extrabold">
                Univer<span className="text-primary">Cert</span>
              </span>
            </a>
            <nav className="hidden md:flex gap-4 text-sm font-semibold text-gray-600">
              <a href="/dashboard" className="hover:text-primary">Dashboard</a>
              <a href="/queue" className="hover:text-primary">Fila</a>
              <a href="/credentials" className="hover:text-primary">Cert.</a>
              <a href="/recipients" className="hover:text-primary">Alunos</a>
              <a href="/bulk" className="hover:text-primary">Bulk</a>
              <a href="/templates" className="hover:text-primary">Templates</a>
              <a href="/integrations" className="hover:text-primary">Integrações</a>
              <a href="/billing" className="hover:text-primary">Billing</a>
              <a href="/domain" className="hover:text-primary">Domínio</a>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-xs text-gray-500">UniverHair</div>
            <a href="/audit" className="text-xs text-gray-500 hover:text-primary" title="Audit log">📋</a>
            <form action="/api/auth/sign-out" method="POST" className="inline">
              <button type="submit" className="text-xs text-gray-500 hover:text-danger" title="Sair">Sair</button>
            </form>
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
