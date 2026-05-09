#!/bin/bash
# UniverCert · Favicon oficial em todas as paginas
set -e
cd "$(dirname "$0")"
rm -f .git/index.lock 2>/dev/null || true

git add \
  src/app/icon.tsx \
  src/app/icon.svg \
  src/app/apple-icon.tsx \
  src/app/layout.tsx
git diff --cached --stat
git commit -m "feat(brand): favicon oficial UniverCert em todas paginas

* app/icon.tsx (64x64 PNG via ImageResponse) reescrito com escudo oficial
* app/apple-icon.tsx (180x180 PNG) reescrito com escudo oficial
* app/icon.svg static (escalavel pra navegadores modernos)
* metadata.icons no root layout: icon (PNG+SVG), shortcut, apple, mask-icon
* viewport.themeColor: '#6366f1' (roxo generico) -> '#1B2D5E' (navy brand)

Resultado: tab do browser, install PWA, atalho mobile e bookmarks
mostram o escudo navy + arcs dourado + check oficial em vez do '✓ amarelo'
generico que tinha antes.

Build local 10.81s." || echo "nada"
git push 2>&1 | tail -3

echo
echo "Aguardando build (~3min)..."
sleep 180
curl -s "https://api.github.com/repos/univerbeauty777/univercert/actions/runs?per_page=1" \
  | grep -E '"(head_sha|status|conclusion)"'
echo
echo "Apos verde, hard refresh (cmd+shift+R) em qualquer pagina pra ver o icone novo na aba."
read
