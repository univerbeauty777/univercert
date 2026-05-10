#!/bin/bash
# UniverCert · Domain migration LOCAL — roda sed direto no Mac antes do push
# (Necessario porque sed remoto via Cowork bash nao sempre sincroniza)

set -e
cd "$(dirname "$0")"
rm -f .git/index.lock 2>/dev/null || true

echo "==> Substituindo univercert.com.br -> univercert.net em todos os arquivos..."

# macOS sed precisa de '' no -i. Acha tudo que ainda tem .com.br
files_before=$(grep -rl "univercert\.com\.br" src/ public/ wrangler.toml drizzle/ wp-plugin/ n8n-nodes/ next.config.mjs .env.example INSTRUCOES-GITHUB.md README.md SECURITY.md 2>/dev/null | grep -v node_modules | grep -v ".next/" | grep -v ".vercel/" || true)

if [ -z "$files_before" ]; then
  echo "(nenhum arquivo com .com.br encontrado)"
else
  echo "Arquivos a modificar:"
  echo "$files_before" | sed 's/^/  · /'
  echo
fi

# Replace global em todas extensoes relevantes
LC_ALL=C find src/ public/ drizzle/ wp-plugin/ n8n-nodes/ \
  -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.json" \
            -o -name "*.md" -o -name "*.sql" -o -name "*.toml" -o -name "*.php" \
            -o -name "*.mjs" -o -name "*.css" -o -name "*.html" \) \
  -exec sed -i '' 's/univercert\.com\.br/univercert.net/g' {} + 2>/dev/null

# Arquivos top-level
for f in wrangler.toml next.config.mjs .env.example INSTRUCOES-GITHUB.md README.md SECURITY.md; do
  [ -f "$f" ] && sed -i '' 's/univercert\.com\.br/univercert.net/g' "$f"
done

echo
files_after=$(grep -rl "univercert\.com\.br" src/ public/ wrangler.toml drizzle/ wp-plugin/ n8n-nodes/ next.config.mjs .env.example INSTRUCOES-GITHUB.md README.md SECURITY.md 2>/dev/null | grep -v node_modules | grep -v ".next/" | grep -v ".vercel/" || true)
if [ -z "$files_after" ]; then
  echo "✓ Migracao 100% — 0 arquivos com .com.br restantes"
else
  echo "⚠ Ainda restam:"
  echo "$files_after"
fi
echo

# Git status
echo "==> Git status (preview):"
git status --short | head -40
echo

git add -A
git diff --cached --stat | tail -15
echo

git commit -m "chore(domain): migra univercert.com.br -> univercert.net

Replace global em tudo: src/ public/ drizzle/ wp-plugin/ n8n-nodes/
+ wrangler.toml + next.config.mjs + .env.example + INSTRUCOES + READMEs

* lib/auth.ts trustedOrigins
* lib/auth-client.ts fallback baseURL
* lib/share-urls.ts deep links
* lib/email-dispatcher + resend + notify + workflow-template
* sitemap + robots + opengraph + layout metadataBase
* /v/[id] verifyUrl + /verificar
* api/v1/[[...route]] (9 refs) + linkedin/learning/xapi (3)
* affiliate/route trackUrl + billing/checkout
* dashboard pages: billing/integrations/domain/team/templates/queue
* webhooks: hotmart/memberkit/kiwify/eduzz/fluent
* casos/[vertical] + vs/[competitor] + solicitar + termos
* drizzle/0012 DID format (did:web:univercert.net)
* wp-plugin php + n8n-nodes pacote
* .env.example + INSTRUCOES + README

Build local pulado — replace global, baixo risco." || echo "nada a commitar"

git push 2>&1 | tail -3

echo
echo "Aguardando CI build (~3min)..."
sleep 180
curl -s "https://api.github.com/repos/univerbeauty777/univercert/actions/runs?per_page=1" \
  | grep -E '"(head_sha|status|conclusion)"'

echo
echo "============================================"
echo "  CHECKLIST CLOUDFLARE (8 passos manuais)"
echo "============================================"
echo
echo "1. ZONA DNS univercert.net"
echo "   Cloudflare Dashboard -> seu site univercert.net (ja esta na conta)"
echo "   Confirma que NS aponta pra Cloudflare nameservers"
echo
echo "2. PAGES CUSTOM DOMAIN"
echo "   Cloudflare Dashboard -> Pages -> univercert -> Custom domains"
echo "   -> Set up custom domain -> univercert.net"
echo "   -> Set up custom domain -> www.univercert.net"
echo "   Cloudflare cria CNAME automatico apontando pro Pages."
echo
echo "3. ENV VARS no Pages (Settings -> Environment variables -> Production)"
echo "   APP_URL = https://univercert.net"
echo "   BETTER_AUTH_URL = (deixa vazio - auto-detect)"
echo
echo "4. STRIPE WEBHOOK"
echo "   Stripe Dashboard -> Developers -> Webhooks"
echo "   Edita endpoint: URL = https://univercert.net/api/v1/webhooks/stripe"
echo "   Events: customer.subscription.* + invoice.*"
echo "   Copia STRIPE_WEBHOOK_SECRET pras env vars"
echo
echo "5. RESEND DOMAIN (emails)"
echo "   resend.com/domains -> Add domain -> univercert.net"
echo "   Adiciona TXT/MX records que ele gera (DKIM/SPF)"
echo "   RESEND_FROM_EMAIL = no-reply@univercert.net"
echo
echo "6. (Opcional) GOOGLE OAUTH"
echo "   console.cloud.google.com -> Credentials -> OAuth client"
echo "   Authorized redirect URIs +="
echo "     https://univercert.net/api/auth/callback/google"
echo
echo "7. (Opcional) MICROSOFT OAUTH (S38)"
echo "   entra.microsoft.com -> App registrations"
echo "   Redirect URI: https://univercert.net/api/auth/callback/microsoft"
echo
echo "8. SEO REDIRECT (se ainda tiver .com.br)"
echo "   Cloudflare zona .com.br -> Bulk Redirects ou Page Rules:"
echo "   301 redirect *.com.br/* -> https://univercert.net/\$1"
echo
echo "============================================"
echo "[Pressione Enter pra fechar]"
read
