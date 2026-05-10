'use client';

// UniverCert · Language Switcher (S33)

import { useState } from 'react';

const LOCALES = [
  { code: 'pt', label: 'Português', flag: '🇧🇷' },
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
] as const;

export default function LanguageSwitcher({ current, compact = false }: { current?: string; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const cur = LOCALES.find((l) => l.code === current) ?? LOCALES[0];

  const switchTo = (code: string) => {
    document.cookie = `uc_locale=${code}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
    window.location.reload();
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: compact ? '6px 10px' : '8px 14px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.1)', background: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: 500, cursor: 'pointer', color: '#0f172a' }}
        aria-haspopup="true" aria-expanded={open}
      >
        <span style={{ fontSize: 16 }}>{cur.flag}</span>
        {!compact && <span>{cur.label}</span>}
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 9998 }} />
          <div style={{ position: 'absolute', top: 'calc(100% + 6px)', right: 0, background: '#fff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', minWidth: 160, zIndex: 9999, padding: 6 }}>
            {LOCALES.map((l) => (
              <button
                key={l.code}
                onClick={() => switchTo(l.code)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '8px 12px', borderRadius: 8, border: 'none', background: l.code === cur.code ? 'rgba(99,102,241,0.08)' : 'transparent', cursor: 'pointer', fontSize: 13, color: '#0f172a', textAlign: 'left' }}
              >
                <span style={{ fontSize: 18 }}>{l.flag}</span>
                <span style={{ flex: 1 }}>{l.label}</span>
                {l.code === cur.code && <span style={{ color: '#10b981' }}>✓</span>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
