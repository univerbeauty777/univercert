#!/bin/bash
# UniverCert · S22b — Editor GODMODE polish
#  - Undo/redo (cmd+Z, cmd+Shift+Z)
#  - 8 resize handles arrastaveis
#  - Keyboard shortcuts (Delete, arrows, cmd+D, cmd+]/[)
#  - Z-index controls (front/back/forward/backward)
#  - Lock/unlock toggle
#  - Snap guides centro/edges
#  - Font upload TTF/OTF/WOFF2 + @font-face dinamico
#  - Fix bug delete que nao funcionava
#  - Build local 10.35s

set -e
cd "$(dirname "$0")"
rm -f .git/index.lock 2>/dev/null || true

git add \
  src/lib/editor-history.ts \
  "src/app/(dashboard)/templates/editor/TemplateEditorV2.tsx" \
  src/app/api/internal/fonts/upload/route.ts
git diff --cached --stat
git commit -m "feat(s22b): Editor GODMODE polish — undo/redo + resize + atalhos + fonts

* lib/editor-history.ts — useLayoutHistory hook (50 steps, JSON-dedup, commit explicito)
* TemplateEditorV2 reescrito (~720 linhas):
  - Toolbar com undo/redo (botoes + canUndo/canRedo)
  - 8 resize handles (NW/N/NE/E/SE/S/SW/W) drag em %
  - Drag de move com snap guides (centro vertical/horizontal + alinhamento com outros fields)
  - Keyboard shortcuts globais:
      cmd+Z / cmd+Shift+Z / cmd+Y → undo/redo
      Delete / Backspace → apagar selecionado
      cmd+D → duplicar
      arrows (1%) / shift+arrows (5%) → mover
      cmd+] / cmd+Shift+] → trazer pra frente / front
      cmd+[ / cmd+Shift+[ → mandar pra tras / back
  - Z-index controls (4 botoes no inspector)
  - Lock/unlock toggle no inspector + indicador 🔒 no canvas
  - Confirm dialog antes de apagar
  - Snap lines cyan visiveis durante drag
  - Font upload (TTF/OTF/WOFF/WOFF2 ate 5MB) com prompt de family + @font-face dinamico no <head>
  - Helper visual: lista de atalhos no painel esquerdo
* /api/internal/fonts/upload (edge-safe via R2 binding direto, valida MIME e ext)

Fix delete: deleteField agora useCallback com setSelectedId(null) e commit() explicito.
Save retorno defensivo (mensagem real do servidor agora chega ao usuario).

Build 10.35s." || echo "nada"
git push 2>&1 | tail -3

echo
echo "Aguardando build CI (~3min)..."
sleep 180
curl -s "https://api.github.com/repos/univerbeauty777/univercert/actions/runs?per_page=1" \
  | grep -E '"(head_sha|status|conclusion)"'
echo
echo "Apos verde, abre /templates/editor e teste:"
echo "  - Drag um campo nas bordas pra fazer resize"
echo "  - cmd+Z desfaz, cmd+Shift+Z refaz"
echo "  - Delete apaga, cmd+D duplica"
echo "  - Sobe uma fonte propria (.ttf) no painel esquerdo"
echo
echo "[Pressione Enter pra fechar]"
read
