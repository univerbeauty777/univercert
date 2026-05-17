#!/bin/bash
# UniverCert · S78c — render-pdf.ts agora usa CF Browser Rendering REST API
#
# Descoberta: Cloudflare Pages IGNORA o [browser] binding do wrangler.toml.
# (Só funciona em Workers, não em Pages — UI mostra só KV/D1/R2 nos bindings.)
#
# Fix: 3 caminhos em ordem (binding → REST API → Browserless).
# Caminho 2 (REST API) é o que vai funcionar em produção.
#
# Setup necessário ANTES de re-chamar regenerate-missing:
#   1. Criar API token no Cloudflare com Browser Rendering Edit perm:
#      https://dash.cloudflare.com/profile/api-tokens
#   2. Adicionar no Pages env vars (production):
#      CF_ACCOUNT_ID = 4a89b58af57b3ffb99858479a75b1e61 (plaintext)
#      CF_BROWSER_API_TOKEN = <token-gerado> (secret/encrypted)

set -e
cd "$(dirname "$0")"
rm -f .git/index.lock 2>/dev/null || true

git fetch origin main 2>&1 | tail -3
LOCAL=$(git rev-parse HEAD); REMOTE=$(git rev-parse origin/main)
if [ "$LOCAL" != "$REMOTE" ]; then
  git stash -u 2>/dev/null || true
  git reset --hard origin/main
  git stash pop 2>/dev/null || true
fi

git status --short
git add -A
git diff --cached --stat | tail -5

git commit -m "fix(s78c): render-pdf.ts usa CF Browser Rendering REST API (Pages-compat)

Descoberta: Cloudflare Pages IGNORA o [browser] binding do wrangler.toml.
UI de bindings só lista KV/D1/R2 — Browser Rendering só funciona via
binding em Workers, NAO em Pages. Por isso env.BROWSER=undefined em prod.

Fix em src/lib/render-pdf.ts — 3 caminhos em ordem:
1. env.BROWSER binding (Workers; ignorado em Pages)
2. CF Browser Rendering REST API via fetch — funciona em Pages
   Precisa: CF_ACCOUNT_ID + CF_BROWSER_API_TOKEN env vars
3. Browserless.io fallback (BROWSERLESS_API_KEY)

Setup pós-deploy:
- Criar API token em https://dash.cloudflare.com/profile/api-tokens
  com permission 'Browser Rendering: Edit'
- Pages env vars (production):
  CF_ACCOUNT_ID = 4a89b58af57b3ffb99858479a75b1e61
  CF_BROWSER_API_TOKEN = <secret>

Depois re-chamar /api/v1/credentials/regenerate-missing pra renderizar
o cert da Aline (cred_6CEBD0B5AB5D414EBCC086E5FCDB7410)." || echo "(nada novo)"

git push 2>&1 | tail -3
echo
echo "Aguardando CI (~3min)..."
sleep 180
curl -s "https://api.github.com/repos/univerbeauty777/univercert/actions/runs?per_page=1" \
  | python3 -c "import sys,json; r=json.load(sys.stdin)['workflow_runs'][0]; print(f\"#{r['run_number']} {r['conclusion']} {r['html_url']}\")"
echo
echo "============================================"
echo "  PROXIMO PASSO MANUAL"
echo "============================================"
echo "1. Criar API token: https://dash.cloudflare.com/profile/api-tokens"
echo "   - Use template 'Create Custom Token'"
echo "   - Permission: Account > Browser Rendering > Edit"
echo "   - Account Resources: Include > DXPRO Univerbeauty"
echo "   - Copie o token gerado"
echo
echo "2. Adicionar env vars no Pages (production):"
echo "   https://dash.cloudflare.com/4a89b58af57b3ffb99858479a75b1e61/pages/view/univercert/settings/environment-variables"
echo "   - CF_ACCOUNT_ID = 4a89b58af57b3ffb99858479a75b1e61 (Plaintext)"
echo "   - CF_BROWSER_API_TOKEN = <token-do-passo-1> (Secret/Encrypt)"
echo
echo "3. Re-deploy pra env vars entrarem em vigor"
echo "   (Pages Deployments > Production > Retry deployment)"
echo
echo "4. Me avisa que eu re-chamo o regenerate-missing automaticamente"
echo
read
