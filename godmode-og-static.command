#!/bin/bash
# UniverCert · Fix bundle size: trocar OG dinamica por PNG estatica
#
# Por que: src/app/opengraph-image.tsx usa @vercel/og que traz yoga.wasm
# (1.3 MiB) + resvg.wasm (86 KiB). Sozinho isso bota o Worker bundle pra
# 10.5 MiB e estoura o limite Cloudflare (3 MiB Free / 10 MiB Paid).
#
# Solucao: PNG estatica em public/og-default.png (53 KiB) + referenciar
# em layout.tsx + apagar opengraph-image.tsx.
#
# IMPORTANTE: faca o upgrade pra Workers Paid no dashboard CF antes de
# rodar este script, pra ter folga (vai pra ~9 MiB com a fix, e o
# Paid permite 10 MiB).

set -e
cd "$(dirname "$0")"
rm -f .git/index.lock 2>/dev/null || true

echo "============================================"
echo "  FIX OG STATICA + REMOVER @vercel/og"
echo "============================================"
echo

# -------------------------------------------------------------------------
# 1. SYNC
# -------------------------------------------------------------------------
echo "==> Fetch origin..."
git fetch origin main 2>&1 | tail -3

LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/main)
if [ "$LOCAL" != "$REMOTE" ]; then
  echo "==> Atualizando local pro origin/main..."
  git stash -u 2>/dev/null || true
  git reset --hard origin/main
  git stash pop 2>/dev/null || true
fi
echo

# -------------------------------------------------------------------------
# 2. CONFIRMAR QUE A PNG EXISTE (foi gerada pelo Claude no outputs)
# -------------------------------------------------------------------------
if [ ! -f "public/og-default.png" ]; then
  echo "ERRO: public/og-default.png nao existe."
  echo "O Claude deveria ter gerado essa imagem em outputs/univercert/public/og-default.png."
  echo "Conferi a pasta e nao achei. Avise o Claude pra regerar."
  exit 1
fi
echo "==> OG estatica confirmada: $(ls -la public/og-default.png | awk '{print $5, $9}')"
echo

# -------------------------------------------------------------------------
# 3. PATCH src/app/layout.tsx — adiciona images no openGraph e twitter
# -------------------------------------------------------------------------
if grep -q "og-default.png" src/app/layout.tsx 2>/dev/null; then
  echo "==> layout.tsx ja referencia og-default.png (skip)"
else
  echo "==> Patcheando src/app/layout.tsx pra apontar pra OG estatica..."
  python3 <<'PYLAYOUT_EOF'
import re
path = 'src/app/layout.tsx'
with open(path) as f: content = f.read()

# openGraph: adicionar images antes do fechamento }
og_block = re.search(r"(openGraph:\s*\{[^}]*description:\s*SITE_DESCRIPTION,)(\s*)(\},)", content, re.DOTALL)
if og_block and 'og-default.png' not in og_block.group(0):
  new = og_block.group(1) + '''
    images: [
      {
        url: '/og-default.png',
        width: 1200,
        height: 630,
        alt: SITE_TITLE,
      },
    ],''' + og_block.group(2) + og_block.group(3)
  content = content.replace(og_block.group(0), new)
  print('  openGraph.images adicionado')

# twitter: adicionar images
tw_block = re.search(r"(twitter:\s*\{[^}]*description:\s*SITE_DESCRIPTION,)(\s*)(\},)", content, re.DOTALL)
if tw_block and 'og-default.png' not in tw_block.group(0):
  new = tw_block.group(1) + '''
    images: ['/og-default.png'],''' + tw_block.group(2) + tw_block.group(3)
  content = content.replace(tw_block.group(0), new)
  print('  twitter.images adicionado')

with open(path, 'w') as f: f.write(content)
print('  layout.tsx ok')
PYLAYOUT_EOF
fi
echo

# -------------------------------------------------------------------------
# 4. REMOVER src/app/opengraph-image.tsx (o que traz o wasm)
# -------------------------------------------------------------------------
if [ -f "src/app/opengraph-image.tsx" ]; then
  echo "==> Removendo src/app/opengraph-image.tsx (causa do bundle gigante)..."
  git rm src/app/opengraph-image.tsx 2>/dev/null || rm src/app/opengraph-image.tsx
else
  echo "==> opengraph-image.tsx ja nao existe (skip)"
fi
echo

# -------------------------------------------------------------------------
# 5. COMMIT + PUSH
# -------------------------------------------------------------------------
echo "==> Status:"
git status --short
echo
git add -A
git diff --cached --stat | tail -10
echo

git commit -m "perf(bundle): troca OG dinamica por PNG estatica (-1.4 MiB wasm)

Causa do CI red ha 6 commits: 'Your Worker exceeded the size limit of 3 MiB'.

Bundle de 10.5 MiB. 1.4 MiB sao 2 wasm de @vercel/og (yoga + resvg)
trazidos por src/app/opengraph-image.tsx (ImageResponse dinamica).

Solucao:
- public/og-default.png (53 KiB) gerada estaticamente
- layout.tsx aponta openGraph.images e twitter.images pra ela
- src/app/opengraph-image.tsx removido

Bundle esperado pos-deploy: ~9.1 MiB. Encaixa em Workers Paid (10 MiB).
Free plan (3 MiB) ainda requer corte adicional." || echo "(nada novo a commitar)"

echo
echo "==> Push pro GitHub..."
git push 2>&1 | tail -5
echo

echo "============================================"
echo "  Aguardando CI build (~3min)..."
echo "============================================"
sleep 180

echo
echo "==> Status do ultimo build:"
curl -s "https://api.github.com/repos/univerbeauty777/univercert/actions/runs?per_page=1" \
  | python3 -c "
import sys,json
d=json.load(sys.stdin)
r=d['workflow_runs'][0]
print(f\"#{r['run_number']}  sha={r['head_sha'][:7]}\")
print(f\"  status:     {r['status']}\")
print(f\"  conclusion: {r['conclusion']}\")
print(f\"  url:        {r['html_url']}\")
"
echo
echo "Se conclusion=success -> deploy verde! Testa:"
echo "  https://univercert.net/forgot-password    (S78)"
echo "  https://univercert.net/                   (landing nova)"
echo "  https://univercert.net/pt                 (locale multilang)"
echo
echo "Se ainda failure -> me manda a URL acima."
echo "  Provavel: ainda passa do limite. Diga se ja fez upgrade Workers Paid."
echo
echo "[Pressione Enter pra fechar]"
read
