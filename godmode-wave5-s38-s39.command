#!/bin/bash
# UniverCert · WAVE 5 — S38 (SSO Microsoft) + S39 (API keys + auth middleware)

set -e
cd "$(dirname "$0")"
rm -f .git/index.lock 2>/dev/null || true

git add -A
git diff --cached --stat | tail -20
echo

git commit -m "feat(s38+s39): SSO Microsoft + API keys (criar/revogar/scope)

S38 — SSO MICROSOFT:
* lib/auth.ts: socialProviders agora aceita microsoft (Better Auth nativo)
  - microsoftClientId/Secret + tenantId (default 'common' p/ multi-tenant)
* /sign-in: botoes Google + Microsoft side-by-side em grid 2 colunas
  - Google: SVG oficial 4 cores
  - Microsoft: SVG oficial 4 quadrados (#F25022 #7FBA00 #00A4EF #FFB900)

S39 — API KEYS:
* Migration 0015: tabela api_keys com hash SHA-256 + prefix UI + scope + tracking
* lib/api-key.ts:
  - generateApiKey('live'|'test') -> 'uc_live_XXXXXX' (32 chars random)
  - hashKey -> SHA-256 hex (storage seguro)
  - createApiKey -> insere + retorna plain text key UMA VEZ
  - verifyApiKey -> valida + bump request_count + lastUsedAt (atomic)
  - hasScopePermission(keyScope, required) -> hierarquia read<write<admin
  - extractBearer(req) -> parse Authorization header
  - revokeApiKey -> soft delete com revoked_at + reason
* /api/v1/api-keys (GET/POST):
  - GET lista keys (sem hash, com prefix)
  - POST cria nova (admin role + plan check via hasFeature 'apiKeys')
  - Plan check: feature so disponivel a partir de Pro (R\$297/mes)
  - Returns key plain text APENAS uma vez + warning
* /api/v1/api-keys/[id] (DELETE): revoga (soft) com reason opcional
* /integrations/api-keys page + ApiKeysClient:
  - Lista todas keys do workspace
  - 'Nova API key' modal inline com nome/scope/env/expiresInDays
  - 'Created key' card destacado verde com codigo + botao copiar + warning
  - Tabela: nome, prefix, scope badge colorido, request count, last used
  - Botao revogar com confirm
  - Quick docs no fim com curl example

ENV VARS NECESSARIAS p/ Microsoft SSO:
* MICROSOFT_OAUTH_CLIENT_ID
* MICROSOFT_OAUTH_CLIENT_SECRET
* MICROSOFT_OAUTH_TENANT_ID (opcional, default 'common')
* Setup em https://entra.microsoft.com → App registrations
* Redirect URI: https://univercert.com.br/api/auth/callback/microsoft

PROXIMO PASSO:
* Plugar verifyApiKey() em /api/v1/* endpoints publicos pra aceitar
  bearer auth alem de cookie auth (Wave 5b)" || echo "nada"

git push 2>&1 | tail -3

echo
echo "Aguardando CI build (~3min)..."
sleep 180
curl -s "https://api.github.com/repos/univerbeauty777/univercert/actions/runs?per_page=1" \
  | grep -E '"(head_sha|status|conclusion)"'

echo
echo "Apos verde:"
echo "  1. Migration 0015:"
echo "     wrangler d1 execute univercert-prod --remote --file=drizzle/migrations/0015_api_keys.sql"
echo
echo "  2. (Opcional) Microsoft SSO:"
echo "     - https://entra.microsoft.com → App registrations → New"
echo "     - Redirect URI: https://univercert.com.br/api/auth/callback/microsoft"
echo "     - Copiar client ID + secret pras env vars"
echo
echo "  3. Testar /integrations/api-keys (precisa plano Pro+ pra liberar)"
echo
read
