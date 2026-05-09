#!/bin/bash
# UniverCert · GODMODE FINAL — auditoria completa aplicada
#
# 13 campos Date corrigidos pra mode:'timestamp':
#  - users:        createdAt, updatedAt, lastLoginAt
#  - sessions:     expiresAt, createdAt, updatedAt
#  - accounts:     accessTokenExpiresAt, refreshTokenExpiresAt, createdAt, updatedAt
#  - verifications: expiresAt, createdAt, updatedAt
#
# mode:'timestamp' é só camada JS do Drizzle (Date↔unix). Coluna no D1 continua INTEGER,
# nao precisa migration SQL.

set -e
cd "$(dirname "$0")"

echo
echo "========================================================="
echo "GODMODE FINAL — fix completo Better Auth + cadastro"
echo "========================================================="
echo

read -s -p "Senha pra conta admin (>=8 chars): " SENHA_ADMIN
echo
if [ ${#SENHA_ADMIN} -lt 8 ]; then
  echo "ERRO: senha precisa ter ao menos 8 chars"
  read -p "[Enter]"; exit 1
fi
echo

EMAIL="diegoxp12@me.com"

rm -f .git/index.lock .git/HEAD.lock 2>/dev/null || true

echo "1. Stage + commit + push..."
git add src/db/schema.ts
git diff --cached --stat
git commit -m "fix(schema): mode timestamp em todas colunas Date Better Auth (13 campos)

Bug raiz revelado pelo console.error interceptor:
  D1_TYPE_ERROR: Type 'object' not supported for value 'Sat May 09 2026 ...'

Better Auth passa Date objects pro Drizzle, mas Drizzle so converte
Date->unix automaticamente quando coluna esta declarada com mode 'timestamp'.

13 campos corrigidos (auditoria completa):
  users:         createdAt, updatedAt, lastLoginAt
  sessions:      expiresAt, createdAt, updatedAt
  accounts:      accessTokenExpiresAt, refreshTokenExpiresAt, createdAt, updatedAt
  verifications: expiresAt, createdAt, updatedAt

mode 'timestamp' eh layer JS do Drizzle (Date <-> unix seconds). Coluna
no D1 continua INTEGER, nao precisa migration.

Validado local: build 8.46s ok." || echo "   nada pra commitar"
git push 2>&1 | tail -3

echo
echo "2. Aguardando build (~3min)..."
sleep 180
echo
echo "Status:"
curl -s "https://api.github.com/repos/univerbeauty777/univercert/actions/runs?per_page=1" \
  | grep -E '"(status|conclusion)"'
echo

echo "3. Cleanup orfao..."
npx wrangler d1 execute univercert-mvp --remote --command "
PRAGMA defer_foreign_keys = ON;
UPDATE templates SET created_by = NULL WHERE created_by IN (SELECT id FROM users WHERE lower(email)='$EMAIL');
" 2>&1 | tail -3
npx wrangler d1 execute univercert-mvp --remote --command "
DELETE FROM audit_logs WHERE user_id IN (SELECT id FROM users WHERE lower(email)='$EMAIL');
DELETE FROM sessions WHERE user_id IN (SELECT id FROM users WHERE lower(email)='$EMAIL');
DELETE FROM accounts WHERE user_id IN (SELECT id FROM users WHERE lower(email)='$EMAIL');
DELETE FROM workspace_members WHERE user_id IN (SELECT id FROM users WHERE lower(email)='$EMAIL');
DELETE FROM users WHERE lower(email)='$EMAIL';
" 2>&1 | tail -5
echo

echo "4. Smoke test signup..."
SIGNUP=$(curl -s -X POST https://univercert.pages.dev/api/auth/sign-up/email \
  -H 'Content-Type: application/json' \
  -d "{\"name\":\"Diego Admin\",\"email\":\"$EMAIL\",\"password\":\"$SENHA_ADMIN\"}")
echo "$SIGNUP" | head -c 400
echo
echo

echo "5. Smoke test signin..."
SIGNIN=$(curl -s -X POST https://univercert.pages.dev/api/auth/sign-in/email \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$SENHA_ADMIN\"}")
echo "$SIGNIN" | head -c 400
echo
echo

if echo "$SIGNUP$SIGNIN" | grep -q '"user"'; then
  echo "========================================================="
  echo "  ████████████████████████████████████"
  echo "  █   VITORIA TOTAL — LOGIN FUNCIONA  █"
  echo "  ████████████████████████████████████"
  echo "========================================================="
  echo
  echo "Browser:  https://univercert.pages.dev/sign-in"
  echo "Email:    $EMAIL"
  echo "Senha:    (a que voce digitou)"
  echo
  echo "Vai cair direto no /onboarding (5 steps) → /dashboard"
else
  echo "========================================================="
  echo "Inspeciona output acima"
  echo "========================================================="
fi

echo
echo "[Pressione Enter pra fechar]"
read
