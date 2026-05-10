-- UniverCert · Migration 0016 (S43 + S44 + S45 + S46)
-- Marketplace + affiliate + partner + embed tracking

-- S43 — TEMPLATE MARKETPLACE
CREATE TABLE IF NOT EXISTS template_marketplace (
  id TEXT PRIMARY KEY,
  source_template_id TEXT NOT NULL,                    -- template original (workspace owner)
  source_workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  author_user_id TEXT,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',            -- beauty, education, tech, sports, mba, etc
  language TEXT NOT NULL DEFAULT 'pt',                  -- pt/en/es
  layout_json TEXT NOT NULL,                            -- snapshot do layout (V2)
  preview_url TEXT,                                      -- URL imagem preview
  downloads INTEGER NOT NULL DEFAULT 0,
  rating_avg INTEGER NOT NULL DEFAULT 0,                -- 0-50 (multiplica por 10 pra usar inteiros)
  rating_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',               -- pending/approved/rejected/featured
  is_premium INTEGER NOT NULL DEFAULT 0,                -- bool: requer plan Pro+
  price_brl_cents INTEGER NOT NULL DEFAULT 0,           -- > 0 = paid template (split com author)
  rejected_reason TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  approved_at INTEGER,
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_marketplace_status ON template_marketplace(status, downloads);
CREATE INDEX IF NOT EXISTS idx_marketplace_category ON template_marketplace(status, category, downloads);
CREATE INDEX IF NOT EXISTS idx_marketplace_author ON template_marketplace(author_user_id, created_at);

-- S44 — AFFILIATES
CREATE TABLE IF NOT EXISTS affiliates (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL UNIQUE REFERENCES workspaces(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,                            -- 'JOAOSILVA', 'liso-blindado'
  tier TEXT NOT NULL DEFAULT 'standard',                -- standard (10%) / educator (20%) / vip (custom)
  commission_pct INTEGER NOT NULL DEFAULT 10,           -- 10 = 10%
  payout_method TEXT,                                    -- pix / wise / bank
  payout_details_json TEXT,                              -- {pixKey:..., bankAccount:...}
  total_signups INTEGER NOT NULL DEFAULT 0,
  total_paying_referred INTEGER NOT NULL DEFAULT 0,
  total_commission_brl_cents INTEGER NOT NULL DEFAULT 0,
  total_paid_brl_cents INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',                -- active / suspended
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_affiliates_code ON affiliates(code);

-- Cada signup/conversão atribuída a um affiliate
CREATE TABLE IF NOT EXISTS referrals (
  id TEXT PRIMARY KEY,
  affiliate_id TEXT NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  referred_user_id TEXT,
  referred_workspace_id TEXT,
  status TEXT NOT NULL DEFAULT 'signup',                -- signup / paying / churned
  first_payment_at INTEGER,
  total_paid_by_referred_brl_cents INTEGER NOT NULL DEFAULT 0,
  commission_earned_brl_cents INTEGER NOT NULL DEFAULT 0,
  source TEXT,                                           -- landing / blog / social / etc
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_referrals_affiliate ON referrals(affiliate_id, status, created_at);
CREATE INDEX IF NOT EXISTS idx_referrals_user ON referrals(referred_user_id);

-- S45 — PARTNER APPLICATIONS (educator program)
CREATE TABLE IF NOT EXISTS partner_applications (
  id TEXT PRIMARY KEY,
  user_email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  audience_size INTEGER,                                 -- numero estimado de seguidores/alunos
  niche TEXT,                                            -- 'cabelo', 'estetica', 'tech', etc
  channels_json TEXT,                                    -- ['instagram', 'youtube', 'site']
  motivation TEXT,
  status TEXT NOT NULL DEFAULT 'pending',                -- pending / approved / rejected
  affiliate_id TEXT,                                     -- preenche apos approve
  reviewed_by TEXT,
  reviewed_at INTEGER,
  rejected_reason TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_partner_apps_status ON partner_applications(status, created_at);

-- S46 — EMBED BADGE VIEWS (tracking de quem renderizou nosso badge.js)
CREATE TABLE IF NOT EXISTS embed_views (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  variant TEXT NOT NULL DEFAULT 'badge',                -- badge / counter / featured
  referer_domain TEXT,
  user_agent TEXT,
  ip_hash TEXT,
  occurred_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_embed_views_ws ON embed_views(workspace_id, occurred_at);
CREATE INDEX IF NOT EXISTS idx_embed_views_referer ON embed_views(workspace_id, referer_domain, occurred_at);
