#!/bin/bash
# UniverCert · S78c — auto-render PDF de certs (presente + retroativo)
#
# Fix:
# 1. issueCredentialFromRequest agora chama renderAndPersistCertificate
#    automaticamente apos criar credential → próximos certs sempre terão PDF
# 2. Novo endpoint POST /api/v1/credentials/[id]/regenerate-pdf — força regen
# 3. Novo endpoint POST /api/v1/credentials/regenerate-missing — batch (admin)
#
# Pos-deploy: rode este script de novo passando "--regen" pra reprocessar
# os 9 certs existentes que estao com pdfR2Key=null:
#   ./godmode-fix-pdf-render.command --regen

set -e
cd "$(dirname "$0")"
rm -f .git/index.lock 2>/dev/null || true

# Se chamado com --regen, faz POST no endpoint (precisa ter o cookie de auth do Diego)
if [ "$1" == "--regen" ]; then
  echo "============================================"
  echo "  REGEN PDF dos certs faltantes"
  echo "============================================"
  echo "Faca login no browser primeiro em https://univercert.net/sign-in"
  echo "Depois cole abaixo o cookie '__Secure-uc.session_token' (DevTools → Application → Cookies)"
  read -p "session_token: " TOKEN
  if [ -z "$TOKEN" ]; then echo "vazio, abortando"; exit 1; fi
  echo
  echo "==> Chamando regenerate-missing..."
  curl -s -X POST "https://univercert.net/api/v1/credentials/regenerate-missing" \
    -H "Cookie: __Secure-uc.session_token=$TOKEN" \
    | python3 -m json.tool
  echo
  echo "Conferir resultado em https://univercert.net/credentials (deve aparecer thumbnails agora)"
  exit 0
fi

# Modo normal: deploy do fix
echo "============================================"
echo "  S78c · Auto-render PDF + endpoints regen"
echo "============================================"

git fetch origin main 2>&1 | tail -3
LOCAL=$(git rev-parse HEAD); REMOTE=$(git rev-parse origin/main)
if [ "$LOCAL" != "$REMOTE" ]; then
  git stash -u 2>/dev/null || true
  git reset --hard origin/main
  git stash pop 2>/dev/null || true
fi

git status --short
git add -A
git diff --cached --stat | tail -10

git commit -m "feat(s78c): auto-render PDF do cert + endpoints de regen

Problema: issueCredentialFromRequest criava credential no D1 mas nao
disparava render do PDF -> todos certs ficavam com pdfR2Key=null.
Acessar cert dava impressao de 'sumiu' (sem thumbnail, sem download).

Fix:
- src/lib/credentials.ts: renderAndPersistCertificate() helper idempotente
  que renderiza HTML→PDF (Browser Rendering)→salva R2→atualiza pdfR2Key.
- issueCredentialFromRequest agora chama renderAndPersistCertificate
  auto apos criar credential (best-effort, nao bloqueia se falhar).
- NOVO: POST /api/v1/credentials/[id]/regenerate-pdf — force regen
  de cert individual (admin/editor).
- NOVO: POST /api/v1/credentials/regenerate-missing — batch processa
  todos os certs do workspace com pdfR2Key=null (admin only, max 50/call).

Beneficios:
- Proximos certs sempre tem PDF renderizado
- Pode reprocessar os 9 existentes via endpoint
- Render uma vez, serve N vezes (corta custo Browser Rendering)" || echo "(nada novo)"

git push 2>&1 | tail -3
echo
echo "Aguardando CI (~3min)..."
sleep 180
curl -s "https://api.github.com/repos/univerbeauty777/univercert/actions/runs?per_page=1" \
  | python3 -c "import sys,json; r=json.load(sys.stdin)['workflow_runs'][0]; print(f\"#{r['run_number']} {r['conclusion']} {r['html_url']}\")"
echo
echo "Apos verde:"
echo "  1. Roda este script de novo com --regen pra reprocessar os 9 existentes:"
echo "     ./godmode-fix-pdf-render.command --regen"
echo "  2. Vai em /credentials no dashboard — deve ter thumbnails"
echo
read
