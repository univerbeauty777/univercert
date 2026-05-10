-- UniverCert · Migration 0015 (S39 API keys)
-- api_keys: chaves externas com scope + hash + tracking de uso

CREATE TABLE IF NOT EXISTS api_keys (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  created_by_user_id TEXT,
  name TEXT NOT NULL,                       -- 'Producao zapier', 'Webhook hotmart'...
  prefix TEXT NOT NULL,                      -- 'uc_live_xxxx' (primeiros 12 chars pra UI)
  hash TEXT NOT NULL,                        -- SHA-256 da key full
  scope TEXT NOT NULL DEFAULT 'read',        -- read / write / admin
  last_used_at INTEGER,
  last_used_ip TEXT,
  request_count INTEGER NOT NULL DEFAULT 0,
  expires_at INTEGER,                        -- null = never expires
  revoked_at INTEGER,
  revoked_reason TEXT,
  metadata_json TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_api_keys_ws ON api_keys(workspace_id, created_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_active ON api_keys(workspace_id, revoked_at, expires_at);
