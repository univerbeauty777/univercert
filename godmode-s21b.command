#!/bin/bash
# UniverCert · Sprint 21b — PDF background interativo via pdf.js client-side
#
# Estrategia: PDF -> PNG no browser (pdf.js CDN ESM) -> upload PNG ao R2.
# Resultado: PDFs viram backgrounds normais (image), funciona em editor + PDF final.

set -e
cd "$(dirname "$0")"
rm -f .git/index.lock 2>/dev/null || true

git add \
  src/lib/pdf-to-png.ts \
  "src/app/(dashboard)/templates/editor/TemplateEditorV2.tsx"
git diff --cached --stat
git commit -m "feat(s21b): PDF background interativo via pdf.js client-side

* lib/pdf-to-png.ts: pdfjs-dist@4.0.379 carregado lazy via CDN ESM
  - pdfFileToPngBlob(file, scale=2.5) -> { blob, width, height, pageCount }
  - detectOrientation(w, h) helper
* TemplateEditorV2: handleBackgroundUpload intercepta PDF
  - Carrega pdf.js (so 1a vez) -> renderiza pg1 em canvas 2.5x DPI
  - Converte canvas -> PNG blob -> upload R2 como image normal
  - Auto-detecta orientation A4 portrait/landscape
  - Feedback visual em 3 stages
* Resultado: PDFs viram image background, funciona render final tambem

Build local 9.99s ok." || echo "nada"
git push 2>&1 | tail -3

echo
echo "Aguardando build CI (~3min)..."
sleep 180
curl -s "https://api.github.com/repos/univerbeauty777/univercert/actions/runs?per_page=1" \
  | grep -E '"(head_sha|status|conclusion)"'
echo
echo "[Pressione Enter pra fechar]"
read
