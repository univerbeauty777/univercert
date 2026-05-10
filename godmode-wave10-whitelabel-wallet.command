#!/bin/bash
# UniverCert · WAVE 10 — White-label completo (S60+S62+S63) + Email domains (S61) + Wallet real (S55+S56)

set -e
cd "$(dirname "$0")"
rm -f .git/index.lock 2>/dev/null || true

git add -A
git diff --cached --stat | tail -20
echo

git commit -m "feat(s60+s62+s63+s61+s55+s56): white-label total + email domains + Wallet real

S60+S62+S63 — WHITE-LABEL TOTAL:
* lib/whitelabel.ts: getWhiteLabelContext(workspaceId)
  - Detecta isCustomDomain via host header
  - Cruza com plano (Pro+ tem removeWatermark)
  - hideUniverCertBrand = isCustomDomain && Pro+
  - Retorna brand color, logo, footer string
* /v/[id] page atualizada:
  - verifyUrl usa host header atual (custom domain)
  - Footer condicional: 'Powered by UniverCert' OU 'Certificados de {Workspace}'
  - CTA 'Você é uma escola...' escondido em white-label

S61 — CUSTOM EMAIL SENDER DOMAIN:
* Migration 0018: workspace_email_domains (domain unique, resend_id, status,
  records_json com DKIM/SPF/DMARC)
* lib/resend-domains.ts: createResendDomain, getResendDomain, verifyResendDomain
* /api/v1/email/domains (GET list / POST create):
  - admin only + plan check (customDomain feature, Pro+)
  - Cria no Resend + salva records DNS pra UI mostrar
* /api/v1/email/domains/[id]/verify (POST):
  - Dispara verify Resend + atualiza status
  - status: pending/verifying/verified/failed
* Pre-requisito: RESEND_API_KEY env var ja configurado

S56 — GOOGLE WALLET JWT REAL:
* lib/google-wallet.ts:
  - signGoogleWalletJwt: RS256 via crypto.subtle (edge-compatible!)
  - importPrivateKey PKCS8 PEM
  - googleWalletSaveUrl helper
  - Pass struct: cardTitle, header, subheader, textModulesData, barcode QR,
    linksModuleData, hexBackgroundColor
* /api/v1/credentials/[id]/wallet/google atualizado:
  - Substitui stub por signing JWT real
  - Redirect 302 pra https://pay.google.com/gp/v/save/{jwt}
  - Track share event automatico
* Env vars: GOOGLE_WALLET_ISSUER_ID, GOOGLE_WALLET_SA_EMAIL,
  GOOGLE_WALLET_SA_PRIVATE_KEY (PEM PKCS8)

S55 — APPLE WALLET PKPASS:
* lib/apple-wallet.ts:
  - buildPassJson: estrutura completa pkpass (primary/secondary/auxiliary fields,
    backFields, barcode QR, webServiceURL)
  - generateSignedPkpass: chama worker externo dedicado pra signing PKCS#7
    (edge runtime nao suporta node-forge nativamente)
* /api/v1/credentials/[id]/wallet/apple atualizado:
  - Quando APPLE_PASS_SIGNING_WORKER_URL configurado, chama worker
  - Worker template: https://github.com/walletpasses/passkit-generator deployado
    como Cloudflare Worker separado com Node.js compat
  - Track share event automatico
* Env vars: APPLE_WALLET_PASS_TYPE_ID, APPLE_WALLET_TEAM_ID,
  APPLE_PASS_SIGNING_WORKER_URL, APPLE_PASS_SIGNING_WORKER_SECRET

ULID: + emailDomain prefix.

DEPLOYMENT NOTES:
* Worker Apple Wallet pode ser deploy separado (~50 linhas Node + node-forge)
  ou usar serviço externo (PassNinja, Passcreator).
* Plan limit removeWatermark ja faz gate no Pro+ — sem custom domain o cert
  ainda renderiza com branding UniverCert. Custom domain + Pro+ = 100% white-label." || echo "nada"

git push 2>&1 | tail -3

echo
echo "Aguardando CI build (~3min)..."
sleep 180
curl -s "https://api.github.com/repos/univerbeauty777/univercert/actions/runs?per_page=1" \
  | grep -E '"(head_sha|status|conclusion)"'

echo
echo "Apos verde:"
echo "  1. Migration 0018:"
echo "     wrangler d1 execute univercert-mvp --remote --file=drizzle/migrations/0018_email_domains.sql"
echo
echo "  2. Google Wallet (quando quiser):"
echo "     - https://pay.google.com/business/console -> registrar issuer"
echo "     - Google Cloud -> Service Account com role wallet_object.issuer"
echo "     - Env vars: GOOGLE_WALLET_ISSUER_ID, GOOGLE_WALLET_SA_EMAIL,"
echo "       GOOGLE_WALLET_SA_PRIVATE_KEY (PEM completo, multiline em quotes)"
echo
echo "  3. Apple Wallet (quando quiser):"
echo "     - Apple Developer (\$99/ano) -> Pass Type ID + cert .p12"
echo "     - Deploy worker passkit-generator separado (~5min)"
echo "     - Env vars: APPLE_WALLET_PASS_TYPE_ID, APPLE_WALLET_TEAM_ID,"
echo "       APPLE_PASS_SIGNING_WORKER_URL, APPLE_PASS_SIGNING_WORKER_SECRET"
echo
echo "  4. Resend custom domain:"
echo "     - Ja funciona se RESEND_API_KEY tiver permissao de criar domains"
echo "     - Cliente acessa /integrations/email-domain (UI proxima onda)"
echo "     - Cria via POST /api/v1/email/domains, copia DNS records, verifica"
echo
read
