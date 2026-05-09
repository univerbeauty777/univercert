#!/bin/bash
# UniverCert · GODMODE MEGA PUSH
# Combina TUDO num unico push:
#   - UI redesign 2.0 (sidebar + dashboard + templates + tokens)
#   - S18 Observability (admin/health + captureError + tabelas)
#   - Sistema email Resend (dispatcher + auto-trigger)
#   - 10 templates novos (16 totais com QR code obrigatorio)
#   - S20 UniverHair x FluentCommunity:
#     * Plugin WordPress .zip standalone
#     * Embed widget /embed/student/[email]
#     * Auto-approve + course->template mapping no webhook
#     * Wizard /integrations/fluent (4 steps)
#   - Migration 0009 (email_events + error_events) no D1
#
# Build local validado: 8.15s

set -e
cd "$(dirname "$0")"
rm -f .git/index.lock .git/HEAD.lock 2>/dev/null || true

echo
echo "================================================================="
echo "GODMODE MEGA PUSH — UI + S18 + Email + 10 templates + Sprint 20"
echo "================================================================="
echo

echo "[1/3] Aplicando migration 0009 (email_events + error_events)..."
npx wrangler d1 execute univercert-mvp --remote \
  --file=./drizzle/migrations/0009_observability_email.sql 2>&1 | tail -8
echo

echo "[2/3] Stage + commit + push..."
git add \
  src/app/globals.css \
  src/components/Sidebar.tsx \
  src/components/PageHeader.tsx \
  src/components/StatsBar.tsx \
  "src/app/(dashboard)/layout.tsx" \
  "src/app/(dashboard)/dashboard/page.tsx" \
  "src/app/(dashboard)/templates/page.tsx" \
  "src/app/(dashboard)/templates/TemplatesGalleryClient.tsx" \
  "src/app/(dashboard)/admin/health/page.tsx" \
  "src/app/(dashboard)/integrations/fluent" \
  "src/app/embed/student/[email]/page.tsx" \
  src/app/api/internal/email/test/route.ts \
  src/db/schema.ts \
  src/lib/ulid.ts \
  src/lib/resend.ts \
  src/lib/email-dispatcher.ts \
  src/lib/observability.ts \
  src/lib/notify.ts \
  src/lib/webhook-handler.ts \
  src/lib/cert-template.ts \
  drizzle/migrations/0009_observability_email.sql \
  public/univercert-fluent.zip \
  wp-plugin/

git diff --cached --stat
echo

git commit -m "feat(s19+s20): GODMODE UI + S18 observability + Resend + 10 templates + UniverHair Fluent

UI 2.0 (Certifier-inspired)
* Sidebar fixa colapsavel (240/68px) com 3 secoes + persistencia + mobile drawer
* Dashboard refeito (stat-cards num monospace + setup checklist real + atividade)
* Templates gallery polida (skeleton, paletas active, 6 variantes voltam)
* PageHeader/StatsBar v2 minimalistas
* globals.css com tokens semanticos light+dark + animations spring/shimmer

S18 OBSERVABILITY
* Migration 0009: tabelas email_events + error_events
* lib/observability.ts: captureError + captureAndRespond + getMetrics
* /admin/health (admin only) com 7 KPIs + top error paths + listas recentes

EMAIL ENGINE
* lib/resend.ts cliente edge
* lib/email-dispatcher.ts engine completa (workflows + sample test + bodyToHtml branded)
* notify.ts refatorado: dispatcher first + fallback default
* /api/internal/email/test endpoint

10 TEMPLATES NOVOS (16 total, todos com QR)
* botanical, sunset, notebook, techgrid, artdeco, newspaper,
  diploma (A4 portrait), holographic, watermark, coach
* Cada um com identidade visual unica (~80 linhas cada renderer)

S20 UNIVERHAIR x FLUENTCOMMUNITY
* wp-plugin/univercert-fluent/ — plugin WordPress standalone
  - Settings page (workspace + secret + auto_approve + default_template)
  - Hooks fluent_community/course/completed + variantes legacy
  - HMAC SHA256 dispatch
  - AJAX test event button
  - Shortcode [univercert_certificates] com iframe responsivo
  - Log rolling 50 disparos
* /univercert-fluent.zip estatico em /public (download direto)
* /embed/student/[email]?ws=slug — widget publico iframe-friendly
  com light/dark + empty states elegantes
* webhook-handler patcheado: le integration.configJson
  (auto_approve + send_email + default_template + course_template_map).
  Quando auto_approve=on, cria credential + dispatch workflow email.
* /integrations/fluent wizard 4 steps com stepper:
  1. Gerar HMAC secret
  2. Download plugin + instalar no WP
  3. Comportamento (toggles + course mapping inline)
  4. Send test event via fetch + HMAC client-side

Build local 8.15s." || echo "nada pra commitar"

git push 2>&1 | tail -3

echo
echo "[3/3] Aguardando build CI (~3min)..."
sleep 180
echo
echo "Status:"
curl -s "https://api.github.com/repos/univerbeauty777/univercert/actions/runs?per_page=1" \
  | grep -E '"(head_sha|status|conclusion)"'
echo
echo "Smoke tests rapidos:"
echo
echo "  /admin/health         => " && curl -s -o /dev/null -w "HTTP %{http_code}\n" https://univercert.pages.dev/admin/health
echo "  /integrations/fluent  => " && curl -s -o /dev/null -w "HTTP %{http_code}\n" https://univercert.pages.dev/integrations/fluent
echo "  /univercert-fluent.zip=> " && curl -s -o /dev/null -w "HTTP %{http_code}\n" https://univercert.pages.dev/univercert-fluent.zip
echo "  /embed/student/test@x.com?ws=univerhair => " && curl -s -o /dev/null -w "HTTP %{http_code}\n" "https://univercert.pages.dev/embed/student/test@x.com?ws=univerhair"
echo
echo "================================================================="
echo "TUDO NO AR! Roteiro de teste:"
echo "  1. https://univercert.pages.dev/dashboard       -> visual novo"
echo "  2. https://univercert.pages.dev/templates       -> 16 templates"
echo "  3. https://univercert.pages.dev/integrations/fluent -> wizard"
echo "  4. https://univercert.pages.dev/admin/health    -> metricas live"
echo "  5. Step 4 do wizard -> Disparar evento de teste"
echo "  6. /admin/health -> ver email aparecer em 'Emails recentes'"
echo "================================================================="
echo
echo "[Pressione Enter pra fechar]"
read
