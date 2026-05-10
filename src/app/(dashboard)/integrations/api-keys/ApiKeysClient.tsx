'use client';

// UniverCert · API keys client UI (S39)

import { useEffect, useState } from 'react';

type Key = {
  id: string; name: string; prefix: string; scope: string;
  lastUsedAt: number | null; requestCount: number;
  expiresAt: number | null; revokedAt: number | null; createdAt: number;
};

type CreatedKey = { id: string; key: string; prefix: string };

export default function ApiKeysClient() {
  const [keys, setKeys] = useState<Key[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [created, setCreated] = useState<CreatedKey | null>(null);
  const [name, setName] = useState('');
  const [scope, setScope] = useState<'read' | 'write' | 'admin'>('read');
  const [env, setEnv] = useState<'live' | 'test'>('live');
  const [expDays, setExpDays] = useState<number | ''>('');

  const reload = async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/v1/api-keys');
      const d = await r.json();
      if (d.ok) setKeys(d.keys);
      else setError(d.message ?? d.error);
    } catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  };

  useEffect(() => { reload(); }, []);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setCreating(true); setError(null);
    try {
      const r = await fetch('/api/v1/api-keys', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), scope, env, expiresInDays: expDays || undefined }),
      });
      const d = await r.json();
      if (d.ok) {
        setCreated({ id: d.id, key: d.key, prefix: d.prefix });
        setName(''); setScope('read'); setExpDays('');
        await reload();
      } else {
        setError(d.message ?? d.error);
      }
    } catch (e) { setError((e as Error).message); }
    finally { setCreating(false); }
  };

  const handleRevoke = async (id: string, label: string) => {
    if (!confirm(`Revogar "${label}"? Essa chave para de funcionar imediatamente.`)) return;
    try {
      await fetch(`/api/v1/api-keys/${id}`, { method: 'DELETE', headers: { 'content-type': 'application/json' }, body: JSON.stringify({}) });
      await reload();
    } catch (e) { setError((e as Error).message); }
  };

  const copyKey = async () => {
    if (!created) return;
    try { await navigator.clipboard.writeText(created.key); } catch {}
  };

  return (
    <div className="space-y-4">
      {error && <div className="card text-sm text-[rgb(var(--danger))]">⚠ {error}</div>}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p className="text-sm text-[rgb(var(--fg-muted))]">
          {keys.filter((k) => !k.revokedAt).length} keys ativas
        </p>
        <button onClick={() => { setShowCreate(true); setCreated(null); }} className="btn-primary btn-sm" style={{ borderRadius: 10 }}>
          + Nova API key
        </button>
      </div>

      {/* Newly created key — shown ONCE */}
      {created && (
        <div className="card" style={{ padding: 20, background: 'rgba(16,185,129,0.05)', borderColor: '#10b981' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#059669', marginBottom: 6 }}>✓ API key criada — copie agora!</div>
          <div style={{ fontSize: 12, color: '#dc2626', marginBottom: 10 }}>⚠ Esta chave NÃO será mostrada novamente. Salve em local seguro.</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', background: '#0f172a', color: '#fff', padding: 12, borderRadius: 8, fontFamily: 'monospace', fontSize: 12 }}>
            <code style={{ flex: 1, wordBreak: 'break-all' }}>{created.key}</code>
            <button onClick={copyKey} style={{ padding: '6px 10px', background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 6, cursor: 'pointer', fontSize: 11 }}>Copiar</button>
          </div>
          <div style={{ fontSize: 12, color: 'rgb(var(--fg-muted))', marginTop: 10 }}>
            Use no header: <code>Authorization: Bearer {created.prefix}...</code>
          </div>
          <button onClick={() => setCreated(null)} className="btn-ghost btn-sm mt-3" style={{ borderRadius: 8 }}>Já salvei, ocultar</button>
        </div>
      )}

      {/* Create modal inline */}
      {showCreate && (
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Nova API key</div>
          <div className="space-y-3">
            <div>
              <label className="label">Nome</label>
              <input type="text" className="input" placeholder="Producao Zapier" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
              <div>
                <label className="label">Scope</label>
                <select className="input" value={scope} onChange={(e) => setScope(e.target.value as any)}>
                  <option value="read">Read · só consulta</option>
                  <option value="write">Write · cria/edita</option>
                  <option value="admin">Admin · tudo (cuidado!)</option>
                </select>
              </div>
              <div>
                <label className="label">Ambiente</label>
                <select className="input" value={env} onChange={(e) => setEnv(e.target.value as any)}>
                  <option value="live">Live (produção)</option>
                  <option value="test">Test (sandbox)</option>
                </select>
              </div>
              <div>
                <label className="label">Expira em (dias)</label>
                <input type="number" className="input" placeholder="vazio = nunca" value={expDays} onChange={(e) => setExpDays(e.target.value ? parseInt(e.target.value, 10) : '')} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={handleCreate} disabled={creating || !name.trim()} className="btn-primary btn-sm" style={{ borderRadius: 10 }}>
                {creating ? 'Criando…' : 'Criar key'}
              </button>
              <button onClick={() => setShowCreate(false)} className="btn-ghost btn-sm" style={{ borderRadius: 10 }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="card text-center py-12 text-sm text-[rgb(var(--fg-muted))]">Carregando…</div>
      ) : keys.length === 0 ? (
        <div className="card text-center py-12">
          <div style={{ fontSize: 40, marginBottom: 8 }}>🔑</div>
          <p className="text-sm text-[rgb(var(--fg-muted))] mb-3">Nenhuma API key ainda. Crie a primeira.</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', fontSize: 13 }}>
            <thead style={{ background: 'rgb(var(--surface-2, 248 250 252))' }}>
              <tr style={{ fontSize: 11, color: 'rgb(var(--fg-muted))', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <th style={{ padding: '10px 16px', textAlign: 'left' }}>Nome</th>
                <th style={{ padding: '10px 16px', textAlign: 'left' }}>Prefix</th>
                <th style={{ padding: '10px 16px', textAlign: 'center' }}>Scope</th>
                <th style={{ padding: '10px 16px', textAlign: 'right' }}>Reqs</th>
                <th style={{ padding: '10px 16px', textAlign: 'left' }}>Último uso</th>
                <th style={{ padding: '10px 16px' }}></th>
              </tr>
            </thead>
            <tbody>
              {keys.map((k) => {
                const isRevoked = !!k.revokedAt;
                const isExpired = k.expiresAt && k.expiresAt < Math.floor(Date.now() / 1000);
                return (
                  <tr key={k.id} style={{ borderTop: '1px solid rgb(var(--border))', opacity: isRevoked || isExpired ? 0.5 : 1 }}>
                    <td style={{ padding: '12px 16px', fontWeight: 600 }}>
                      {k.name}
                      {isRevoked && <span style={{ marginLeft: 6, fontSize: 10, padding: '2px 6px', background: 'rgba(239,68,68,0.1)', color: '#dc2626', borderRadius: 4, fontWeight: 700 }}>REVOGADA</span>}
                      {!isRevoked && isExpired && <span style={{ marginLeft: 6, fontSize: 10, padding: '2px 6px', background: 'rgba(245,158,11,0.1)', color: '#d97706', borderRadius: 4, fontWeight: 700 }}>EXPIRADA</span>}
                    </td>
                    <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: 11 }}>{k.prefix}…</td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 6, fontWeight: 700, textTransform: 'uppercase',
                        background: k.scope === 'admin' ? 'rgba(239,68,68,0.1)' : k.scope === 'write' ? 'rgba(99,102,241,0.1)' : 'rgba(100,116,139,0.1)',
                        color: k.scope === 'admin' ? '#dc2626' : k.scope === 'write' ? '#1B2D5E' : '#475569',
                      }}>{k.scope}</span>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'monospace' }}>{k.requestCount.toLocaleString('pt-BR')}</td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: 'rgb(var(--fg-muted))' }}>
                      {k.lastUsedAt ? new Date(k.lastUsedAt * 1000).toLocaleDateString('pt-BR') : 'nunca'}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      {!isRevoked && (
                        <button onClick={() => handleRevoke(k.id, k.name)} style={{ background: 'transparent', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>Revogar</button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Quick docs */}
      <div className="card" style={{ padding: 20, background: 'rgba(99,102,241,0.04)' }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>📘 Como usar</div>
        <pre style={{ fontSize: 12, fontFamily: 'monospace', background: '#0f172a', color: '#a7f3d0', padding: 14, borderRadius: 8, overflow: 'auto', margin: 0 }}>
{`curl https://univercert.net/api/v1/credentials \\
  -H "Authorization: Bearer uc_live_XXXXXX..."`}
        </pre>
        <p style={{ fontSize: 11, color: 'rgb(var(--fg-muted))', marginTop: 8 }}>
          Scope <code>read</code>: só GET. <code>write</code>: GET + POST/PATCH. <code>admin</code>: tudo + DELETE.
        </p>
      </div>
    </div>
  );
}
