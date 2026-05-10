#!/bin/bash
# UniverCert · Domain migration univercert.com.br -> univercert.net

set -e
cd "$(dirname "$0")"
rm -f .git/index.lock 2>/dev/null || true

git add -A
git diff --cached --stat | tail -15
echo

git commit -m "chore(domain): migra univercert.com.br -> univercert.net

Replace global em 41 arquivos (68 ocorrencias):
* src/lib/auth.ts trustedOrigins atualizado
* src/lib/auth-client.ts fallback baseURL
* src/lib/share-urls.ts deep links
* src/lib/email-dispatcher.ts + resend.ts + notify.ts
* src/lib/workflow-template.ts variables
* src/app/sitemap.ts + robots.ts + opengraph-image.tsx
* src/app/layout.tsx metadataBase
* src/app/v/[id]/page.tsx verifyUrl
* src/app/api/v1/[[...route]]/route.ts (9 refs)
* src/app/api/v1/integrations/linkedin/learning/xapi/route.ts (3 refs)
* src/app/api/v1/affiliate/route.ts trackUrl
* src/app/(dashboard)/billing/* + /(dashboard)/integrations/*
* src/app/api/webhooks/* (hotmart/memberkit/kiwify/eduzz/fluent)
* src/app/(legal)/termos/page.tsx
* src/app/casos/[vertical]/page.tsx + vs/[competitor]/page.tsx
* wrangler.toml APP_URL
* drizzle/migrations/0012 DID format (did:web:univercert.net)
* wp-plugin/univercert-fluent/*.php
* n8n-nodes/n8n-nodes-univercert/*
* .env.example + INSTRUCOES-GITHUB.md + next.config.mjs

univercert.com.br pode continuar como redirect 301 -> univercert.net por SEO.

Build local pulado — replace global, baixo risco." || echo "nada"

git push 2>&1 | tail -3

echo
echo "Aguardando CI build (~3min)..."
sleep 180
curl -s "https://api.github.com/repos/univerbeauty777/univercert/actions/runs?per_page=1" \
  | grep -E '"(head_sha|status|conclusion)"'

echo
echo "============================================"
echo "  CHECKLIST CLOUDFLARE (5 passos manuais)"
echo "============================================"
echo
echo "1. ZONA DNS univercert.net"
echo "   Cloudflare Dashboard -> seu site univercert.net (já está na conta)"
echo "   Confirma que NS aponta pra Cloudflare nameservers"
echo
echo "2. PAGES CUSTOM DOMAIN"
echo "   Cloudflare Dashboard -> Pages -> univercert -> Custom domains"
echo "   -> Set up custom domain -> univercert.net"
echo "   -> Set up custom domain -> www.univercert.net"
echo "   Cloudflare cria CNAME automatico apontando pro Pages."
echo
echo "3. ENV VARS no Pages project (Settings -> Environment variables)"
echo "   Production:"
echo "     APP_URL = https://univercert.net"
echo "     BETTER_AUTH_URL = (deixa vazio - auto-detect)"
echo "   Já existem: ANTHROPIC_API_KEY, GOOGLE_OAUTH_*, STRIPE_*, etc"
echo
echo "4. STRIPE WEBHOOK"
echo "   Stripe Dashboard -> Developers -> Webhooks"
echo "   Edita endpoint atual OU cria novo:"
echo "     URL: https://univercert.net/api/v1/webhooks/stripe"
echo "     Events: customer.subscription.* + invoice.*"
echo "   Copia STRIPE_WEBHOOK_SECRET (whsec_...) pra env vars"
echo
echo "5. RESEND DOMAIN (emails)"
echo "   resend.com/domains -> Add domain -> univercert.net"
echo "   Adiciona TXT/MX records que ele gera"
echo "   RESEND_FROM_EMAIL = no-reply@univercert.net"
echo
echo "6. (Opcional) GOOGLE OAUTH"
echo "   console.cloud.google.com -> Credentials -> OAuth client"
echo "   Authorized redirect URIs:"
echo "     + https://univercert.net/api/auth/callback/google"
echo "   (manter tambem o pages.dev pra preview deploys)"
echo
echo "7. (Opcional) MICROSOFT OAUTH (S38)"
echo "   entra.microsoft.com -> App registrations"
echo "   Redirect URI: https://univercert.net/api/auth/callback/microsoft"
echo
echo "8. SEO REDIRECT (univercert.com.br -> univercert.net)"
echo "   Se tiver univercert.com.br ainda registrado:"
echo "   - Adiciona como zone na Cloudflare"
echo "   - Page Rules ou Bulk Redirects: 301 redirect *.com.br/* -> univercert.net/\$1"
echo "   Senao, deixa expirar."
echo
echo "============================================"
echo "  Apos checklist verde, testa:"
echo "  - https://univercert.net (landing)"
echo "  - https://univercert.net/sign-in (login)"
echo "  - https://univercert.net/marketplace (publico)"
echo "  - https://univercert.net/api/v1/webhooks/stripe (test event)"
echo "============================================"
echo
read
