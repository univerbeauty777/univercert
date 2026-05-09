-- UniverCert · Migration 0009 · S18 Observability + Email events
-- Cria 2 tabelas pra rastreamento:
--   email_events: log de envio/falha de email via Resend
--   error_events: log de errors 5xx capturados via captureError()

CREATE TABLE IF NOT EXISTS email_events (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  subject TEXT,
  body_preview TEXT,                  -- primeiros 200 chars do body pra preview
  status TEXT NOT NULL,               -- 'queued' | 'sent' | 'failed' | 'bounced' | 'opened' | 'clicked'
  provider TEXT DEFAULT 'resend',
  provider_message_id TEXT,           -- Resend retorna 'id' (uuid)
  error_message TEXT,
  workflow_id TEXT,
  credential_id TEXT,
  triggered_by_event TEXT,            -- 'credential.issued' / 'credential.revoked' / etc
  sent_at INTEGER,
  opened_at INTEGER,
  clicked_at INTEGER,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
  FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE SET NULL,
  FOREIGN KEY (credential_id) REFERENCES credentials(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_email_events_workspace ON email_events(workspace_id, created_at);
CREATE INDEX IF NOT EXISTS idx_email_events_status ON email_events(status);
CREATE INDEX IF NOT EXISTS idx_email_events_provider_msg ON email_events(provider_message_id);

CREATE TABLE IF NOT EXISTS error_events (
  id TEXT PRIMARY KEY,
  path TEXT NOT NULL,
  method TEXT,
  status_code INTEGER,
  error_message TEXT,
  error_stack TEXT,
  user_agent TEXT,
  ip_address TEXT,
  user_id TEXT,
  workspace_id TEXT,
  metadata_json TEXT,
  occurred_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_error_events_recent ON error_events(occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_events_path ON error_events(path);
