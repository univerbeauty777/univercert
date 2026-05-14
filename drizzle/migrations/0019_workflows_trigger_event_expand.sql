-- UniverCert · expand workflows.trigger_event CHECK constraint
-- Sprint 25 hotfix: schema documents 'request.submitted' and
-- 'request.needs_revision' but 0006_workflows.sql CHECK rejects them.
-- SQLite cannot ALTER CHECK in place; recreate table preserving data.
--
-- Apply via:
--   wrangler d1 execute univercert-mvp --remote --file=./drizzle/migrations/0019_workflows_trigger_event_expand.sql

CREATE TABLE IF NOT EXISTS workflows_new (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('email','whatsapp')),
  trigger_event TEXT NOT NULL CHECK (trigger_event IN (
    'credential.issued',
    'credential.revoked',
    'request.created',
    'request.submitted',
    'request.needs_revision',
    'nps.d7'
  )),
  subject TEXT,
  body_template TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  delay_seconds INTEGER NOT NULL DEFAULT 0,
  ab_subject_b TEXT,
  metadata_json TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

INSERT INTO workflows_new (
  id, workspace_id, name, channel, trigger_event, subject, body_template,
  is_active, delay_seconds, ab_subject_b, metadata_json, created_at, updated_at
)
SELECT
  id, workspace_id, name, channel, trigger_event, subject, body_template,
  is_active, delay_seconds, ab_subject_b, metadata_json, created_at, updated_at
FROM workflows;

DROP TABLE workflows;
ALTER TABLE workflows_new RENAME TO workflows;

CREATE INDEX IF NOT EXISTS idx_workflows_workspace ON workflows(workspace_id, trigger_event, is_active);
CREATE INDEX IF NOT EXISTS idx_workflows_workspace_channel ON workflows(workspace_id, channel);
