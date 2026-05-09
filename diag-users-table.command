#!/bin/bash
# UniverCert · Diag da tabela users — descobrir por que INSERT falha
set -e
cd "$(dirname "$0")"

echo "1. PRAGMA table_info(users) — colunas reais:"
npx wrangler d1 execute univercert-mvp --remote --command "PRAGMA table_info(users)" 2>&1 | tail -100
echo
echo
echo "2. PRAGMA table_info(accounts):"
npx wrangler d1 execute univercert-mvp --remote --command "PRAGMA table_info(accounts)" 2>&1 | tail -80
echo
echo
echo "3. Tentando INSERT manual de teste:"
npx wrangler d1 execute univercert-mvp --remote --command "
INSERT INTO users (id, email, name, email_verified, created_at, updated_at)
VALUES ('test_diag_$(date +%s)', 'diagtest$(date +%s)@test.com', 'Diag Test', 0, unixepoch(), unixepoch())
" 2>&1 | tail -10
echo
echo
echo "4. Quantos users existem agora:"
npx wrangler d1 execute univercert-mvp --remote --command "SELECT count(*) FROM users" 2>&1 | tail -10
echo
echo "[Pressione Enter pra fechar]"
read
