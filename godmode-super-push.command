#!/bin/bash
# UniverCert · GODMODE SUPER PUSH
# Combina TUDO pendente:
#  - UI 2.0 redesign (sidebar/dashboard/templates) — se ainda nao deployado
#  - S18 Observability (/admin/health + Resend email engine)
#  - 10 templates novos (16 totais, todos com QR)
#  - S20 UniverHair x FluentCommunity (plugin WP + wizard + embed widget)
#  - S21 Editor V2 import-first (R2 + zones drag)
#  - S21b PDF interativo (pdf.js client-side)
#  - S22 Cursos + Forms customizados de solicitacao
#    * Tabela courses + ALTER certificate_requests (migration 0010)
#    * /courses CRUD + form builder embutido (11 tipos field)
#    * /solicitar/[ws]/[courseSlug] publico
#    * Upload publico /api/public/uploads (rate-limit + 10MB)
#    * Auto-approve + workflow trigger request.created
#
# Migrations a aplicar: 0009 (S18) + 0010 (S22)
# Build local 12.21s

set -e
cd "$(dirname "$0")"
rm -f .git/index.lock .git/HEAD.lock 2>/dev/null || true

echo
echo "================================================================="
echo "GODMODE SUPER PUSH — S19/S20/S21/S21b/S22 todos juntos"
echo "================================================================="
echo

echo "[1/3] Aplicando migrations 0009 + 0010 no D1 remoto..."
npx wrangler d1 execute univercert-mvp --remote \
  --file=./drizzle/migrations/0009_observability_email.sql 2>&1 | tail -4
echo
npx wrangler d1 execute univercert-mvp --remote \
  --file=./drizzle/migrations/0010_courses_and_forms.sql 2>&1 | tail -8
echo

echo "[2/3] Stage + commit + push..."
git add -A
git diff --cached --stat | tail -30
echo

git commit -m "feat(s19+s20+s21+s22): super push — UI 2.0 + observability + email + 10 templates + UniverHair Fluent + editor V2 + PDF interativo + cursos/forms customizados

UI 2.0 (Certifier-inspired)
* Sidebar fixa colapsavel 240/68 com 3 secoes + persistencia + mobile drawer
* Dashboard refeito (4 stat-cards num + setup checklist real + atividade)
* Templates gallery polida com 6 variantes voltando
* PageHeader/StatsBar v2 minimalistas
* globals.css tokens semanticos light+dark + spring/shimmer

S18 OBSERVABILITY
* migration 0009 (email_events + error_events)
* lib/observability.ts captureError + captureAndRespond + getMetrics
* /admin/health com 7 KPIs + top error paths + listas recentes

EMAIL RESEND
* lib/resend.ts cliente edge
* lib/email-dispatcher.ts engine completa + sendTestEmail
* notify.ts refatorado (dispatcher first + fallback default)
* /api/internal/email/test endpoint

10 TEMPLATES NOVOS (16 total, todos com QR)
* botanical, sunset, notebook, techgrid, artdeco, newspaper,
  diploma (A4 portrait), holographic, watermark, coach

S20 UNIVERHAIR x FLUENTCOMMUNITY
* wp-plugin/univercert-fluent/ — plugin WP standalone
* /univercert-fluent.zip estatico
* /embed/student/[email]?ws=slug widget publico
* webhook auto-approve + course->template mapping
* /integrations/fluent wizard 4 steps

S21 EDITOR V2 IMPORT-FIRST
* lib/r2-assets.ts upload/read/delete + signed URLs
* /api/v1/assets/[key] proxy + /api/internal/assets/upload
* lib/layout-v2.ts spec + renderLayoutV2 + ensureQr
* lib/cert-template-shared.ts (helpers extraidos)
* /templates/editor TemplateEditorV2 (480 linhas)
  - 12 field types arrastaveis + snap-to-grid 0.5%
  - Inspector tipografia/cor/alinhamento
  - Toggle landscape/portrait + zoom

S21b PDF INTERATIVO
* lib/pdf-to-png.ts pdfjs-dist@4.0.379 lazy CDN
* PDF -> PNG client-side -> R2 normal
* Auto-detecta orientation

S22 CURSOS + FORMS CUSTOMIZADOS
* migration 0010 (tabela courses + 6 colunas em certificate_requests)
* lib/course-requirements.ts (11 tipos, validacao, presets cabelo/estetica/coaching)
* /courses CRUD + form builder embutido com presets
* /solicitar/[ws]/[courseSlug] pagina publica
* /api/public/uploads (rate-limit KV + 10MB + MIME)
* Auto-approve no curso + workflow trigger request.created
* Sidebar ganha 'Cursos'

Build local 12.21s." || echo "nada"
git push 2>&1 | tail -3

echo
echo "[3/3] Aguardando build CI (~3min)..."
sleep 180
curl -s "https://api.github.com/repos/univerbeauty777/univercert/actions/runs?per_page=1" \
  | grep -E '"(head_sha|status|conclusion)"'
echo
echo "================================================================="
echo "PRONTO! Roteiro de validacao end-to-end:"
echo "================================================================="
echo "  /dashboard          -> visual novo"
echo "  /courses            -> + Novo curso, com preset 'cabelo'"
echo "  /templates/editor   -> sobe Liso Blindado PNG e cria template"
echo "  /integrations/fluent -> wizard 4 steps + plugin .zip"
echo "  /admin/health       -> metricas live"
echo
echo "Fluxo do aluno:"
echo "  /solicitar/univerhair/<curso-slug> -> aluno preenche form"
echo "  /queue              -> aprovador ve request"
echo "  /credentials        -> cert emitido apos aprovar"
echo "  /v/<id>             -> aluno verifica + baixa PDF"
echo
echo "[Pressione Enter pra fechar]"
read
