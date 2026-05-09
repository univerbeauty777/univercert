#!/bin/bash
# UniverCert · Hotfix FINAL signup
# O bug raiz era no drizzleAdapter: schema map usava chaves singulares
# (user/session/account) mas modelName era plural (users/sessions/...)
# → Better Auth nao encontrava schema['users'].

set -e
cd "$(dirname "$0")"

rm -f .git/index.lock .git/HEAD.lock 2>/dev/null || true

echo "Stage + commit + push..."
git add src/lib/auth.ts
git diff --cached --stat
git commit -m "fix(auth): drizzleAdapter schema map com chaves plurais

Bug raiz revelado pelo debug:
  '[# Drizzle Adapter]: The model \"users\" was not found in the schema object'

Causa: passamos schema:{ user: schema.users, ... } (chaves singulares)
mas modelName: 'users' (plural). Better Auth tentava lookup schema['users']
e nao encontrava → 500 vazio em todo signup/signin.

Fix: schema:{ users: schema.users, sessions: schema.sessions,
              accounts: schema.accounts, verifications: schema.verifications }

Validado local: build 6.69s ok." || echo "nada pra commitar"

git push

echo
echo "Aguardando build (~3min)..."
sleep 180
echo
echo "Status:"
curl -s "https://api.github.com/repos/univerbeauty777/univercert/actions/runs?per_page=1" \
  | grep -E '"(head_sha|status|conclusion)"'
echo
echo "Smoke test:"
EMAIL="smoke$(date +%s)@test.dev"
echo "Email: $EMAIL"
curl -s -X POST https://univercert.pages.dev/api/auth/sign-up/email \
  -H 'Content-Type: application/json' \
  -d "{\"name\":\"Smoke Test\",\"email\":\"$EMAIL\",\"password\":\"TestSenha123!\"}" \
  | head -100
echo
echo
echo "Se 200/201 com {user:...}: SIGNUP FUNCIONANDO"
echo "Abre https://univercert.pages.dev/sign-up e cria sua conta admin"
echo
echo "[Pressione Enter pra fechar]"
read
