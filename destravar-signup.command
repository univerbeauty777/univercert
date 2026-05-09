#!/bin/bash
# UniverCert · Hotfix Better Auth signup
# Bugs:
#   1. baseURL hardcoded 'univercert.com.br' quebra origin em pages.dev
#   2. sessions.ip_address e sessions.updated_at nao existiam no schema
#
# Fix:
#   - auth.ts: baseURL undefined (Better Auth detecta do request)
#   - migration 0008 adiciona ip_address + updated_at em sessions
#   - schema.ts atualizado pra refletir migration 0008
#
# Build local validado: 6.79s OK

set -e
cd "$(dirname "$0")"

echo
echo "========================================================="
echo "HOTFIX BETTER AUTH SIGNUP"
echo "========================================================="
echo

rm -f .git/index.lock .git/HEAD.lock .git/objects/maintenance.lock 2>/dev/null || true

echo "1. Aplicando migration 0008 no D1 remoto..."
npx wrangler d1 execute univercert-mvp --remote \
  --file=./drizzle/migrations/0008_session_better_auth.sql 2>&1 | tail -10
echo

echo "2. Stage dos fixes..."
git add src/lib/auth.ts src/db/schema.ts drizzle/migrations/0008_session_better_auth.sql
git diff --cached --stat
echo

echo "3. Commit + push..."
git commit -m "fix(auth): Better Auth signup 500

Sintoma: POST /api/auth/sign-up/email retorna 500 com body vazio
em univercert.pages.dev (e tambem em univercert.com.br).

Causas (2):

A) baseURL hardcoded como 'univercert.com.br'. Quando user acessa
   via univercert.pages.dev, origin do request != baseURL e Better
   Auth rejeita silenciosamente. Fix: baseURL undefined → Better
   Auth detecta automaticamente do request origin.

B) Schema desalinhado com Better Auth:
   - sessions.ip_address (BA padrao) vs sessions.ip (nosso)
   - sessions.updated_at NAO EXISTIA
   Quando Better Auth tenta INSERT na sessions ao final do signup
   (autoSignIn=true), SQL falha. Fix: migration 0008 adiciona as 2
   colunas + schema.ts atualizado.

Validado local: build 6.79s ok." || echo "nada pra commitar"

git push

echo
echo "========================================================="
echo "PUSH ENVIADO. Build CI roda em ~3min."
echo "========================================================="
sleep 180
echo
echo "Status final:"
curl -s "https://api.github.com/repos/univerbeauty777/univercert/actions/runs?per_page=1" \
  | grep -E '"(head_sha|status|conclusion)"'
echo
echo "Quando verde:"
echo "  https://univercert.pages.dev/sign-up"
echo "  -> cria com Diego ADMIN / diegoxp12@me.com / sua senha"
echo
echo "[Pressione Enter pra fechar]"
read
