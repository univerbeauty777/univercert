-- UniverCert · Migration 0012 (S26 + S29 + S31)
-- share_events: tracking de cada share/wallet add
-- workspace_brand: branding pra issuer pages /escola/[slug]

CREATE TABLE IF NOT EXISTS share_events (
  id TEXT PRIMARY KEY,
  credential_id TEXT NOT NULL REFERENCES credentials(id) ON DELETE CASCADE,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  channel TEXT NOT NULL,             -- linkedin / whatsapp / instagram / twitter / facebook / email / wallet_apple / wallet_google / direct
  ip_hash TEXT,                       -- SHA-256 hash do IP (LGPD)
  user_agent TEXT,
  referer TEXT,
  occurred_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_share_events_cred ON share_events(credential_id, occurred_at);
CREATE INDEX IF NOT EXISTS idx_share_events_ws ON share_events(workspace_id, occurred_at);
CREATE INDEX IF NOT EXISTS idx_share_events_channel ON share_events(workspace_id, channel, occurred_at);

CREATE TABLE IF NOT EXISTS workspace_brand (
  workspace_id TEXT PRIMARY KEY REFERENCES workspaces(id) ON DELETE CASCADE,
  display_name TEXT,                 -- nome publico (default: workspaces.name)
  tagline TEXT,                       -- 'A maior escola de cabelo do Brasil'
  description TEXT,                   -- bio longa pra issuer page
  logo_url TEXT,                      -- url R2 ou externa
  cover_url TEXT,                     -- banner da issuer page
  brand_color TEXT,                   -- hex #RRGGBB pra accent
  website_url TEXT,
  social_instagram TEXT,
  social_youtube TEXT,
  social_linkedin TEXT,
  email_public TEXT,
  show_cert_count INTEGER NOT NULL DEFAULT 1,        -- bool: mostra '1.234 certs emitidos'
  show_recent_certs INTEGER NOT NULL DEFAULT 1,      -- bool: mostra grid de certs recentes
  show_courses INTEGER NOT NULL DEFAULT 1,           -- bool: lista cursos
  testimonials_json TEXT,                            -- JSON array de testimonials
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Issuer page DID (Decentralized Identifier) pra Open Badges 3.0 / W3C VC
CREATE TABLE IF NOT EXISTS issuer_keys (
  workspace_id TEXT PRIMARY KEY REFERENCES workspaces(id) ON DELETE CASCADE,
  did TEXT NOT NULL,                                 -- did:web:univercert.com.br:escola:slug
  public_key_jwk TEXT,                               -- JWK pub key (issuer pode publicar)
  -- private key NEVER stored — assinatura via Cloudflare Workers Web Crypto API
  algorithm TEXT NOT NULL DEFAULT 'EdDSA',
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
