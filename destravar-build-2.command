#!/bin/bash
# UniverCert · Push #2 do destravamento
# Adiciona debug verbose + upload artifact ao workflow
# Quando o CI rodar, podemos baixar o log completo do erro

set -e
cd "$(dirname "$0")"

echo
echo "========================================================="
echo "PUSH #2 — DEBUG VERBOSE NO WORKFLOW"
echo "========================================================="
echo

rm -f .git/index.lock .git/HEAD.lock .git/objects/maintenance.lock 2>/dev/null || true

git add .github/workflows/deploy.yml
git diff --cached --stat
echo

git commit -m "ci: debug verbose + upload artifact em caso de falha

Adiciona step que printa node/npm/vercel/next-on-pages versions antes do
build, e em caso de falha sobe build-output.log + .vercel/output como
artifact. Sem isso a gente nao consegue ver o erro real (logs da action
sao privados via API publica)." || echo "nada pra commitar"

git push

echo
echo "========================================================="
echo "PUSH ENVIADO. Aguardando build (~3min)..."
echo "========================================================="
sleep 180
echo
echo "Status final:"
curl -s "https://api.github.com/repos/univerbeauty777/univercert/actions/runs?per_page=1" \
  | grep -E '"(head_sha|status|conclusion|created_at)"'
echo
echo "Pra baixar o log do erro, abre:"
echo "  https://github.com/univerbeauty777/univercert/actions"
echo "  Click no run mais recente -> rola ate 'Artifacts' -> baixa 'build-output-log'"
echo "  Manda o conteudo do build-output.log pra mim no chat."
echo
echo "[Pressione Enter pra fechar]"
read
