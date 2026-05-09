-- UniverCert · Migration 0011 · S22c Assets library
-- Registra cada upload R2 numa tabela pra reutilizacao + storage management.

CREATE TABLE IF NOT EXISTS assets (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  r2_key TEXT NOT NULL UNIQUE,
  kind TEXT NOT NULL,                       -- 'background' | 'logo' | 'signature' | 'seal' | 'misc' | 'font'
  content_type TEXT,
  size_bytes INTEGER,
  original_name TEXT,
  template_id TEXT,                         -- opcional: vinculado a um template
  uploaded_by TEXT,                         -- user id (opcional)
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_assets_workspace ON assets(workspace_id, kind, created_at);
CREATE INDEX IF NOT EXISTS idx_assets_r2_key ON assets(r2_key);

-- Layout V2 ja suporta pageSize via JSON. Nao precisa migrar coluna.
