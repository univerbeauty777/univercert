// UniverCert · dashboard shell

import Logo from '@/components/Logo';

export const runtime = 'edge';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white/80 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-7">
            <a href="/" className="flex items-center gap-2 group">
              <Logo size={36} className="group-hover:scale-105 transition-transform" />
              <span className="font-extrabold tracking-tight">
                <span className="text-primary">univer</span>
                <span className="text-accent">CERT</span>
              </span>
            </a>
            <nav className="hidden lg:flex gap-0.5 text-sm font-semibold text-ink-500">
              <NavLink href="/dashboard">Visão geral</NavLink>
              <NavLink href="/queue">Fila</NavLink>
              <NavLink href="/credentials">Certificados</NavLink>
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
            <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-ink-500 px-2 py-1 bg-gray-100 rounded-full font-bold uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-success" /> UniverHair
            </div>
            <a href="/audit" className="text-ink-500 hover:text-primary p-1.5 rounded-lg hover:bg-gray-100 transition" title="Audit log">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            </a>
            <form action="/api/auth/sign-out" method="POST" className="inline">
              <button type="submit" className="text-xs text-ink-500 hover:text-danger px-3 py-1.5 rounded-lg hover:bg-danger-soft transition font-medium" title="Sair">Sair</button>
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
    <a href={href} className="px-3 py-2 rounded-lg hover:bg-primary-soft hover:text-primary-dark transition-colors">
      {children}
    </a>
  );
}
