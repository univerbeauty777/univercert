#!/bin/bash
# UniverCert · Cleanup orfao v2 — sem tabela requests (que nao existe em prod)
set -e
cd "$(dirname "$0")"

echo
echo "========================================================="
echo "CLEANUP V2 + CADASTRO FRESH"
echo "========================================================="
echo

read -s -p "Senha pra conta admin (>=8 chars): " SENHA_ADMIN
echo
if [ ${#SENHA_ADMIN} -lt 8 ]; then
  echo "ERRO: senha precisa ter ao menos 8 caracteres"
  read -p "[Enter]"; exit 1
fi
echo

EMAIL="diegoxp12@me.com"

echo "1. Listando tabelas reais do D1 prod..."
TABLES=$(npx wrangler d1 execute univercert-mvp --remote --command \
  "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name" 2>/dev/null \
  | grep -v "^$" | tail -30)
echo "$TABLES"
echo

echo "2. Achando user_id orfao..."
USER_ID_ROW=$(npx wrangler d1 execute univercert-mvp --remote --command \
  "SELECT id FROM users WHERE lower(email)='$EMAIL' LIMIT 1" 2>&1 | tail -10)
echo "$USER_ID_ROW"
echo

echo "3. Cleanup nas tabelas que EXISTEM..."
# defer FKs e roda cada DELETE/UPDATE em sequencia, ignorando erro de tabela inexistente
npx wrangler d1 execute univercert-mvp --remote --command "
PRAGMA defer_foreign_keys = ON;
UPDATE templates SET created_by = NULL WHERE created_by IN (SELECT id FROM users WHERE lower(email)='$EMAIL');
" 2>&1 | tail -3
npx wrangler d1 execute univercert-mvp --remote --command "
DELETE FROM audit_logs WHERE user_id IN (SELECT id FROM users WHERE lower(email)='$EMAIL');
" 2>&1 | tail -3
npx wrangler d1 execute univercert-mvp --remote --command "
DELETE FROM sessions WHERE user_id IN (SELECT id FROM users WHERE lower(email)='$EMAIL');
DELETE FROM accounts WHERE user_id IN (SELECT id FROM users WHERE lower(email)='$EMAIL');
DELETE FROM workspace_members WHERE user_id IN (SELECT id FROM users WHERE lower(email)='$EMAIL');
DELETE FROM users WHERE lower(email)='$EMAIL';
" 2>&1 | tail -8
echo

echo "4. Confirmando user nao existe mais..."
npx wrangler d1 execute univercert-mvp --remote --command \
  "SELECT count(*) as still_there FROM users WHERE lower(email)='$EMAIL'" 2>&1 | tail -5
echo

echo "5. Smoke test signup..."
SIGNUP=$(curl -s -X POST https://univercert.pages.dev/api/auth/sign-up/email \
  -H 'Content-Type: application/json' \
  -d "{\"name\":\"Diego Admin\",\"email\":\"$EMAIL\",\"password\":\"$SENHA_ADMIN\"}")
echo "$SIGNUP" | head -c 400
echo
echo

echo "6. Smoke test signin..."
SIGNIN=$(curl -s -X POST https://univercert.pages.dev/api/auth/sign-in/email \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$SENHA_ADMIN\"}")
echo "$SIGNIN" | head -c 400
echo
echo

if echo "$SIGNUP" | grep -q '"user"' && echo "$SIGNIN" | grep -q '"user"'; then
  echo "========================================================="
  echo "VITORIA TOTAL — login funciona"
  echo "========================================================="
  echo "Abre: https://univercert.pages.dev/sign-in"
  echo "Email: $EMAIL"
  echo "Senha: (a que voce digitou)"
else
  echo "========================================================="
  echo "Inspeciona output acima"
  echo "========================================================="
fi

echo
echo "[Pressione Enter pra fechar]"
read
