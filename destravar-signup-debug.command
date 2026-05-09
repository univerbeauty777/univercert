#!/bin/bash
# UniverCert · Hotfix DEBUG do signup
# Habilita error bubbling no Better Auth pra ver o erro real.

set -e
cd "$(dirname "$0")"

rm -f .git/index.lock .git/HEAD.lock 2>/dev/null || true

echo "Stage + commit + push..."
git add src/lib/auth.ts "src/app/api/auth/[...all]/route.ts"
git diff --cached --stat
git commit -m "debug(auth): expose Better Auth error real (throw:true + intercept silent 500 no handler)" || echo "nada"
git push

echo
echo "Aguardando build (3min)..."
sleep 180
echo
echo "Status:"
curl -s "https://api.github.com/repos/univerbeauty777/univercert/actions/runs?per_page=1" \
  | grep -E '"(head_sha|status|conclusion)"'
echo
echo "Smoke test signup:"
EMAIL="smoke$(date +%s)@test.dev"
echo "Email: $EMAIL"
curl -s -X POST https://univercert.pages.dev/api/auth/sign-up/email \
  -H 'Content-Type: application/json' \
  -d "{\"name\":\"Smoke Test\",\"email\":\"$EMAIL\",\"password\":\"TestSenha123!\"}" \
  | head -50
echo
echo
echo "[Pressione Enter pra fechar]"
read
