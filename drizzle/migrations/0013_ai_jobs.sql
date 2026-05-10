-- UniverCert · Migration 0013 (S28 AI)
-- ai_jobs: tracking de cada chamada AI (custo, tokens, resultado)

CREATE TABLE IF NOT EXISTS ai_jobs (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id TEXT,
  job_type TEXT NOT NULL,           -- generate_template / validate_photo / suggest_improvements
  model TEXT NOT NULL,              -- claude-haiku-4-5 / claude-sonnet-4-6
  status TEXT NOT NULL DEFAULT 'pending',  -- pending / completed / failed
  input_summary TEXT,                -- resumo curto do input (UI list)
  input_tokens INTEGER,
  output_tokens INTEGER,
  cost_brl_cents INTEGER,            -- custo em centavos BRL (usd * 5.5 * 100)
  result_json TEXT,
  error_message TEXT,
  duration_ms INTEGER,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  completed_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_ai_jobs_ws ON ai_jobs(workspace_id, created_at);
CREATE INDEX IF NOT EXISTS idx_ai_jobs_type ON ai_jobs(workspace_id, job_type, created_at);
CREATE INDEX IF NOT EXISTS idx_ai_jobs_status ON ai_jobs(status, created_at);
