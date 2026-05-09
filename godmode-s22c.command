#!/bin/bash
# UniverCert · Sprint 22c — Editor godmode++
# - Editar/duplicar/apagar templates customizados na galeria
# - Auto-fit text (resize ajusta fontSize sem quebrar)
# - Inline edit (double-click no text livre)
# - Page sizes A4/Letter/A3/Square/Custom (mm)
# - Visibility toggle (oculto)
# - Preview real (abre cert renderizado em nova aba)
# - Biblioteca de assets (tabela + endpoint, UI pendente)
# - Migration 0011 (tabela assets)

set -e
cd "$(dirname "$0")"
rm -f .git/index.lock 2>/dev/null || true

echo "Aplicando migration 0011 (assets library)..."
npx wrangler d1 execute univercert-mvp --remote \
  --file=./drizzle/migrations/0011_assets_library.sql 2>&1 | tail -6
echo

git add \
  src/db/schema.ts \
  src/lib/layout-v2.ts \
  "src/app/(dashboard)/templates/editor/TemplateEditorV2.tsx" \
  "src/app/(dashboard)/templates/editor/actions.ts" \
  "src/app/(dashboard)/templates/TemplatesGalleryClient.tsx" \
  src/app/api/internal/assets/upload/route.ts \
  src/app/api/internal/assets/list/route.ts \
  drizzle/migrations/0011_assets_library.sql

git diff --cached --stat
git commit -m "feat(s22c): editor godmode++ — duplicate, autoFit, inline edit, page sizes, library

GALERIA TEMPLATES
* CustomTemplateCard com Editar (link editor?id=), Duplicar (clona nome '(copia)'),
  Tela cheia, Apagar (admin only). server actions duplicateTemplateAction +
  deleteTemplateAction.

EDITOR
* Page sizes: A4/Letter/A3/Square/Custom (mm) com selector + inputs custom W×H
* Auto-fit text: toggle por field. Editor canvas usa container queries (cqh)
  pra crescer/encolher com caixa. Renderer V2 calcula fontSize=h%*pageHeightMm*2
  no PDF final. Resize agora muda visualmente o texto sem quebrar.
* Inline edit: double-click em type='text' vira input. Enter/blur commita,
  Escape cancela. Drag suprimido durante edit.
* Visibility toggle no inspector (oculto fica opaco no canvas e suprimido no PDF)
* Preview real: botao linka /api/v1/templates/custom/<id>/preview em nova aba
* getPageDimensions() helper exportado de layout-v2

BIBLIOTECA DE ASSETS (backend)
* Migration 0011: tabela assets (id, ws, r2_key, kind, size, name, tplId, uploadedBy)
* uploadAsset endpoint registra em DB no upload (rastreamento + storage mgmt)
* /api/internal/assets/list (GET) com filtro por kind

Build local 9.34s." || echo "nada"
git push 2>&1 | tail -3

echo
echo "Aguardando build CI (~3min)..."
sleep 180
curl -s "https://api.github.com/repos/univerbeauty777/univercert/actions/runs?per_page=1" \
  | grep -E '"(head_sha|status|conclusion)"'
echo
echo "[Pressione Enter pra fechar]"
read
