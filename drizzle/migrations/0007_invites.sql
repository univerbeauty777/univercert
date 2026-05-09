-- UniverCert · Sprint 15 · Invites de usuário pra workspace (RBAC)
-- Aplica via:
--   wrangler d1 execute univercert-mvp --remote --file=./drizzle/migrations/0007_invites.sql

CREATE TABLE IF NOT EXISTS invites (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin','editor','aprovador','viewer')),
  token TEXT NOT NULL UNIQUE,
  invited_by_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  expires_at INTEGER NOT NULL,
  accepted_at INTEGER,
  accepted_by_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  revoked_at INTEGER,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_invites_workspace ON invites(workspace_id, accepted_at);
CREATE INDEX IF NOT EXISTS idx_invites_email ON invites(email, accepted_at);
CREATE INDEX IF NOT EXISTS idx_invites_token ON invites(token);
