#!/bin/bash
# UniverCert · WAVE 9 — S40 (Outgoing webhooks) + S41 (2FA + IP allowlist schema) + S42 (Audit export) + S48 (AI fraud detection)

set -e
cd "$(dirname "$0")"
rm -f .git/index.lock 2>/dev/null || true

git add -A
git diff --cached --stat | tail -25
echo

git commit -m "feat(s40+s41+s42+s48): outgoing webhooks + 2FA schema + audit export + AI fraud detection

S40 — OUTGOING WEBHOOKS:
* lib/webhook-dispatcher.ts:
  - dispatchWebhook(workspaceId, payload) → busca subscribed endpoints + dispatch
  - deliverOnce: HMAC SHA-256 signature + 8s timeout
  - Retry exponencial: 1m, 5m, 30m, 2h, 6h (5 attempts max)
  - Headers: x-univercert-signature, x-univercert-timestamp
  - generateWebhookSecret: 'whsec_' + 64 hex chars
* /api/v1/webhooks/endpoints (GET list / POST create):
  - admin only
  - 8 events suportados: cert.issued/revoked, request.submitted/approved/rejected/needs_revision,
    recipient.created, workspace.member.invited
  - Wildcard '*' aceito
  - Secret retornado UMA vez na criacao
* /api/v1/webhooks/endpoints/[id] (DELETE/PATCH)
* /api/v1/webhooks/retry (POST/GET): cron-friendly endpoint
  - Auth via Bearer CRON_SECRET env var
  - Pega ate 20 deliveries pending por batch
  - Marca endpoint como 'failing' apos max attempts

S41 — 2FA + IP ALLOWLIST (SCHEMA):
* workspace_security: enforce_2fa, ip_allowlist_json, api_ip_allowlist_json,
  session_max_minutes, password_min_length, require_strong_password
* user_2fa: secret (TOTP base32), backup_codes_hash, enabled_at, last_used_at
* Better Auth twoFactor plugin podera ser plugado no auth.ts numa proxima onda

S42 — AUDIT LOG EXPORT:
* /api/v1/audit/export?from=YYYY-MM-DD&to=YYYY-MM-DD&format=csv|json
  - admin only + plan check (Pro+)
  - Range default: ultimos 90 dias
  - Max 10k rows por export (truncated:true se atingir)
  - JOIN com users pra trazer email + name
  - Formato CSV com headers + escape
  - Formato JSON com metadata parsed + ISO dates
  - Filename: audit-{slug}-{date}.{ext}

S48 — AI FRAUD DETECTION (FACE MATCH):
* /api/v1/ai/detect-fraud (POST): Claude Sonnet 4.6 vision
  - Recebe selfie + referencia (RG/CNH/cert antigo)
  - System prompt forense detalhado
  - Detecta: same person? authentic? AI generated? photoshopped?
  - Verdict: approved / review_needed / rejected
  - match_confidence + reasons + warnings
  - Sonnet (nao Haiku) porque face match precisa de mais precisao
  - Plan limit AI integrado + role aprovador+
  - Custo ~R\$0.20-0.40 por analise (Sonnet 4.6 vision)

MIGRATION 0017_webhooks_security.sql:
* webhook_endpoints + webhook_deliveries (com indexes pending/event)
* workspace_security + user_2fa
* ULID prefixes: webhookEndpoint, webhookDelivery

DOCS PUBLICAS DOS EVENTS (cliente recebe):
{
  \"event\": \"cert.issued\",
  \"id\": \"evt_xxx\",
  \"occurred_at\": 1234567890,
  \"workspace_id\": \"ws_xxx\",
  \"data\": { \"credential_id\": \"cred_xxx\", \"recipient\": {...}, \"course_name\": \"...\" }
}

Verificacao HMAC (Node.js):
const sig = crypto.createHmac('sha256', secret).update(payload).digest('hex');
if (sig !== req.headers['x-univercert-signature']) throw new Error('invalid');" || echo "nada"

git push 2>&1 | tail -3

echo
echo "Aguardando CI build (~3min)..."
sleep 180
curl -s "https://api.github.com/repos/univerbeauty777/univercert/actions/runs?per_page=1" \
  | grep -E '"(head_sha|status|conclusion)"'

echo
echo "Apos verde:"
echo "  1. Migration 0017:"
echo "     wrangler d1 execute univercert-mvp --remote --file=drizzle/migrations/0017_webhooks_security.sql"
echo
echo "  2. (Opcional) Cron Trigger pra retry:"
echo "     Adicionar em wrangler.toml:"
echo "     [triggers]"
echo "     crons = [\"*/5 * * * *\"]   # a cada 5min"
echo "     + setar CRON_SECRET nas env vars"
echo
echo "  3. Testar:"
echo "     POST /api/v1/webhooks/endpoints {name:'meu-zapier', url:'https://hooks.zapier.com/...', events:['cert.issued']}"
echo "     GET  /api/v1/audit/export?format=csv"
echo "     POST /api/v1/ai/detect-fraud {selfieBase64, selfieMediaType, referenceBase64, referenceMediaType}"
echo
read
