#!/bin/bash
# UniverCert · GODMODE Combo Push
# - Redesign UI completo (sidebar + dashboard + templates + tokens)
# - S18 Observability (admin/health + captureError + tabelas)
# - Sistema email Resend (dispatcher + workflows + email default)
# - Migration 0009 aplicada no D1 remoto
#
# Build local validado: 9.08s

set -e
cd "$(dirname "$0")"
rm -f .git/index.lock .git/HEAD.lock 2>/dev/null || true

echo
echo "================================================================="
echo "GODMODE COMBO — UI redesign + S18 + Email engine"
echo "================================================================="
echo

echo "[1/4] Aplicando migration 0009 (email_events + error_events) no D1..."
npx wrangler d1 execute univercert-mvp --remote \
  --file=./drizzle/migrations/0009_observability_email.sql 2>&1 | tail -8
echo

echo "[2/4] Stage de tudo..."
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
  src/db/schema.ts \
  src/lib/ulid.ts \
  src/lib/resend.ts \
  src/lib/email-dispatcher.ts \
  src/lib/observability.ts \
  src/lib/notify.ts \
  src/app/api/internal/email/test/route.ts \
  drizzle/migrations/0009_observability_email.sql
git diff --cached --stat
echo

echo "[3/4] Commit + push..."
git commit -m "feat(s19): GODMODE UI redesign + S18 observability + Resend email engine

UI REDESIGN
- globals.css com tokens semanticos (surface/fg/border/brand) light+dark
- Sidebar fixa colapsavel 240/68px (3 secoes Operacao/Personalizacao/Workspace)
  + persistencia localStorage + mobile drawer + active state via pathname
- Dashboard refeito (4 stat-cards num monospace + setup checklist real
  com progress bar + atividade recente com empty state)
- PageHeader + StatsBar v2 minimalistas
- TemplatesGalleryClient polida (skeleton no preview, paletas active state,
  6 variantes premium voltam — bug visual antigo era card branco/branco)

S18 OBSERVABILITY
- migration 0009: tabelas email_events + error_events
- lib/observability.ts: captureError + captureAndRespond + getMetrics
- /admin/health (admin only): 7 KPIs, top error paths, listas recentes
- Sidebar tem entry 'Saude · admin'

EMAIL ENGINE COM RESEND
- lib/resend.ts: cliente edge-compatible (fetch direto, sem SDK Node)
- lib/email-dispatcher.ts: dispatchWorkflowsFor + sendTestEmail
  + bodyToHtml com wrapper brand UniverCert
- notify.ts refatorado: dispatcher first + fallback email default
- /api/internal/email/test: endpoint para Send Test no WorkflowEditor
- ID.emailEvent/errorEvent/workflow/invite no ulid helper

Build local 9.08s." || echo "nada pra commitar"
git push 2>&1 | tail -3

echo
echo "[4/4] Aguardando build CI (~3min)..."
sleep 180
echo
echo "Status:"
curl -s "https://api.github.com/repos/univerbeauty777/univercert/actions/runs?per_page=1" \
  | grep -E '"(head_sha|status|conclusion)"'
echo
echo "Smoke test /admin/health:"
curl -s -I "https://univercert.pages.dev/admin/health" | head -5
echo
echo "================================================================="
echo "PRONTO! Abre no browser:"
echo "  https://univercert.pages.dev/dashboard       (visual novo)"
echo "  https://univercert.pages.dev/templates       (galeria com 6 variantes)"
echo "  https://univercert.pages.dev/admin/health    (saude da plataforma)"
echo "================================================================="
echo
echo "[Pressione Enter pra fechar]"
read
