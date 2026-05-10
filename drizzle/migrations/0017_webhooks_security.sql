-- UniverCert · Migration 0017 (S40 + S41)
-- webhook_endpoints + webhook_deliveries + workspace_security (2FA/IP)

CREATE TABLE IF NOT EXISTS webhook_endpoints (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  created_by_user_id TEXT,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  secret TEXT NOT NULL,                       -- HMAC SHA-256 secret
  events_json TEXT NOT NULL,                   -- JSON array: ["cert.issued","cert.revoked","request.submitted","request.approved","request.needs_revision"]
  status TEXT NOT NULL DEFAULT 'active',       -- active / disabled / failing
  total_deliveries INTEGER NOT NULL DEFAULT 0,
  total_failures INTEGER NOT NULL DEFAULT 0,
  last_success_at INTEGER,
  last_failure_at INTEGER,
  last_failure_reason TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_webhook_endpoints_ws ON webhook_endpoints(workspace_id, status, created_at);

CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id TEXT PRIMARY KEY,
  endpoint_id TEXT NOT NULL REFERENCES webhook_endpoints(id) ON DELETE CASCADE,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_id TEXT,                                -- ID do recurso (cred_xxx, req_xxx)
  payload_json TEXT NOT NULL,
  response_status INTEGER,
  response_body TEXT,                            -- truncado a 500 chars
  attempt_count INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 5,
  next_retry_at INTEGER,
  delivered_at INTEGER,
  duration_ms INTEGER,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_endpoint ON webhook_deliveries(endpoint_id, created_at);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_pending ON webhook_deliveries(next_retry_at, attempt_count, max_attempts);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_event ON webhook_deliveries(workspace_id, event_type, created_at);

CREATE TABLE IF NOT EXISTS workspace_security (
  workspace_id TEXT PRIMARY KEY REFERENCES workspaces(id) ON DELETE CASCADE,
  enforce_2fa INTEGER NOT NULL DEFAULT 0,            -- bool
  ip_allowlist_json TEXT,                            -- JSON array de CIDR (ex: ["189.0.0.0/8","2001::/16"])
  api_ip_allowlist_json TEXT,                        -- ip allowlist apenas pra /api/v1/*
  session_max_minutes INTEGER NOT NULL DEFAULT 1440, -- 24h default
  password_min_length INTEGER NOT NULL DEFAULT 8,
  require_strong_password INTEGER NOT NULL DEFAULT 0,
  updated_by_user_id TEXT,
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- 2FA secrets (TOTP) — separate table pra audit
CREATE TABLE IF NOT EXISTS user_2fa (
  user_id TEXT PRIMARY KEY,
  secret TEXT NOT NULL,                              -- TOTP base32 secret
  backup_codes_hash TEXT,                            -- SHA-256 hashed (cada code separado por '\n')
  enabled_at INTEGER NOT NULL DEFAULT (unixepoch()),
  last_used_at INTEGER
);
