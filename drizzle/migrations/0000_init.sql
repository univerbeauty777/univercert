-- UniverCert · D1 schema v0 · gerado em 2026-05-08
-- Aplicado no D1 univercert-mvp (id: 161fc60a-d5d3-4722-8c04-d8120f2682bc)
-- Para reaplicar: wrangler d1 execute univercert-mvp --file=./drizzle/migrations/0000_init.sql

-- 1. WORKSPACES
CREATE TABLE IF NOT EXISTS workspaces (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  plan TEXT NOT NULL DEFAULT 'free',
  status TEXT NOT NULL DEFAULT 'active',
  custom_domain TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- 2. USERS
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  image_url TEXT,
  password_hash TEXT,
  email_verified INTEGER NOT NULL DEFAULT 0,
  last_login_at INTEGER,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- 3. WORKSPACE MEMBERS
CREATE TABLE IF NOT EXISTS workspace_members (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin','editor','aprovador','viewer')),
  invited_at INTEGER NOT NULL DEFAULT (unixepoch()),
  accepted_at INTEGER,
  UNIQUE(workspace_id, user_id)
);

-- 4. BRAND KITS
CREATE TABLE IF NOT EXISTS brand_kits (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL UNIQUE REFERENCES workspaces(id) ON DELETE CASCADE,
  logo_url TEXT,
  favicon_url TEXT,
  primary_color TEXT DEFAULT '#6366F1',
  secondary_color TEXT DEFAULT '#EC4899',
  font_family TEXT DEFAULT 'Inter',
  email_sender_name TEXT,
  email_sender_domain TEXT,
  whatsapp_phone_id TEXT,
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- 5. TEMPLATES
CREATE TABLE IF NOT EXISTS templates (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  vertical TEXT,
  layout_json TEXT NOT NULL,
  thumbnail_url TEXT,
  is_published INTEGER NOT NULL DEFAULT 0,
  created_by TEXT REFERENCES users(id),
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_templates_workspace ON templates(workspace_id, is_published);

-- 6. RECIPIENTS
CREATE TABLE IF NOT EXISTS recipients (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  cpf TEXT,
  name TEXT NOT NULL,
  email TEXT,
  phone_whatsapp TEXT,
  lgpd_consent_at INTEGER,
  metadata_json TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_recipients_workspace_cpf ON recipients(workspace_id, cpf);
CREATE INDEX IF NOT EXISTS idx_recipients_workspace_email ON recipients(workspace_id, email);

-- 7. CERTIFICATE REQUESTS (fila Fluent → form → fila → emit)
CREATE TABLE IF NOT EXISTS certificate_requests (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  recipient_id TEXT REFERENCES recipients(id) ON DELETE SET NULL,
  template_id TEXT REFERENCES templates(id) ON DELETE SET NULL,
  source TEXT NOT NULL CHECK (source IN ('form','webhook','manual','csv')),
  source_data_json TEXT,
  course_name TEXT,
  course_hours INTEGER,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','emitted')),
  reviewer_id TEXT REFERENCES users(id),
  reviewed_at INTEGER,
  rejection_reason TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_requests_workspace_status ON certificate_requests(workspace_id, status, created_at);

-- 8. CREDENTIALS
CREATE TABLE IF NOT EXISTS credentials (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  request_id TEXT REFERENCES certificate_requests(id) ON DELETE SET NULL,
  template_id TEXT REFERENCES templates(id) ON DELETE SET NULL,
  recipient_id TEXT NOT NULL REFERENCES recipients(id) ON DELETE CASCADE,
  pdf_r2_key TEXT,
  png_r2_key TEXT,
  hash_sha256 TEXT NOT NULL,
  course_name TEXT NOT NULL,
  course_hours INTEGER,
  metadata_json TEXT,
  issued_at INTEGER NOT NULL DEFAULT (unixepoch()),
  expires_at INTEGER,
  revoked_at INTEGER,
  revoke_reason TEXT
);
CREATE INDEX IF NOT EXISTS idx_credentials_workspace_recipient ON credentials(workspace_id, recipient_id);
CREATE INDEX IF NOT EXISTS idx_credentials_hash ON credentials(hash_sha256);

-- 9. VERIFY LOGS
CREATE TABLE IF NOT EXISTS verify_logs (
  id TEXT PRIMARY KEY,
  credential_id TEXT NOT NULL REFERENCES credentials(id) ON DELETE CASCADE,
  viewed_at INTEGER NOT NULL DEFAULT (unixepoch()),
  ip_country TEXT,
  ip_city TEXT,
  user_agent TEXT,
  referer TEXT
);
CREATE INDEX IF NOT EXISTS idx_verify_credential ON verify_logs(credential_id, viewed_at);

-- 10. INTEGRATIONS
CREATE TABLE IF NOT EXISTS integrations (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('hotmart','memberkit','fluent','kiwify','eduzz','hubla','greenn','wordpress','zapier','api')),
  config_json TEXT NOT NULL,
  webhook_secret TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_integrations_workspace ON integrations(workspace_id, provider);

-- 11. WEBHOOKS IN
CREATE TABLE IF NOT EXISTS webhooks_in (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  integration_id TEXT REFERENCES integrations(id) ON DELETE SET NULL,
  provider TEXT NOT NULL,
  raw_payload_json TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'received' CHECK (status IN ('received','processed','error')),
  error_message TEXT,
  processed_at INTEGER,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_webhooks_in_workspace ON webhooks_in(workspace_id, status, created_at);

-- 12. WEBHOOKS OUT
CREATE TABLE IF NOT EXISTS webhooks_out (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  target_url TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sent','failed')),
  response_status INTEGER,
  attempts INTEGER NOT NULL DEFAULT 0,
  next_retry_at INTEGER,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_webhooks_out_workspace ON webhooks_out(workspace_id, status);

-- 13. AUDIT LOGS
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id),
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  metadata_json TEXT,
  ip TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_audit_workspace_created ON audit_logs(workspace_id, created_at DESC);

-- 14. BILLING METER
CREATE TABLE IF NOT EXISTS billing_meter (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  period_start INTEGER NOT NULL,
  period_end INTEGER NOT NULL,
  certificates_emitted INTEGER NOT NULL DEFAULT 0,
  whatsapps_sent INTEGER NOT NULL DEFAULT 0,
  emails_sent INTEGER NOT NULL DEFAULT 0,
  storage_bytes INTEGER NOT NULL DEFAULT 0,
  UNIQUE(workspace_id, period_start)
);

-- 15. SESSIONS (Better Auth)
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at INTEGER NOT NULL,
  ip TEXT,
  user_agent TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
