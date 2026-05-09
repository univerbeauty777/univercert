-- UniverCert · Sprint 17 · Workflows custom (email/WhatsApp templates)
-- Aplica via:
--   wrangler d1 execute univercert-mvp --remote --file=./drizzle/migrations/0006_workflows.sql

CREATE TABLE IF NOT EXISTS workflows (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('email','whatsapp')),
  trigger_event TEXT NOT NULL CHECK (trigger_event IN ('credential.issued','credential.revoked','request.created','nps.d7')),
  subject TEXT,                  -- só email
  body_template TEXT NOT NULL,   -- markdown ou plain com {{variables}}
  is_active INTEGER NOT NULL DEFAULT 1,
  delay_seconds INTEGER NOT NULL DEFAULT 0,    -- agendamento (0 = imediato)
  ab_subject_b TEXT,             -- pra A/B test (50/50)
  metadata_json TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_workflows_workspace ON workflows(workspace_id, trigger_event, is_active);
CREATE INDEX IF NOT EXISTS idx_workflows_workspace_channel ON workflows(workspace_id, channel);
