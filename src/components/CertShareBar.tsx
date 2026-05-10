'use client';

// UniverCert · CertShareBar (S26)
// Barra de share mobile-first do cert publico. Aparece na verify page.

import { useState } from 'react';
import {
  linkedInAddToProfileUrl, linkedInShareUrl, whatsAppShareUrl,
  twitterShareUrl, facebookShareUrl, emailShareUrl,
  appleWalletUrl, googleWalletUrl, type CertShareData,
} from '@/lib/share-urls';

type Props = {
  data: CertShareData;
  baseUrl: string;
  compact?: boolean;
};

async function track(credentialId: string, channel: string) {
  try {
    await fetch('/api/v1/share/track', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ credentialId, channel }),
    });
  } catch {}
}

const ICONS = {
  linkedin: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M19 0h-14a5 5 0 0 0-5 5v14a5 5 0 0 0 5 5h14a5 5 0 0 0 5-5v-14a5 5 0 0 0-5-5zM8 19H5V8h3v11zM6.5 6.7c-.96 0-1.74-.78-1.74-1.74S5.54 3.22 6.5 3.22s1.74.78 1.74 1.74-.78 1.74-1.74 1.74zM20 19h-3v-5.6c0-3.36-4-3.11-4 0V19h-3V8h3v1.77c1.39-2.58 7-2.77 7 2.47V19z"/></svg>,
  whatsapp: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M.057 24l1.687-6.163a11.867 11.867 0 0 1-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 0 1 8.413 3.488 11.824 11.824 0 0 1 3.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 0 1-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 0 0 1.594 5.39l-.999 3.648 3.732-.737z"/></svg>,
  twitter: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>,
  facebook: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>,
  email: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
  apple: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>,
  google: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12.545 12.151L12.18 14.59h6.96c-.21 1.55-1.5 4.55-6.96 4.55-4.18 0-7.6-3.46-7.6-7.73S7.91 3.69 12.18 3.69c2.38 0 3.97.98 4.88 1.83l3.32-3.2C18.27.6 15.5 0 12.18 0 5.45 0 0 5.45 0 12.18s5.45 12.18 12.18 12.18c7.04 0 11.71-4.95 11.71-11.91 0-.8-.09-1.41-.2-2.02l-11.145.0z"/></svg>,
  share: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>,
  copy: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>,
};

export default function CertShareBar({ data, baseUrl, compact = false }: Props) {
  const [copied, setCopied] = useState(false);

  const handleClick = (channel: string, url: string, openIn = '_blank') => {
    track(data.credentialId, channel);
    window.open(url, openIn, 'noopener,noreferrer');
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(data.certUrl);
      setCopied(true);
      track(data.credentialId, 'direct');
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  const handleNative = async () => {
    if (typeof navigator !== 'undefined' && (navigator as any).share) {
      try {
        await (navigator as any).share({ title: data.courseName, text: `Concluí ${data.courseName}!`, url: data.certUrl });
        track(data.credentialId, 'native_share');
      } catch {}
    } else {
      handleCopy();
    }
  };

  const btnBase: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    padding: compact ? '8px 12px' : '10px 16px',
    borderRadius: 12, border: '1px solid var(--border, rgb(229,231,235))',
    background: 'var(--surface, white)', color: 'var(--fg, #0f172a)',
    fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
  };

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
      {/* Botao primario LinkedIn Add to Profile */}
      <button
        onClick={() => handleClick('linkedin', linkedInAddToProfileUrl(data))}
        style={{ ...btnBase, background: '#0A66C2', color: '#fff', borderColor: '#0A66C2' }}
        title="Adicionar ao perfil LinkedIn"
      >
        {ICONS.linkedin} {compact ? '' : 'Adicionar ao LinkedIn'}
      </button>

      {/* WhatsApp */}
      <button onClick={() => handleClick('whatsapp', whatsAppShareUrl(data))} style={{ ...btnBase, color: '#25D366' }} title="Compartilhar no WhatsApp">
        {ICONS.whatsapp}
      </button>

      {/* Twitter */}
      <button onClick={() => handleClick('twitter', twitterShareUrl(data))} style={btnBase} title="Compartilhar no X/Twitter">
        {ICONS.twitter}
      </button>

      {/* Facebook */}
      <button onClick={() => handleClick('facebook', facebookShareUrl(data))} style={{ ...btnBase, color: '#1877F2' }} title="Compartilhar no Facebook">
        {ICONS.facebook}
      </button>

      {/* Email */}
      <button onClick={() => handleClick('email', emailShareUrl(data), '_self')} style={btnBase} title="Compartilhar por email">
        {ICONS.email}
      </button>

      {/* Wallet Apple */}
      <a href={appleWalletUrl(data.credentialId, baseUrl)} onClick={() => track(data.credentialId, 'wallet_apple')} style={btnBase} title="Adicionar ao Apple Wallet">
        {ICONS.apple} {compact ? '' : 'Apple Wallet'}
      </a>

      {/* Wallet Google */}
      <a href={googleWalletUrl(data.credentialId, baseUrl)} onClick={() => track(data.credentialId, 'wallet_google')} style={btnBase} title="Adicionar ao Google Wallet">
        {ICONS.google} {compact ? '' : 'Google Wallet'}
      </a>

      {/* Native share (mobile) */}
      <button onClick={handleNative} style={btnBase} title="Mais opcoes">
        {ICONS.share}
      </button>

      {/* Copy link */}
      <button onClick={handleCopy} style={{ ...btnBase, ...(copied ? { background: '#10b981', color: '#fff', borderColor: '#10b981' } : {}) }} title="Copiar link">
        {ICONS.copy} {copied ? 'Copiado!' : (compact ? '' : 'Copiar link')}
      </button>
    </div>
  );
}
