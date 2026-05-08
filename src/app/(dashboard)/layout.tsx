// UniverCert · dashboard shell premium

export const runtime = 'edge';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white/85 backdrop-blur border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <a href="/" className="flex items-center gap-2 hover:opacity-80 transition">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-sm shadow-md shadow-primary/30">
                🏆
              </div>
              <span className="font-extrabold tracking-tight">
                Univer<span className="text-primary">Cert</span>
              </span>
            </a>
            <nav className="hidden md:flex gap-1 text-sm font-semibold text-gray-600">
              <NavLink href="/dashboard">Dashboard</NavLink>
              <NavLink href="/queue">Fila</NavLink>
              <NavLink href="/credentials">Cert.</NavLink>
              <NavLink href="/recipients">Alunos</NavLink>
              <NavLink href="/bulk">Bulk</NavLink>
              <NavLink href="/templates">Templates</NavLink>
              <NavLink href="/integrations">Integrações</NavLink>
              <NavLink href="/billing">Billing</NavLink>
              <NavLink href="/domain">Domínio</NavLink>
              <NavLink href="/reseller">Reseller</NavLink>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-xs text-gray-500 hidden sm:block">UniverHair</div>
            <a href="/audit" className="text-xs text-gray-500 hover:text-primary p-1 rounded transition" title="Audit log">
              📋
            </a>
            <form action="/api/auth/sign-out" method="POST" className="inline">
              <button type="submit" className="text-xs text-gray-500 hover:text-danger px-2 py-1 rounded transition" title="Sair">
                Sair
              </button>
            </form>
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="px-3 py-2 rounded-lg hover:bg-gray-100 hover:text-primary transition"
    >
      {children}
    </a>
  );
}
