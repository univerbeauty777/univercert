-- UniverCert · payments table (Mercado Pago)
CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'mercadopago',
  external_id TEXT,
  preference_id TEXT,
  plan TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'BRL',
  status TEXT NOT NULL DEFAULT 'pending',
  payment_method TEXT,
  installments INTEGER,
  paid_at INTEGER,
  expires_at INTEGER,
  raw_payload_json TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_payments_workspace_status ON payments(workspace_id, status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_external ON payments(provider, external_id);
