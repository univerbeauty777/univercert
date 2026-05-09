-- UniverCert · Migration 0008 · Hotfix Better Auth signup
-- Sintoma: POST /api/auth/sign-up/email retorna 500 com body vazio.
-- Causa: Better Auth tenta inserir em sessions.ip_address e sessions.updated_at,
--        mas a tabela tem coluna 'ip' (não 'ip_address') e não tem updated_at.

-- 1. Adicionar ip_address (e migrar valores antigos de ip)
ALTER TABLE sessions ADD COLUMN ip_address TEXT;
UPDATE sessions SET ip_address = ip WHERE ip IS NOT NULL;

-- 2. Adicionar updated_at (default = created_at)
ALTER TABLE sessions ADD COLUMN updated_at INTEGER NOT NULL DEFAULT (unixepoch());
