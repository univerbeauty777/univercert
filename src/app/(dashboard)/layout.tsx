// UniverCert · dashboard shell

export const runtime = 'edge';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <a href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-sm">
                🏆
              </div>
              <span className="font-extrabold">
                Univer<span className="text-primary">Cert</span>
              </span>
            </a>
            <nav className="hidden md:flex gap-6 text-sm font-semibold text-gray-600">
              <a href="/dashboard" className="hover:text-primary">Dashboard</a>
              <a href="/queue" className="hover:text-primary">Fila</a>
              <a href="/bulk" className="hover:text-primary">Bulk emit</a>
              <a href="/templates" className="hover:text-primary">Templates</a>
              <a href="/integrations" className="hover:text-primary">Integrações</a>
            </nav>
          </div>
          <div className="text-xs text-gray-500">UniverHair (workspace)</div>
        </div>
      </header>
      {children}
    </div>
  );
}
