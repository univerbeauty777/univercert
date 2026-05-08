-- UniverCert · Sprint 12 · fix Better Auth schema mismatch
-- Adiciona coluna `image` (Better Auth espera esse nome) sem perder `image_url`
-- Aplica via:
--   wrangler d1 execute univercert-mvp --remote --file=./drizzle/migrations/0005_better_auth_fix.sql

-- Better Auth espera 'image' (não 'image_url')
ALTER TABLE users ADD COLUMN image TEXT;

-- Better Auth pode também querer email_verified como boolean — já é INTEGER 0/1, OK
-- Better Auth pode setar `name` em accounts no Google OAuth flow — sem ação necessária.

-- Índice em email pra acelerar lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
