'use client';

// UniverCert · Workspace Switcher (S23) — dropdown na sidebar

import { useState, useTransition, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { switchWorkspaceAction, createWorkspaceAction } from '@/app/(dashboard)/workspaces/actions';

type WS = { id: string; slug: string; name: string; role: string };

export default function WorkspaceSwitcher({
  current,
  workspaces,
  collapsed,
}: {
  current: { id: string; slug: string; name: string; role: string };
  workspaces: WS[];
  collapsed?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  const handleSwitch = (wsId: string) => {
    if (wsId === current.id) { setOpen(false); return; }
    startTransition(async () => {
      const r = await switchWorkspaceAction(wsId);
      if (r.ok) {
        setOpen(false);
        router.refresh();
      } else {
        setError(r.error);
      }
    });
  };

  const handleCreate = () => {
    setError(null);
    startTransition(async () => {
      const r = await createWorkspaceAction({ name: newName, slug: newSlug || undefined });
      if (r.ok) {
        setNewName(''); setNewSlug(''); setCreating(false); setOpen(false);
        router.refresh();
      } else {
        setError(r.error);
      }
    });
  };

  const initials = current.name.split(' ').slice(0, 2).map((s) => s[0]).join('').toUpperCase();

  return (
    <div ref={wrapRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-[rgb(var(--surface-2))] transition text-left ${open ? 'bg-[rgb(var(--surface-2))]' : ''}`}
        title="Trocar workspace"
      >
        <span className="w-7 h-7 rounded-md bg-[rgb(var(--brand))] text-white text-xs font-bold flex items-center justify-center shrink-0">
          {initials.slice(0, 2)}
        </span>
        {!collapsed && (
          <>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold truncate text-[rgb(var(--fg))]">{current.name}</div>
              <div className="text-[10px] uppercase tracking-wider text-[rgb(var(--fg-subtle))]">{current.role}</div>
            </div>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[rgb(var(--fg-subtle))] shrink-0">
              <polyline points="7 9 12 4 17 9" /><polyline points="7 15 12 20 17 15" />
            </svg>
          </>
        )}
      </button>

      {open && (
        <div className="absolute top-full mt-1 left-0 right-0 bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded-lg shadow-lg z-50 overflow-hidden min-w-[240px]">
          <div className="text-[10px] uppercase tracking-wider font-semibold text-[rgb(var(--fg-subtle))] px-3 py-2 bg-[rgb(var(--surface-2))]">
            Workspaces ({workspaces.length})
          </div>
          <ul className="max-h-72 overflow-auto">
            {workspaces.map((w) => (
              <li key={w.id}>
                <button
                  onClick={() => handleSwitch(w.id)}
                  className={`w-full flex items-center gap-2 px-3 py-2 hover:bg-[rgb(var(--surface-2))] transition text-left ${
                    w.id === current.id ? 'bg-[rgb(var(--brand-soft))]' : ''
                  }`}
                  disabled={isPending}
                >
                  <span className="w-6 h-6 rounded bg-[rgb(var(--surface-2))] text-[10px] font-bold flex items-center justify-center shrink-0 text-[rgb(var(--fg-muted))]">
                    {w.name.slice(0, 2).toUpperCase()}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm truncate">{w.name}</div>
                    <div className="text-[10px] text-[rgb(var(--fg-subtle))] uppercase tracking-wider">{w.role}</div>
                  </div>
                  {w.id === current.id && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-[rgb(var(--brand))]">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
              </li>
            ))}
          </ul>

          {creating ? (
            <div className="border-t border-[rgb(var(--border))] p-3 space-y-2 bg-[rgb(var(--surface-2))]">
              <input
                type="text"
                placeholder="Nome do workspace"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="input text-sm w-full"
                autoFocus
              />
              <input
                type="text"
                placeholder="slug (opcional)"
                value={newSlug}
                onChange={(e) => setNewSlug(e.target.value)}
                className="input text-xs w-full font-mono"
              />
              {error && <div className="text-xs text-[rgb(var(--danger))]">{error}</div>}
              <div className="flex gap-2">
                <button onClick={handleCreate} disabled={!newName.trim() || isPending} className="btn-primary btn-sm flex-1 text-xs">
                  {isPending ? '…' : 'Criar'}
                </button>
                <button onClick={() => { setCreating(false); setError(null); }} className="btn-ghost btn-sm text-xs">
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setCreating(true)}
              className="w-full text-left px-3 py-2.5 text-sm text-[rgb(var(--brand))] hover:bg-[rgb(var(--brand-soft))] transition border-t border-[rgb(var(--border))] flex items-center gap-2"
            >
              <span className="text-base">+</span>
              <span>Criar novo workspace</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
