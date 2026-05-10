'use client';

// UniverCert · Command Palette Cmd+K (S30)
// Search global em alunos/certs/templates/requests via /api/v1/search

import { useState, useEffect, useRef, useCallback } from 'react';

type Result = { kind: 'recipient' | 'credential' | 'template' | 'request'; id: string; label: string; sub: string; href: string };

const KIND_LABELS: Record<Result['kind'], { label: string; icon: string; color: string }> = {
  recipient: { label: 'Aluno', icon: '👤', color: '#06B6D4' },
  credential: { label: 'Cert', icon: '🏆', color: '#10B981' },
  template: { label: 'Template', icon: '📄', color: '#8B5CF6' },
  request: { label: 'Pedido', icon: '📨', color: '#F59E0B' },
};

const NAV_SHORTCUTS: Result[] = [
  { kind: 'template', id: 'nav-dashboard', label: 'Dashboard', sub: 'visão geral', href: '/dashboard' },
  { kind: 'template', id: 'nav-queue', label: 'Fila', sub: 'pedidos pendentes', href: '/queue' },
  { kind: 'template', id: 'nav-recipients', label: 'Alunos', sub: 'lista', href: '/recipients' },
  { kind: 'template', id: 'nav-credentials', label: 'Certificados', sub: 'emitidos', href: '/credentials' },
  { kind: 'template', id: 'nav-templates', label: 'Templates', sub: 'galeria', href: '/templates' },
  { kind: 'template', id: 'nav-courses', label: 'Cursos', sub: 'gerenciar', href: '/courses' },
  { kind: 'template', id: 'nav-workflows', label: 'Workflows', sub: 'automações', href: '/workflows' },
  { kind: 'template', id: 'nav-team', label: 'Equipe', sub: 'membros do workspace', href: '/team' },
  { kind: 'template', id: 'nav-billing', label: 'Billing', sub: 'plano + uso', href: '/billing' },
  { kind: 'template', id: 'nav-integrations', label: 'Integrações', sub: 'webhooks + Fluent', href: '/integrations' },
  { kind: 'template', id: 'nav-analytics', label: 'Analytics', sub: 'shares + verificações', href: '/analytics' },
  { kind: 'template', id: 'nav-marketplace', label: 'Marketplace', sub: 'templates da comunidade', href: '/marketplace' },
  { kind: 'template', id: 'nav-affiliate', label: 'Afiliados', sub: 'programa de indicação', href: '/affiliate' },
  { kind: 'template', id: 'nav-branding', label: 'Identidade visual', sub: 'logo, cores, depoimentos', href: '/settings/branding' },
  { kind: 'template', id: 'nav-apikeys', label: 'API keys', sub: 'integrações via REST', href: '/integrations/api-keys' },
];

// S77: Slash actions (começam com /)
type Action = { id: string; label: string; sub: string; icon: string; color: string; href: string };
const SLASH_ACTIONS: Action[] = [
  { id: '/emit', label: '/emit · Emitir certificado', sub: 'aprovar pedido pendente', icon: '🏆', color: '#10b981', href: '/queue' },
  { id: '/new-template', label: '/new template · Novo template', sub: 'criar do zero ou com IA', icon: '📄', color: '#8b5cf6', href: '/templates/new' },
  { id: '/new-course', label: '/new course · Novo curso', sub: 'cadastrar curso emitível', icon: '🎓', color: '#06B6D4', href: '/courses/new' },
  { id: '/invite', label: '/invite · Convidar membro', sub: 'adicionar pessoa ao workspace', icon: '👥', color: '#06B6D4', href: '/team' },
  { id: '/bulk', label: '/bulk · Emissão em massa', sub: 'CSV upload', icon: '📊', color: '#F59E0B', href: '/bulk' },
  { id: '/verify', label: '/verify · Verificar cert', sub: 'cole ID/hash', icon: '🔍', color: '#10b981', href: '/verificar' },
  { id: '/upgrade', label: '/upgrade · Mudar plano', sub: 'billing + uso', icon: '⚡', color: '#1B2D5E', href: '/billing' },
  { id: '/apikey', label: '/apikey · Nova API key', sub: 'integração externa (Pro+)', icon: '🔑', color: '#dc2626', href: '/integrations/api-keys' },
  { id: '/webhook', label: '/webhook · Novo webhook', sub: 'eventos pra Zapier/N8N', icon: '🔗', color: '#8b5cf6', href: '/integrations/webhooks' },
  { id: '/audit', label: '/audit · Exportar audit log', sub: 'CSV/JSON compliance', icon: '📋', color: '#64748b', href: '/api/v1/audit/export?format=csv' },
  { id: '/brand', label: '/brand · Editar identidade', sub: 'logo, cores, depoimentos', icon: '🎨', color: '#F59E0B', href: '/settings/branding' },
  { id: '/docs', label: '/docs · Documentação API', sub: 'reference completa', icon: '📖', color: '#64748b', href: 'https://univercert.net/docs/api' },
];

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<any>(null);

  // Cmd+K / Ctrl+K toggle
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
      } else if (e.key === 'Escape' && open) {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 50); }, [open]);

  // Search debounced
  useEffect(() => {
    if (!open) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);

    // S77: Se começa com '/', mostra slash actions
    if (q.startsWith('/')) {
      const actionResults: Result[] = SLASH_ACTIONS
        .filter((a) => a.id.toLowerCase().includes(q.toLowerCase()) || a.label.toLowerCase().includes(q.slice(1).toLowerCase()))
        .map((a) => ({ kind: 'template' as const, id: a.id, label: a.label, sub: a.sub, href: a.href }));
      setResults(actionResults.length > 0 ? actionResults : SLASH_ACTIONS.map((a) => ({ kind: 'template' as const, id: a.id, label: a.label, sub: a.sub, href: a.href })));
      setActive(0);
      return;
    }

    if (!q.trim()) {
      setResults(NAV_SHORTCUTS);
      setActive(0);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const r = await fetch(`/api/v1/search?q=${encodeURIComponent(q)}`);
        const data = await r.json() as { ok: boolean; results?: Result[] };
        const navMatching = NAV_SHORTCUTS.filter((n) => n.label.toLowerCase().includes(q.toLowerCase()));
        setResults([...navMatching, ...(data.results ?? [])]);
        setActive(0);
      } finally { setLoading(false); }
    }, 200);
  }, [q, open]);

  const go = useCallback((r: Result) => {
    window.location.href = r.href;
    setOpen(false);
  }, []);

  const onListKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(results.length - 1, a + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); }
    else if (e.key === 'Enter' && results[active]) { e.preventDefault(); go(results[active]); }
  };

  if (!open) return (
    <button
      onClick={() => setOpen(true)}
      title="Buscar (Cmd+K)"
      className="hidden md:inline-flex items-center gap-2 px-3 h-9 text-xs text-[rgb(var(--fg-muted))] bg-[rgb(var(--surface-2))] hover:bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded-lg transition"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
      Buscar
      <kbd className="ml-2 px-1.5 py-0.5 text-[10px] font-mono bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded">⌘K</kbd>
    </button>
  );

  return (
    <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 99999, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '15vh' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: 'rgb(var(--surface))', borderRadius: 16, width: '100%', maxWidth: 580, boxShadow: '0 32px 80px rgba(0,0,0,0.45)', border: '1px solid rgb(var(--border))', overflow: 'hidden' }}>
        <div style={{ padding: 12, borderBottom: '1px solid rgb(var(--border))', display: 'flex', alignItems: 'center', gap: 10 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ opacity: 0.5 }}><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          <input
            ref={inputRef}
            type="text" placeholder="Buscar alunos, certs, templates, navegar…"
            value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={onListKey}
            style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 16, color: 'rgb(var(--fg))' }}
          />
          {loading && <div style={{ width: 14, height: 14, border: '2px solid rgba(99,102,241,0.2)', borderTopColor: 'rgb(99,102,241)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />}
          <kbd style={{ padding: '2px 6px', fontSize: 10, fontFamily: 'monospace', background: 'rgb(var(--surface-2))', border: '1px solid rgb(var(--border))', borderRadius: 4, color: 'rgb(var(--fg-muted))' }}>esc</kbd>
        </div>

        <div style={{ maxHeight: '50vh', overflowY: 'auto', padding: 6 }}>
          {results.length === 0 && q.trim() && !loading && (
            <div style={{ padding: 32, textAlign: 'center', color: 'rgb(var(--fg-muted))', fontSize: 13 }}>Nada encontrado pra "{q}".</div>
          )}
          {results.map((r, i) => {
            const meta = KIND_LABELS[r.kind];
            const isActive = i === active;
            return (
              <button
                key={`${r.kind}-${r.id}`}
                onClick={() => go(r)}
                onMouseEnter={() => setActive(i)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '10px 12px',
                  borderRadius: 10, border: 'none', background: isActive ? 'rgba(99,102,241,0.1)' : 'transparent',
                  cursor: 'pointer', textAlign: 'left', transition: 'background 0.1s',
                }}
              >
                <div style={{ width: 30, height: 30, borderRadius: 8, background: `${meta.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>
                  {meta.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: 'rgb(var(--fg))', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.label}</div>
                  <div style={{ fontSize: 12, color: 'rgb(var(--fg-muted))', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.sub}</div>
                </div>
                <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: `${meta.color}22`, color: meta.color, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{meta.label}</span>
              </button>
            );
          })}
        </div>

        <div style={{ padding: 8, borderTop: '1px solid rgb(var(--border))', display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'rgb(var(--fg-muted))' }}>
          <span>↑↓ navegar · ↵ abrir · esc fechar</span>
          <span>powered by UniverCert</span>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
