#!/bin/bash
# UniverCert · GODMODE Sprint 21
# Editor V2 import-first com R2 upload + zones drag
#
# Entregas:
#  - lib/r2-assets.ts (upload/read/delete + signed URLs)
#  - /api/v1/assets/[key] proxy publico
#  - /api/internal/assets/upload multipart
#  - lib/layout-v2.ts (LayoutV2 spec + renderLayoutV2 + ensureQr)
#  - lib/cert-template-shared.ts (helpers extraidos pra quebrar ciclo)
#  - cert-template.ts hookado: version:2 -> renderLayoutV2
#  - /templates/editor pagina + EditorWrapper + saveTemplateV2Action
#  - TemplateEditorV2.tsx canvas 3 colunas com 12 field types + inspector
#  - Galeria templates ganha botao "+ Novo template" -> editor V2
#
# Build local 10.95s

set -e
cd "$(dirname "$0")"
rm -f .git/index.lock .git/HEAD.lock 2>/dev/null || true

echo "Stage..."
git add \
  src/lib/r2-assets.ts \
  src/lib/layout-v2.ts \
  src/lib/cert-template.ts \
  src/lib/cert-template-shared.ts \
  "src/app/api/v1/assets/[key]/route.ts" \
  src/app/api/internal/assets/upload/route.ts \
  "src/app/(dashboard)/templates/page.tsx" \
  "src/app/(dashboard)/templates/editor"
git diff --cached --stat
echo

git commit -m "feat(s21): Template Editor V2 import-first com R2 + zones drag

R2 ASSET MANAGER
* lib/r2-assets.ts: uploadAsset/readAsset/deleteAsset/assetUrl
  - Validacao MIME (PNG/JPG/SVG/WEBP/PDF) + tamanho max 8MB
  - Storage workspaces/{wsId}/templates/{tplId}/{kind}-{ulid}.{ext}
* /api/v1/assets/[key] proxy publico cache 1 dia
* /api/internal/assets/upload multipart com requireRole('editor')

LAYOUT V2
* lib/layout-v2.ts: spec import-first
  - LayoutV2 { version:2, orientation, pageSize, background, fields }
  - LayoutField com 12 tipos (text, recipientName, courseName, hours,
    cpf, date, city, workspaceName, verifyUrl, credentialId, qr, image)
  - FieldStyle com font/size/weight/color/align/italic/etc
  - renderLayoutV2 gera HTML A4 com bg image + fields posicionados absolute
  - ensureQr() forca pelo menos 1 QR no layout (obrigatorio)
* cert-template.ts hookado: detecta version:2 e delega pro renderLayoutV2
* cert-template-shared.ts: helpers extraidos (formatCpf/formatDate/escapeHtml
  + CertArgs type) pra quebrar ciclo cert-template <-> layout-v2

EDITOR V2
* /templates/editor (server) com requireRole('editor')
* EditorWrapper + TemplateEditorV2 (~480 linhas)
  - 3 colunas: add fields / canvas / inspector
  - Drag-drop background com preview live
  - 12 field types arrastaveis (snap-to-grid 0.5%)
  - Inspector com tipografia + cores + alinhamento + italic/uppercase/underline
  - Upload imagem inline pra logo/signature fields
  - Toggle landscape/portrait
  - Zoom 20-120% slider
  - Save com router.push -> editar inline
* saveTemplateV2Action: requireRole(editor) + JSON max 200KB

GALERIA
* Botao 'Editor antigo' (legado) + '+ Novo template' (V2 default)

Build local 10.95s ok." || echo "nada"
git push 2>&1 | tail -3

echo
echo "Aguardando build CI (~3min)..."
sleep 180
curl -s "https://api.github.com/repos/univerbeauty777/univercert/actions/runs?per_page=1" \
  | grep -E '"(head_sha|status|conclusion)"'
echo
echo "Quando verde:"
echo "  /templates -> + Novo template -> testar editor"
echo
echo "[Pressione Enter pra fechar]"
read
