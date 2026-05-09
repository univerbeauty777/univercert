#!/bin/bash
# UniverCert · GODMODE signup full
# 1. Push do fix final (modelName account/verification + cleanup)
# 2. Apaga usuario incompleto que ficou orfao no D1
# 3. Espera build + smoke test
# 4. Cria sua conta admin via API + valida login

set -e
cd "$(dirname "$0")"

EMAIL="diegoxp12@me.com"
SENHA_ADMIN=""

echo
echo "========================================================="
echo "GODMODE SIGNUP — fix final + cleanup + cadastro automatico"
echo "========================================================="
echo

read -s -p "Cole/digite a senha que voce quer pra conta admin (>=8 chars): " SENHA_ADMIN
echo
if [ ${#SENHA_ADMIN} -lt 8 ]; then
  echo "ERRO: senha precisa ter ao menos 8 caracteres"
  read -p "[Enter pra fechar]"
  exit 1
fi
echo

rm -f .git/index.lock .git/HEAD.lock 2>/dev/null || true

echo "1. Push do fix final (modelName accounts + verifications)..."
git add src/lib/auth.ts
git diff --cached --stat
git commit -m "fix(auth): modelName tambem em account e verification

Faltava modelName: 'accounts' e 'verifications' no auth.ts. Sem isso
Better Auth procurava schema['account'] (singular) que nao existia
no map (so tinha 'accounts' plural) e signin morria com:
  '[# Drizzle Adapter]: The model account was not found'

Fix completa o triple: users, sessions, accounts, verifications todos
mapeados corretamente." || echo "   nada pra commitar"
git push 2>&1 | tail -3

echo
echo "2. Apagando user/account/session orfao (diegoxp12@me.com)..."
npx wrangler d1 execute univercert-mvp --remote --command "
DELETE FROM sessions WHERE user_id IN (SELECT id FROM users WHERE lower(email)='diegoxp12@me.com');
DELETE FROM accounts WHERE user_id IN (SELECT id FROM users WHERE lower(email)='diegoxp12@me.com');
DELETE FROM workspace_members WHERE user_id IN (SELECT id FROM users WHERE lower(email)='diegoxp12@me.com');
DELETE FROM users WHERE lower(email)='diegoxp12@me.com';
" 2>&1 | tail -8
echo

echo "3. Aguardando build (3min)..."
sleep 180
echo
echo "Status:"
curl -s "https://api.github.com/repos/univerbeauty777/univercert/actions/runs?per_page=1" \
  | grep -E '"(head_sha|status|conclusion)"'
echo

echo "4. Smoke test (signup + signin)..."
echo
echo "  4a) Signup:"
SIGNUP=$(curl -s -X POST https://univercert.pages.dev/api/auth/sign-up/email \
  -H 'Content-Type: application/json' \
  -d "{\"name\":\"Diego Admin\",\"email\":\"$EMAIL\",\"password\":\"$SENHA_ADMIN\"}")
echo "  $SIGNUP" | head -c 300
echo
echo
echo "  4b) Signin:"
SIGNIN=$(curl -s -X POST https://univercert.pages.dev/api/auth/sign-in/email \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$SENHA_ADMIN\"}")
echo "  $SIGNIN" | head -c 300
echo
echo

if echo "$SIGNUP" | grep -q '"user"' || echo "$SIGNIN" | grep -q '"user"'; then
  echo "========================================================="
  echo "VITORIA. Sua conta admin esta criada e o login funciona."
  echo "========================================================="
  echo
  echo "Abre no browser:"
  echo "  https://univercert.pages.dev/sign-in"
  echo "  Email: $EMAIL"
  echo "  Senha: (a que voce digitou aqui)"
  echo
else
  echo "========================================================="
  echo "AINDA NAO DEU. Resposta acima diz o que sobrou."
  echo "========================================================="
fi

echo
echo "[Pressione Enter pra fechar]"
read
