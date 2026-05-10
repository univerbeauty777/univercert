-- UniverCert · Migration 0014 (S35 Billing)
-- subscriptions: cada workspace tem 0..1 active sub
-- invoices: historico billing
-- usage_meters: contador mensal de cert emit p/ plan limit

CREATE TABLE IF NOT EXISTS subscriptions (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL UNIQUE REFERENCES workspaces(id) ON DELETE CASCADE,
  plan TEXT NOT NULL DEFAULT 'free',           -- free/starter/pro/enterprise
  status TEXT NOT NULL DEFAULT 'active',       -- active/trialing/past_due/canceled/paused
  provider TEXT,                                -- stripe / pagarme / null (free)
  provider_customer_id TEXT,                    -- cus_xxx (stripe) ou cust_id (pagarme)
  provider_subscription_id TEXT,                -- sub_xxx (stripe) ou sub_id (pagarme)
  current_period_start INTEGER,                 -- unix
  current_period_end INTEGER,                   -- unix
  cancel_at_period_end INTEGER NOT NULL DEFAULT 0,
  trial_ends_at INTEGER,
  amount_brl_cents INTEGER,                     -- preco/mes em centavos
  metadata_json TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_subs_status ON subscriptions(status, current_period_end);
CREATE INDEX IF NOT EXISTS idx_subs_provider_id ON subscriptions(provider, provider_subscription_id);

CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  subscription_id TEXT REFERENCES subscriptions(id) ON DELETE SET NULL,
  provider TEXT NOT NULL,
  provider_invoice_id TEXT NOT NULL,
  status TEXT NOT NULL,                         -- paid/open/void/uncollectible/failed
  amount_brl_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'BRL',
  description TEXT,
  invoice_pdf_url TEXT,
  paid_at INTEGER,
  due_at INTEGER,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_invoices_ws ON invoices(workspace_id, created_at);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status, due_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_invoices_provider ON invoices(provider, provider_invoice_id);

CREATE TABLE IF NOT EXISTS usage_meters (
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  period_ym TEXT NOT NULL,                      -- '2026-05' (YYYY-MM)
  certs_emitted INTEGER NOT NULL DEFAULT 0,
  ai_jobs_count INTEGER NOT NULL DEFAULT 0,
  ai_cost_brl_cents INTEGER NOT NULL DEFAULT 0,
  storage_bytes INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  PRIMARY KEY (workspace_id, period_ym)
);

CREATE INDEX IF NOT EXISTS idx_usage_period ON usage_meters(period_ym, certs_emitted);
