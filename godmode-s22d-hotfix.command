#!/bin/bash
# UniverCert · S22d + hotfix UX (templates editor + sidebar fallback)
# Build local: 13.55s

set -e
cd "$(dirname "$0")"
rm -f .git/index.lock 2>/dev/null || true

git add -A
git diff --cached --stat | tail -10
echo

git commit -m "feat(s22d) + fix(ux): multi-select editor + 'Sem permissão' UX

S22d EDITOR (TemplateEditorV2.tsx + AssetLibraryModal.tsx):
* selectedId -> selectedIds: Set<string> + primaryId separate
* handleFieldClick: shift/cmd toggle, sem modifier substitui
* handleDrag: multi-drag (todos selecionados movem com mesmo dx/dy)
* alignFields(dir): 8 direcoes (left/centerH/right/top/centerV/bottom/distH/distV)
* Keyboard shortcuts iteram sobre selectedIds
* Marquee selection (mouse down em canvas vazio)
* Toolbar align renderiza com selectedIds.size >= 2
* FieldOnCanvas: prop primary separada (navy/cyan borders, handles so primary)
* AssetLibraryModal.tsx (~145 linhas): grid pra reusar uploads
* Botao 'Da biblioteca' no upload de fundo

HOTFIX UX (templates/editor + sidebar):
* /templates/editor/page.tsx: distingue UNAUTHENTICATED (redirect /sign-in)
  vs FORBIDDEN (mostra role atual + nome do workspace + CTA voltar).
  Antes: 'Sem permissão (editor+).' tanto pra nao logado quanto sem role.
* Sidebar.tsx: fallback que mostra 'WS: nome (role)' quando workspaces
  array esta vazio mas current existe. Antes: nada renderizava — ficava
  visualmente quebrado entre logo e secoes.

Build local 13.55s." || echo "nada"
git push 2>&1 | tail -3

echo
echo "Aguardando build CI (~3min)..."
sleep 180
curl -s "https://api.github.com/repos/univerbeauty777/univercert/actions/runs?per_page=1" \
  | grep -E '"(head_sha|status|conclusion)"'
echo
echo "Apos verde:"
echo "  /templates/editor — se sem role, mostra qual role voce TEM"
echo "  Sidebar mostra nome do workspace mesmo quando switcher nao renderiza"
echo "  Multi-select drag/marquee/align/distribute funcionando"
echo
read
