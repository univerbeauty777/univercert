#!/bin/bash
# UniverCert · WAVE 6 — S43 (Marketplace) + S44 (Affiliate) + S45 (Educator partner) + S46 (Embed badge)

set -e
cd "$(dirname "$0")"
rm -f .git/index.lock 2>/dev/null || true

git add -A
git diff --cached --stat | tail -25
echo

git commit -m "feat(s43+s44+s45+s46): marketplace + affiliate + educator partner + embed badge

S43 — TEMPLATE MARKETPLACE:
* /api/v1/marketplace?category=&q=&lang=: lista (status approved+featured)
  - Categorias: beauty/education/tech/sports/mba/general
  - 3 idiomas (pt/en/es)
* /api/v1/marketplace/[id]/install (POST): clona template pro workspace
  - editor+ role, bump downloads counter
  - Premium gate (requer Pro+ pra premium gratis)
  - Paid templates 501 ate Stripe Connect
* /api/v1/marketplace/submit (POST): editor submete template do ws
  - Status pending -> review manual em 48h
* /marketplace page publica + MarketplaceClient
  - Search, filtro categoria, grid 4 cols
  - Cards com preview, downloads, rating, badges (FEATURED/PRO)
  - Botao 'Usar template' / 'Comprar R\$X'

S44 — AFFILIATE TRACKING:
* lib/affiliate.ts:
  - setReferralCookie / getReferralCookie / clearReferralCookie (60d TTL)
  - attributeSignup -> registra referral + bump totalSignups
  - creditConversion -> credita comissao no Stripe webhook
  - createAffiliate (default 10%)
* /api/v1/affiliate/track?ref=CODE&redirect=/path: seta cookie + 302
* /api/v1/affiliate (GET stats / POST cria):
  - admin role
  - GET retorna stats + referrals + trackUrl
  - POST cria affiliate (1 por ws)
* /affiliate dashboard + AffiliateClient
  - 4 KPIs (comissao, pago, signups, pagantes)
  - Card 'Seu link' com copy button
  - Tabela referrals (data, status, pagou, comissao, fonte)
  - Empty state com CTA + link educator program

S45 — EDUCATOR PARTNER PROGRAM:
* /api/v1/partner/apply (POST): cria partner_application pendente
  - Email + nome + audience size + niche + channels[] + motivation
* /partner/apply page client form premium
  - Niche dropdown (cabelo/estetica/educacao/tech/mba/etc)
  - Channels chips toggle (instagram/youtube/tiktok/site/newsletter/podcast)
  - Success state com confirmation
* Tier 'educator' = 20% comissao (vs default 10%)
* Approval flow: admin manual cria affiliate com tier='educator'

S46 — EMBED BADGE CODE:
* /api/v1/embed/badge/[ws]?variant=badge|counter|featured: SVG embedavel
  - 'badge' (180x36): logo navy/gold + 'verificado'
  - 'counter' (200x60): mostra total certs emitidos
  - 'featured' (240x80): card horizontal com nome escola
  - Cada GET registra embed_view (tracking referer domain)
  - Cache-control 1h + CORS open
  - Cliente cola: <a href='/escola/slug'><img src='/api/v1/embed/badge/slug?variant=badge'/></a>

MIGRATION 0016_marketplace_affiliate.sql:
* template_marketplace (id, source_*, layout_json, status, downloads, rating)
* affiliates (1 per ws, code unique, tier, commission_pct, totals)
* referrals (multi per affiliate, status signup/paying/churned, commission_earned)
* partner_applications (email/niche/audience/channels/motivation, status)
* embed_views (workspace_id, variant, referer_domain, ip_hash, ua)

ULID: + marketplace/affiliate/referral/partnerApp/embedView prefixes.

NOTAS:
* Premium templates pagos requerem Stripe Connect — 501 ate prox sprint
* Hook attributeSignup() precisa ser chamado no /sign-up server action
  (Wave 6b — proximo commit pequeno)
* Hook creditConversion() precisa ser chamado no Stripe webhook invoice.paid
  (Wave 6b)" || echo "nada"

git push 2>&1 | tail -3

echo
echo "Aguardando CI build (~3min)..."
sleep 180
curl -s "https://api.github.com/repos/univerbeauty777/univercert/actions/runs?per_page=1" \
  | grep -E '"(head_sha|status|conclusion)"'

echo
echo "Apos verde:"
echo "  1. Migration 0016:"
echo "     wrangler d1 execute univercert-prod --remote --file=drizzle/migrations/0016_marketplace_affiliate.sql"
echo
echo "  2. Testar:"
echo "     /marketplace                                  -> grid publico"
echo "     /affiliate                                     -> ativa codigo"
echo "     /partner/apply                                 -> form educator"
echo "     /api/v1/embed/badge/univerhair?variant=badge   -> SVG"
echo
read
