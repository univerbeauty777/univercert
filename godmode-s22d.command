#!/bin/bash
# UniverCert · S22d — Multi-select + marquee + align/distribute + AssetLibrary modal
# Build local: 10.47s

set -e
cd "$(dirname "$0")"
rm -f .git/index.lock 2>/dev/null || true

git add -A
git diff --cached --stat | tail -10
echo

git commit -m "feat(s22d): multi-select drag + marquee + align/distribute + AssetLibrary modal

EDITOR (TemplateEditorV2.tsx):
* selectedId -> selectedIds: Set<string> + primaryId separate (inspector + handles)
* handleFieldClick(id, e): shift/cmd toggle, sem modifier substitui
* handleDrag: quando selectedIds.has(id) e size > 1, move TODOS os campos
  selecionados com mesmo dx/dy. Snap so em single-drag.
* alignFields(dir): 8 direcoes (left/centerH/right/top/centerV/bottom/distH/distV)
  - bordas: min/max do bounding box dos selecionados
  - centro: media do bounding box
  - distribuir: ordena por posicao + gap igual
* Keyboard shortcuts iteram sobre selectedIds (Delete, cmd+D, arrows, Escape)
* Canvas onMouseDown: marquee selection — desenha retangulo + intersect
* Toolbar de align aparece quando selectedIds.size >= 2
* FieldOnCanvas: prop primary separada de selected
  - primary border navy #1B2D5E
  - multi-selected border cyan #06B6D4
  - resize handles so no primary

ASSET LIBRARY (S22d #102):
* AssetLibraryModal.tsx (~145 linhas): grid 2-4 colunas de uploads
  - filtro por kind (background/logo/signature/seal/misc)
  - busca por nome
  - botao + Subir novo (callback opcional)
  - hover scale + click pra selecionar
* Botao 'Da biblioteca…' ao lado do upload de fundo
* onUploadNew callback pra integrar com fluxo de upload existente

Build local 10.47s." || echo "nada"
git push 2>&1 | tail -3

echo
echo "Aguardando build CI (~3min)..."
sleep 180
curl -s "https://api.github.com/repos/univerbeauty777/univercert/actions/runs?per_page=1" \
  | grep -E '"(head_sha|status|conclusion)"'
echo
echo "Apos verde:"
echo "  /templates/editor — clica num campo, shift+click outro = multi-select"
echo "  Arrasta -> grupo move junto"
echo "  Marquee: clica vazio do canvas e arrasta retangulo"
echo "  Toolbar align aparece com 2+ selecionados"
echo "  Botao 'Da biblioteca' abre modal de uploads anteriores"
echo
read
