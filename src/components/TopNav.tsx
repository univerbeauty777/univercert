'use client';

// UniverCert · TopNav GODMODE — seletor superior multi-página + page switcher
// Plug em todas paginas publicas (landing, marketplace, verificar, /v, /escola, /demo, /app)

import { useState, useEffect, useRef } from 'react';
import LanguageSwitcher from './LanguageSwitcher';

type NavItem = { label: string; href: string };

type Props = {
  locale?: 'pt' | 'en' | 'es' | 'fr';
  current?: string;     // active page key
  variant?: 'light' | 'dark';
  showLanguage?: boolean;
};

const LABELS: Record<string, Record<string, string>> = {
  pt: { features: 'Recursos', pricing: 'Preços', compare: 'Comparar', marketplace: 'Marketplace', verify: 'Verificar', demo: 'Demo', docs: 'Docs', signin: 'Entrar', signup: 'Grátis', browse: 'Navegar', pages: 'Páginas', landing: 'Início', escola: 'Escolas', partner: 'Programa Educator', app: 'App mobile', affiliate: 'Afiliados' },
  en: { features: 'Features', pricing: 'Pricing', compare: 'Compare', marketplace: 'Marketplace', verify: 'Verify', demo: 'Demo', docs: 'Docs', signin: 'Sign in', signup: 'Free', browse: 'Browse', pages: 'Pages', landing: 'Home', escola: 'Schools', partner: 'Educator Program', app: 'Mobile app', affiliate: 'Affiliates' },
  es: { features: 'Recursos', pricing: 'Precios', compare: 'Comparar', marketplace: 'Marketplace', verify: 'Verificar', demo: 'Demo', docs: 'Docs', signin: 'Entrar', signup: 'Gratis', browse: 'Navegar', pages: 'Páginas', landing: 'Inicio', escola: 'Escuelas', partner: 'Programa Educator', app: 'App móvil', affiliate: 'Afiliados' },
  fr: { features: 'Fonctionnalités', pricing: 'Tarifs', compare: 'Comparer', marketplace: 'Marketplace', verify: 'Vérifier', demo: 'Démo', docs: 'Docs', signin: 'Connexion', signup: 'Gratuit', browse: 'Naviguer', pages: 'Pages', landing: 'Accueil', escola: 'Écoles', partner: 'Programme Educator', app: 'App mobile', affiliate: 'Affiliés' },
};

export default function TopNav({ locale = 'pt', current, variant = 'light', showLanguage = true }: Props) {
  const [open, setOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const L = LABELS[locale] ?? LABELS.pt;

  const isDark = variant === 'dark';
  const bg = isDark ? 'rgba(10,14,26,0.85)' : 'rgba(255,255,255,0.85)';
  const fg = isDark ? '#fff' : '#0f172a';
  const muted = isDark ? 'rgba(255,255,255,0.7)' : '#475569';
  const border = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)';

  const links: NavItem[] = [
    { label: L.features, href: `/${locale}#features` },
    { label: L.compare, href: `/${locale}#compare` },
    { label: L.pricing, href: `/${locale}#pricing` },
    { label: L.marketplace, href: '/marketplace' },
    { label: L.verify, href: '/verificar' },
  ];

  const pages = [
    { key: 'landing', label: L.landing, sub: 'univercert.net', href: `/${locale}`, icon: '🏠' },
    { key: 'marketplace', label: L.marketplace, sub: '+200 templates', href: '/marketplace', icon: '🛍' },
    { key: 'verify', label: L.verify, sub: 'cert authenticity', href: '/verificar', icon: '🔍' },
    { key: 'demo', label: L.demo, sub: '30s test drive', href: '/demo', icon: '🧪' },
    { key: 'app', label: L.app, sub: 'PWA + Wallet', href: '/app', icon: '📱' },
    { key: 'escola', label: L.escola, sub: 'issuer pages', href: '/escola/univerhair', icon: '🏫' },
    { key: 'partner', label: L.partner, sub: '20% revenue share', href: '/partner/apply', icon: '🌟' },
    { key: 'affiliate', label: L.affiliate, sub: '10% recurring', href: '/affiliate', icon: '🤝' },
    { key: 'signin', label: L.signin, sub: 'dashboard', href: '/sign-in', icon: '🔐' },
    { key: 'signup', label: L.signup, sub: '14-day trial', href: '/sign-up', icon: '✨' },
  ];

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: bg, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderBottom: `1px solid ${border}` }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>

        {/* LEFT: Logo + Page Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <a href={`/${locale}`} style={{ fontWeight: 800, fontSize: 18, textDecoration: 'none', color: fg, display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap' }}>
            <span style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg, #1B2D5E, #D4A937)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 14, fontWeight: 800 }}>U</span>
            <span><span style={{ color: isDark ? '#fff' : '#1B2D5E' }}>univer</span><span style={{ color: '#D4A937' }}>CERT</span></span>
          </a>

          {/* PAGE SELECTOR DROPDOWN */}
          <div ref={wrapRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setOpen((v) => !v)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 10, border: `1px solid ${border}`, background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', color: muted, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
              aria-haspopup="true" aria-expanded={open}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
              {L.pages}
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
            {open && (
              <div style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, minWidth: 320, maxHeight: '70vh', overflowY: 'auto', background: isDark ? '#0f172a' : '#fff', border: `1px solid ${border}`, borderRadius: 14, boxShadow: '0 16px 48px rgba(0,0,0,0.18)', padding: 8, zIndex: 200 }}>
                <div style={{ padding: '6px 10px', fontSize: 11, color: muted, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>{L.browse}</div>
                {pages.map((p) => {
                  const isActive = current === p.key;
                  return (
                    <a key={p.key} href={p.href}
                      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 10, textDecoration: 'none', color: fg, background: isActive ? (isDark ? 'rgba(212,169,55,0.15)' : 'rgba(27,45,94,0.07)') : 'transparent', transition: 'background 0.15s' }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = isActive ? (isDark ? 'rgba(212,169,55,0.15)' : 'rgba(27,45,94,0.07)') : 'transparent'; }}
                    >
                      <span style={{ fontSize: 18 }}>{p.icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{p.label}</div>
                        <div style={{ fontSize: 11, color: muted }}>{p.sub}</div>
                      </div>
                      {isActive && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />}
                    </a>
                  );
                })}
                <div style={{ borderTop: `1px solid ${border}`, margin: '8px 0', padding: '8px 12px 4px', fontSize: 10, color: muted }}>
                  Cmd+K para busca rápida em qualquer página
                </div>
              </div>
            )}
          </div>
        </div>

        {/* CENTER: Direct links (desktop only) */}
        <div className="topnav-links" style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
          {links.map((l) => (
            <a key={l.href} href={l.href} style={{ color: muted, textDecoration: 'none', fontSize: 14, fontWeight: 500, transition: 'color 0.15s', whiteSpace: 'nowrap' }}>
              {l.label}
            </a>
          ))}
        </div>

        {/* RIGHT: Language + CTAs */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {showLanguage && <LanguageSwitcher current={locale} compact />}
          <a href="/sign-in" style={{ color: muted, textDecoration: 'none', fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap' }}>{L.signin}</a>
          <a href="/sign-up" style={{ background: '#1B2D5E', color: '#fff', padding: '8px 18px', borderRadius: 10, textDecoration: 'none', fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', boxShadow: '0 2px 8px rgba(27,45,94,0.2)' }}>{L.signup}</a>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="topnav-mobile-btn"
            style={{ display: 'none', background: 'transparent', border: 'none', color: fg, cursor: 'pointer', padding: 6 }}
            aria-label="Menu"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div style={{ background: bg, borderTop: `1px solid ${border}`, padding: 16 }}>
          {[...links, ...pages.slice(0, 6).map((p) => ({ label: p.label, href: p.href }))].map((l, i) => (
            <a key={i} href={l.href} style={{ display: 'block', padding: '10px 0', color: fg, textDecoration: 'none', fontSize: 14, fontWeight: 600, borderBottom: `1px solid ${border}` }}>
              {l.label}
            </a>
          ))}
        </div>
      )}

      {/* Responsive CSS */}
      <style jsx global>{`
        @media (max-width: 900px) {
          .topnav-links { display: none !important; }
          .topnav-mobile-btn { display: inline-flex !important; }
        }
      `}</style>
    </nav>
  );
}
