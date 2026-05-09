'use client';

// UniverCert · DarkModeToggle · persiste em localStorage + escuta system preference

import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

function applyTheme(theme: Theme) {
  if (typeof window === 'undefined') return;
  const root = document.documentElement;
  let resolved: 'light' | 'dark';
  if (theme === 'system') {
    resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  } else {
    resolved = theme;
  }
  if (resolved === 'dark') root.classList.add('dark');
  else root.classList.remove('dark');
}

function getStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'system';
  try {
    const v = localStorage.getItem('uc_theme');
    if (v === 'light' || v === 'dark' || v === 'system') return v;
  } catch {}
  return 'system';
}

export default function DarkModeToggle({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const [theme, setTheme] = useState<Theme>('system');
  const [mounted, setMounted] = useState(false);

  // Init: aplica o tema armazenado e escuta system changes
  useEffect(() => {
    const t = getStoredTheme();
    setTheme(t);
    applyTheme(t);
    setMounted(true);

    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      if (getStoredTheme() === 'system') applyTheme('system');
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const cycle = () => {
    const next: Theme = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';
    setTheme(next);
    try { localStorage.setItem('uc_theme', next); } catch {}
    applyTheme(next);
  };

  // Evita flash de hidratação (renderiza vazio até montar)
  if (!mounted) {
    return <div className={size === 'sm' ? 'w-8 h-8' : 'w-9 h-9'} aria-hidden />;
  }

  const isDark = theme === 'dark' || (theme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const label = theme === 'system' ? `Tema: sistema (${isDark ? 'escuro' : 'claro'})` : theme === 'dark' ? 'Tema: escuro' : 'Tema: claro';

  const dim = size === 'sm' ? 'w-8 h-8' : 'w-9 h-9';
  const icon = size === 'sm' ? 14 : 16;

  return (
    <button
      onClick={cycle}
      title={`${label} · clique pra alternar`}
      aria-label={label}
      className={`${dim} rounded-lg flex items-center justify-center transition relative group`}
      style={{ background: 'transparent', color: 'rgb(var(--fg-muted))' }}
    >
      <span className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition" style={{ background: 'rgb(var(--bg-muted))' }} />
      <span className="relative">
        {theme === 'system' ? (
          <SystemIcon size={icon} />
        ) : isDark ? (
          <MoonIcon size={icon} />
        ) : (
          <SunIcon size={icon} />
        )}
      </span>
    </button>
  );
}

function SunIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function MoonIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function SystemIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  );
}
