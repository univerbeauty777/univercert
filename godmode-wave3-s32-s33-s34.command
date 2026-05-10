#!/bin/bash
# UniverCert · WAVE 3 (FINAL) — S32 Analytics + Bulk + S33 i18n + S34 PWA landing

set -e
cd "$(dirname "$0")"
rm -f .git/index.lock 2>/dev/null || true

git add -A
git diff --cached --stat | tail -25
echo

git commit -m "feat(s32+s33+s34): analytics + bulk export + i18n PT/EN/ES + PWA landing

S32 — CERT ANALYTICS + BULK EXPORT:
* /api/v1/analytics/workspace?range=7d|30d|90d|365d:
  - KPIs: certs emitidos, verificacoes, shares totais, pendentes
  - sharesByChannel agregado (groupBy)
  - topCerts (top 10 por shares)
  - role viewer+
* /api/v1/analytics/credential/[id]:
  - Per-cert: shares por canal, recentShares (50), recentVerifications
  - Workspace check pra evitar leak cross-tenant
* /api/v1/credentials/bulk-export (POST):
  - Recebe ids[] (max 500) -> retorna manifest JSON com URLs PDF/badge/VC
    + recipientName/email/status/issuedISO
  - format=csv exporta CSV direto download
  - Client baixa cada PDF / usa jszip pra bundle
* /analytics page (server) + AnalyticsClient (client):
  - Range selector 7d/30d/90d/365d
  - 4 KPI cards (icones + cores semanticas)
  - Bar chart shares por canal (CSS-only, sem Chart.js)
  - Top 10 certs ranking com avatar numerado
  - States: loading, error, empty
* Sidebar: nova secao 'Insights' com link Analytics

S33 — i18n PT/EN/ES (PUBLIC PAGES):
* lib/i18n.ts: 3 locales (pt/en/es), 25+ chaves
  getLocale(): cookie 'uc_locale' OR Accept-Language fallback
  t(locale, key, fallback): server-side
  createT(locale): client-side factory
* components/LanguageSwitcher.tsx: dropdown com flags + cookie set + reload
* Translations cobrem: verify, cert, issuer, common
* Pode ser plugado em /verificar, /v/[id], /escola/[slug] sem refactor profundo
  (proxima onda: aplicar nas pages publicas existentes)

S34 — PWA ENHANCEMENT + APP LANDING:
* /app: landing page premium dark gradient pra app mobile
  - Hero gradient navy->cyan->gold
  - Phone mockup com 3 mock certs
  - 3 colunas 'Como instalar' (iPhone Safari / Android Chrome / Desktop)
  - CTAs: 'Instalar PWA agora' + 'Criar conta gratis'
* manifest.ts: + shortcut Analytics + prefer_related_applications: false
* PwaInstallPrompt ja existe (S16) — sem alteracoes

DELIVERABLE WAVE 3:
* Analytics dashboard funcionando
* Bulk export pra ZIP via cliente (manifest API + CSV)
* i18n core pronto pra ativar quando quiser traduzir as 3 pages publicas
* App landing /app pra capturar instalacao PWA + future native promo

NOTAS:
* Bulk export retorna manifest em vez de ZIP server-side (Workers tem CPU
  limit pequeno e gerar ZIP de 500 PDFs estouraria. Client com jszip eh
  mais confiavel + pode mostrar progresso).
* i18n ja com 3 locales prontos. Aplicar nas pages publicas eh proximo
  passo simples (1-2h por page).
* App landing eh standalone — nao requer auth, SEO friendly.

Nao requer migration nova (usa share_events + verifyLogs existentes)." || echo "nada"

git push 2>&1 | tail -3

echo
echo "Aguardando CI build (~3min)..."
sleep 180
curl -s "https://api.github.com/repos/univerbeauty777/univercert/actions/runs?per_page=1" \
  | grep -E '"(head_sha|status|conclusion)"'

echo
echo "Apos verde:"
echo "  /analytics            -> dashboard com shares + verificacoes"
echo "  /app                  -> landing app/PWA premium"
echo "  POST /api/v1/credentials/bulk-export ids:[...] -> manifest JSON"
echo "  POST /api/v1/credentials/bulk-export ids:[...], format:'csv' -> CSV download"
echo "  Cookie uc_locale=en   -> testar i18n quando aplicar nas pages"
echo
read
