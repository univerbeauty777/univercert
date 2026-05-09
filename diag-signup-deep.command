#!/bin/bash
# UniverCert · Deep diag do FAILED_TO_CREATE_USER
# Intercepta console.error de dentro do handler pra capturar o que Better Auth loga.
set -e
cd "$(dirname "$0")"

rm -f .git/index.lock 2>/dev/null || true

echo "1. Push do interceptor de console.error..."
git add "src/app/api/auth/[...all]/route.ts"
git diff --cached --stat
git commit -m "debug(auth): intercept console.error pra expor SQL error real do BA" || echo "nada"
git push 2>&1 | tail -3

echo
echo "2. Aguardando build (~3min)..."
sleep 180
echo
curl -s "https://api.github.com/repos/univerbeauty777/univercert/actions/runs?per_page=1" | grep -E '"(status|conclusion)"'
echo

echo "3. Smoke test signup (vai vir com _debug_captured):"
EMAIL="signup$(date +%s)@test.dev"
echo "Email: $EMAIL"
RESP=$(curl -s -X POST https://univercert.pages.dev/api/auth/sign-up/email \
  -H 'Content-Type: application/json' \
  -d "{\"name\":\"Diag Test\",\"email\":\"$EMAIL\",\"password\":\"TesteSenha123!\"}")
echo
echo "Resposta completa:"
echo "$RESP" | python3 -m json.tool 2>/dev/null || echo "$RESP"
echo
echo "[Pressione Enter pra fechar]"
read
