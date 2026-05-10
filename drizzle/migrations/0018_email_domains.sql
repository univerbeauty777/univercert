-- UniverCert · Migration 0018 (S61) — workspace email sender domains

CREATE TABLE IF NOT EXISTS workspace_email_domains (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,                                  -- 'escola.com'
  from_email TEXT,                                        -- 'no-reply@escola.com'
  from_name TEXT,                                         -- 'Escola Premium'
  resend_domain_id TEXT,                                  -- ID retornado pela Resend API
  status TEXT NOT NULL DEFAULT 'pending',                 -- pending / verifying / verified / failed
  records_json TEXT,                                       -- JSON array de DNS records esperados (DKIM/SPF/DMARC)
  last_check_at INTEGER,
  verified_at INTEGER,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_email_domains_ws ON workspace_email_domains(workspace_id, status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_email_domains_domain ON workspace_email_domains(domain);
