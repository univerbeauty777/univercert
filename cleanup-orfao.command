#!/bin/bash
# UniverCert · Cleanup completo do user orfao + cadastro fresh
# Roda DEPOIS do godmode-signup.command terminar (build verde + push aplicado)

set -e
cd "$(dirname "$0")"

echo
echo "========================================================="
echo "CLEANUP ORFAO + CADASTRO FRESH"
echo "========================================================="
echo

read -s -p "Senha pra conta admin (>=8 chars): " SENHA_ADMIN
echo
if [ ${#SENHA_ADMIN} -lt 8 ]; then
  echo "ERRO: senha precisa ter ao menos 8 caracteres"
  read -p "[Enter pra fechar]"
  exit 1
fi
echo

EMAIL="diegoxp12@me.com"

echo "1. Cleanup completo (todas as FKs)..."
npx wrangler d1 execute univercert-mvp --remote --command "
PRAGMA defer_foreign_keys = ON;
UPDATE templates SET created_by = NULL WHERE created_by IN (SELECT id FROM users WHERE lower(email)='$EMAIL');
UPDATE requests SET reviewer_id = NULL WHERE reviewer_id IN (SELECT id FROM users WHERE lower(email)='$EMAIL');
DELETE FROM audit_logs WHERE user_id IN (SELECT id FROM users WHERE lower(email)='$EMAIL');
UPDATE invites SET invited_by_user_id = NULL WHERE invited_by_user_id IN (SELECT id FROM users WHERE lower(email)='$EMAIL');
UPDATE invites SET accepted_by_user_id = NULL WHERE accepted_by_user_id IN (SELECT id FROM users WHERE lower(email)='$EMAIL');
DELETE FROM sessions WHERE user_id IN (SELECT id FROM users WHERE lower(email)='$EMAIL');
DELETE FROM accounts WHERE user_id IN (SELECT id FROM users WHERE lower(email)='$EMAIL');
DELETE FROM workspace_members WHERE user_id IN (SELECT id FROM users WHERE lower(email)='$EMAIL');
DELETE FROM users WHERE lower(email)='$EMAIL';
" 2>&1 | tail -8
echo

echo "2. Smoke test signup com email/senha real..."
SIGNUP=$(curl -s -X POST https://univercert.pages.dev/api/auth/sign-up/email \
  -H 'Content-Type: application/json' \
  -d "{\"name\":\"Diego Admin\",\"email\":\"$EMAIL\",\"password\":\"$SENHA_ADMIN\"}")
echo "Resposta signup:"
echo "$SIGNUP" | head -c 400
echo
echo

echo "3. Smoke test signin..."
SIGNIN=$(curl -s -X POST https://univercert.pages.dev/api/auth/sign-in/email \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$SENHA_ADMIN\"}")
echo "Resposta signin:"
echo "$SIGNIN" | head -c 400
echo
echo

if echo "$SIGNUP$SIGNIN" | grep -q '"user"'; then
  echo "========================================================="
  echo "OK! Conta criada e login funciona."
  echo "========================================================="
  echo "Abre: https://univercert.pages.dev/sign-in"
  echo "      Email: $EMAIL"
  echo "      Senha: (a que voce digitou)"
else
  echo "========================================================="
  echo "AINDA NAO. Resposta acima indica o problema."
  echo "========================================================="
fi

echo
echo "[Pressione Enter pra fechar]"
read
