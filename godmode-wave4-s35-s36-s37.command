#!/bin/bash
# UniverCert · WAVE 4 — S35 (Stripe + Pagar.me billing) + S36 (plan limits) + S37 (/billing GODMODE)

set -e
cd "$(dirname "$0")"
rm -f .git/index.lock 2>/dev/null || true

git add -A
git diff --cached --stat | tail -25
echo

git commit -m "feat(s35+s36+s37): billing real (Stripe + Pagar.me) + plan limits + /billing GODMODE

S35 — STRIPE + PAGAR.ME BILLING:
* lib/plans.ts: 4 planos (free/starter/pro/enterprise) com prices BRL
  - Free: 50 certs/mes, 1 user
  - Starter R\$97/mes ou R\$970/ano: 500 certs, 3 users, bulk export
  - Pro R\$297/mes ou R\$2970/ano: 5k certs, 15 users, 3 ws, custom domain,
    sem watermark, API keys, audit export, prioridade
  - Enterprise: custom (SSO, ilimitado, white-label total, SLA)
* lib/stripe-client.ts: fetch wrapper edge-compatible
  - createCheckoutSession (subscription mode + trial 14d + promo codes)
  - createPortalSession (customer portal pra cartao/cancelar)
  - verifyStripeSignature (HMAC SHA-256 + timing-safe compare)
* /api/v1/billing/checkout (POST): admin only, valida plan, cria session
  - Stripe ready (precisa STRIPE_PRICE_* env vars)
  - Pagar.me 501 ate creds plugadas
* /api/v1/billing/portal (POST): admin only, abre Stripe portal
* /api/v1/webhooks/stripe (POST): handlers
  - customer.subscription.created/updated -> upsert subscriptions
  - customer.subscription.deleted -> downgrade pra free
  - invoice.paid/finalized/payment_failed -> insert invoices
  - HMAC verify obrigatorio
* /api/v1/webhooks/pagarme (POST): stub honesto

S36 — PLAN LIMITS ENFORCEMENT:
* lib/plan-limits.ts:
  - getWorkspacePlan(wsId) -> consulta subscriptions
  - getCurrentUsage(wsId) -> pega usage_meters do periodo YYYY-MM
  - incrementUsage atomic upsert (INSERT OR UPDATE)
  - checkCertLimit -> hard block ao atingir + soft warning 80%
  - checkAiLimit -> hard block ao atingir
  - hasFeature(wsId, 'customDomain') etc

S37 — /BILLING GODMODE:
* /billing page (server) + BillingClient (client)
  - 3 cards: plano atual + uso certs + uso AI
  - Toggle mensal/anual com badge 'economia R\$X'
  - Grid 4 plans (current destacado verde, popular destacado navy)
  - Trial badge + period end + cancel notice
  - Botao 'Gerenciar assinatura' -> Stripe portal
  - Botao 'Upgrade' -> checkout Stripe
  - Plano Enterprise -> mailto:contato
  - Tabela invoice history (CSV-like) com status badge + PDF download
  - /api/v1/billing/usage retorna tudo agregado
  - Substituiu pagina antiga com hardcoded ws_univerhair

MIGRATION 0014_billing.sql:
* subscriptions (1 per ws, plan/status/provider/period/cancel_at_period_end)
* invoices (multi per ws, provider+invoice_id unique)
* usage_meters (composite PK ws_id+period_ym, atomic counters)

ULID: + subscription/invoice prefixes.

ENV VARS NECESSARIAS apos push:
* STRIPE_SECRET_KEY (sk_live_... ou sk_test_...)
* STRIPE_WEBHOOK_SECRET (whsec_...)
* STRIPE_PRICE_STARTER_MONTHLY, _YEARLY
* STRIPE_PRICE_PRO_MONTHLY, _YEARLY
* (futuro) PAGARME_API_KEY + PAGARME_WEBHOOK_SECRET

PROXIMOS PASSOS:
* Cadastrar webhook URL no Stripe Dashboard:
  https://univercert.com.br/api/v1/webhooks/stripe
  Eventos: customer.subscription.* + invoice.*
* Plugar checkAiLimit() nos 3 endpoints AI (S28) — proximo commit
* Plugar checkCertLimit() no emit endpoint (queue approve) — proximo commit" || echo "nada"

git push 2>&1 | tail -3

echo
echo "Aguardando CI build (~3min)..."
sleep 180
curl -s "https://api.github.com/repos/univerbeauty777/univercert/actions/runs?per_page=1" \
  | grep -E '"(head_sha|status|conclusion)"'

echo
echo "Apos verde:"
echo "  1. Migration 0014:"
echo "     wrangler d1 execute univercert-prod --remote --file=drizzle/migrations/0014_billing.sql"
echo
echo "  2. Stripe setup (10 min):"
echo "     - Criar 4 produtos no Stripe Dashboard (starter, pro)"
echo "     - 8 prices (mensal + anual de cada)"
echo "     - Copiar price IDs pras env vars STRIPE_PRICE_*"
echo "     - Criar webhook https://univercert.com.br/api/v1/webhooks/stripe"
echo "     - Copiar STRIPE_SECRET_KEY + STRIPE_WEBHOOK_SECRET pras env vars"
echo
echo "  3. Testar /billing -> upgrade -> Stripe checkout -> sucesso"
echo
read
