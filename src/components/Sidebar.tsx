'use client';

// UniverCert · Sidebar GODMODE 2.0
// Sidebar fixa colapsável + persistência localStorage + active state via pathname.

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Logo from './Logo';
import DarkModeToggle from './DarkModeToggle';

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: string | number;
};

type NavSection = {
  label: string;
  items: NavItem[];
};

const Icon = {
  home: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="icon">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1h-5v-7H9v7H4a1 1 0 01-1-1V9.5z" />
    </svg>
  ),
  inbox: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="icon">
      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
      <path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z" />
    </svg>
  ),
  award: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="icon">
      <circle cx="12" cy="8" r="6" />
      <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
    </svg>
  ),
  users: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="icon">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
    </svg>
  ),
  upload: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="icon">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
    </svg>
  ),
  brush: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="icon">
      <circle cx="13.5" cy="6.5" r=".5" /><circle cx="17.5" cy="10.5" r=".5" />
      <circle cx="8.5" cy="7.5" r=".5" /><circle cx="6.5" cy="12.5" r=".5" />
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.93 0 1.5-.7 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c3.31 0 6-2.69 6-6 0-4.96-4.49-9-10-9z" />
    </svg>
  ),
  zap: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="icon">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  globe: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="icon">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
    </svg>
  ),
  team: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="icon">
      <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
    </svg>
  ),
  plug: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="icon">
      <line x1="12" y1="2" x2="12" y2="6" /><line x1="12" y1="18" x2="12" y2="22" />
      <path d="M19 12c0 3.866-3.134 7-7 7s-7-3.134-7-7 3.134-7 7-7" />
    </svg>
  ),
  card: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="icon">
      <rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" />
    </svg>
  ),
  store: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="icon">
      <path d="M3 9h18l-2 11H5L3 9z" /><path d="M3 9l2-5h14l2 5" />
    </svg>
  ),
  log: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="icon">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" /><line x1="9" y1="13" x2="15" y2="13" /><line x1="9" y1="17" x2="13" y2="17" />
    </svg>
  ),
  collapse: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="9" y1="3" x2="9" y2="21" />
    </svg>
  ),
  logout: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
    </svg>
  ),
};

const SECTIONS: NavSection[] = [
  {
    label: 'Operação',
    items: [
      { href: '/dashboard', label: 'Visão geral', icon: Icon.home },
      { href: '/queue', label: 'Fila', icon: Icon.inbox },
      { href: '/credentials', label: 'Certificados', icon: Icon.award },
      { href: '/recipients', label: 'Alunos', icon: Icon.users },
      { href: '/bulk', label: 'Bulk', icon: Icon.upload },
    ],
  },
  {
    label: 'Personalização',
    items: [
      { href: '/courses', label: 'Cursos', icon: Icon.award },
      { href: '/templates', label: 'Templates', icon: Icon.brush },
      { href: '/workflows', label: 'Workflows', icon: Icon.zap },
      { href: '/domain', label: 'Domínio', icon: Icon.globe },
    ],
  },
  {
    label: 'Workspace',
    items: [
      { href: '/team', label: 'Equipe', icon: Icon.team },
      { href: '/integrations', label: 'Integrações', icon: Icon.plug },
      { href: '/billing', label: 'Billing', icon: Icon.card },
      { href: '/reseller', label: 'Reseller', icon: Icon.store },
      { href: '/audit', label: 'Audit log', icon: Icon.log },
      { href: '/admin/health', label: 'Saúde · admin', icon: Icon.zap },
    ],
  },
];

const COLLAPSE_KEY = 'uc_sidebar_collapsed';

export default function Sidebar({
  workspaceName = 'UniverCert',
  pendingCount = 0,
}: {
  workspaceName?: string;
  pendingCount?: number;
}) {
  const pathname = usePathname() || '/';
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      setCollapsed(localStorage.getItem(COLLAPSE_KEY) === '1');
    } catch {}
  }, []);

  const toggleCollapse = () => {
    const next = !collapsed;
    setCollapsed(next);
    try { localStorage.setItem(COLLAPSE_KEY, next ? '1' : '0'); } catch {}
    // Notifica layout pra ajustar padding
    document.documentElement.classList.toggle('sidebar-collapsed', next);
  };

  // Sincroniza class no html no mount
  useEffect(() => {
    if (mounted) document.documentElement.classList.toggle('sidebar-collapsed', collapsed);
  }, [mounted, collapsed]);

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === href;
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <>
      {/* Mobile hamburger — fica no canto superior esquerdo */}
      <button
        type="button"
        onClick={() => setMobileOpen((v) => !v)}
        className="md:hidden fixed top-3 left-3 z-50 btn-icon bg-[rgb(var(--surface))] border border-[rgb(var(--border))]"
        aria-label="Toggle menu"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          {mobileOpen ? <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>
            : <><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></>}
        </svg>
      </button>

      {/* Backdrop mobile */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 bg-black/30 backdrop-blur-sm z-30" onClick={() => setMobileOpen(false)} />
      )}

      <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
        {/* Logo + workspace */}
        <div className="flex items-center gap-2.5 px-4 h-14 border-b border-[rgb(var(--border))] shrink-0">
          <Logo size={28} />
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1 leading-none">
                <span className="font-bold text-[15px] text-[rgb(var(--brand))]">univer</span>
                <span className="font-bold text-[15px] text-[rgb(var(--gold))]">CERT</span>
              </div>
              <div className="text-[10px] text-[rgb(var(--fg-subtle))] uppercase tracking-wider mt-0.5 truncate">
                {workspaceName}
              </div>
            </div>
          )}
        </div>

        {/* Sections */}
        <nav className="flex-1 overflow-y-auto py-3 space-y-3">
          {SECTIONS.map((section) => (
            <div key={section.label}>
              <div className="sidebar-section-label">{section.label}</div>
              {section.items.map((item) => {
                const active = isActive(item.href);
                const showBadge = item.href === '/queue' && pendingCount > 0;
                return (
                  <a
                    key={item.href}
                    href={item.href}
                    className={`sidebar-link ${active ? 'active' : ''}`}
                    title={collapsed ? item.label : undefined}
                  >
                    {item.icon}
                    <span className="label-txt">{item.label}</span>
                    {showBadge && <span className="badge-mini">{pendingCount}</span>}
                    {item.badge && <span className="badge-mini">{item.badge}</span>}
                  </a>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer: dark mode + collapse + logout */}
        <div className="border-t border-[rgb(var(--border))] p-2 flex items-center justify-between gap-1 shrink-0">
          <div className="flex items-center gap-1">
            <DarkModeToggle />
            <button
              type="button"
              onClick={toggleCollapse}
              className="btn-icon hidden md:inline-flex"
              title={collapsed ? 'Expandir sidebar' : 'Recolher sidebar'}
            >
              {Icon.collapse}
            </button>
          </div>
          {!collapsed && (
            <form action="/api/auth/sign-out" method="POST" className="inline">
              <button type="submit" className="btn-icon" title="Sair">{Icon.logout}</button>
            </form>
          )}
        </div>
      </aside>
    </>
  );
}
