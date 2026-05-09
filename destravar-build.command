#!/bin/bash
# UniverCert · Destrava push do hotfix vercel@41.7.4
# Clique 2x neste arquivo no Finder — macOS abre no Terminal e executa.

set -e
cd "$(dirname "$0")"

echo
echo "========================================================="
echo "DESTRAVANDO PUSH DO HOTFIX vercel@41.7.4"
echo "========================================================="
echo

echo "1. Limpando git locks orfaos..."
rm -f .git/index.lock .git/HEAD.lock .git/objects/maintenance.lock 2>/dev/null || true
echo "   OK"
echo

echo "2. Stage do package.json + package-lock.json..."
git add package.json package-lock.json
git diff --cached --stat
echo

echo "3. Commit..."
git commit -m "fix(build): pin vercel@41.7.4 — vercel@53 quebra com 'LRU is not a constructor' no @cloudflare/next-on-pages

Bug 3 do dia (depois de middleware comment + casos/[vertical] edge runtime):

@cloudflare/next-on-pages chama 'npx vercel build' por baixo. Quando vercel
nao esta no devDependencies, npx puxa a ultima (vercel@53.2.0) que tem
incompatibilidade com lru-cache: 'Error: Importing @vercel/next: LRU is
not a constructor'. Pinando vercel@41.7.4 (ultima versao known-good)
resolve definitivamente.

Reproducido localmente:
  cd univercert && npx @cloudflare/next-on-pages
  > Error: Importing '@vercel/next': LRU is not a constructor

Apos npm install --save-dev vercel@41.7.4:
  > Vercel CLI 41.7.4
  > Build OK (so falha em sandbox por EPERM, mas no CI funciona)" || echo "   nada pra commitar"
echo

echo "4. Push..."
git push
echo

echo "========================================================="
echo "PUSH ENVIADO. Build do CI roda em ~3min."
echo "========================================================="
echo
echo "Aguardando build do GitHub Actions..."
echo
sleep 120
echo "Status do ultimo build:"
curl -s "https://api.github.com/repos/univerbeauty777/univercert/actions/runs?per_page=1" | grep -E '"(head_sha|status|conclusion|created_at)"'
echo
echo "Se ainda esta 'in_progress', aguarda mais 1-2min e abre:"
echo "  https://github.com/univerbeauty777/univercert/actions"
echo
echo "Quando ficar verde:"
echo "  https://univercert.com.br/sign-up"
echo "  -> cria sua conta admin"
echo
echo "[Pressione Enter pra fechar]"
read
