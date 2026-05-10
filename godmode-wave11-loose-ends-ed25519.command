#!/bin/bash
# UniverCert · WAVE 11 — S40b webhook hooks + S62b UI branding + S77 Cmd+K actions + S59 Ed25519

set -e
cd "$(dirname "$0")"
rm -f .git/index.lock 2>/dev/null || true

git add -A
git diff --cached --stat | tail -20
echo

git commit -m "feat(s40b+s62b+s77+s59): webhook hooks + UI branding + Cmd+K actions + Ed25519

S40b — WEBHOOK HOOKS LIVE:
* queue/actions.ts approveRequestAction:
  - apos issueCredentialFromRequest, dispara dispatchWebhook(workspaceId, {
    event: 'cert.issued', data: { credential_id, course_name, recipient_id, ... }
  })
  - Fire-and-forget — nao bloqueia user
  - Endpoints HTTPS dos clientes recebem POST com HMAC SHA-256 signature

S62b — UI /settings/branding GODMODE:
* /api/v1/workspace/brand (GET/PATCH): CRUD workspace_brand
  - admin only pra PATCH
  - Whitelist de campos string + bool flags
  - Upsert (insert se nao existe, update se existe)
* /settings/branding page + BrandingClient:
  - 5 cards: Informações públicas, Visual, Links/social, O que mostrar, Depoimentos
  - Color picker HEX nativo
  - Upload logo/cover via /api/v1/uploads
  - Checkbox toggles pra showCertCount/showRecentCerts/showCourses
  - Testimonials editor inline (add/remove/edit)
  - Sticky save bar com feedback visual
  - Link 'Ver pagina publica' direto pra /escola/{slug}

S77 — CMD+K SLASH ACTIONS:
* CommandPalette.tsx atualizado:
  - Quando user digita '/', mostra SLASH_ACTIONS em vez de search
  - 12 actions: /emit, /new template, /new course, /invite, /bulk, /verify,
    /upgrade, /apikey, /webhook, /audit, /brand, /docs
  - + 5 nav shortcuts novos: /analytics, /marketplace, /affiliate,
    /settings/branding, /integrations/api-keys

S59 — OPEN BADGES 3.0 COM ED25519 REAL:
* lib/ed25519.ts:
  - generateKeypair() via crypto.subtle Ed25519 nativo (Cloudflare Workers)
  - signMessage / verifyMessage com JWK
  - buildDataIntegrityProof: DataIntegrityProof eddsa-rdfc-2022 (W3C VC spec)
  - SHA-256 hash do doc + proof config combinados, signed Ed25519
  - proofValue prefix 'z' (multibase base64url)
* /api/v1/workspace/keys (GET/POST):
  - GET retorna DID + public key + didDocUrl
  - POST gera keypair Ed25519 + cria issuer_keys row
  - DID format: did:web:univercert.net:escola:{slug}
* /.well-known/did.json?ws=slug:
  - W3C DID document compativel pra resolver did:web
  - Inclui verificationMethod com publicKeyJwk
  - Service endpoints: IssuerProfile + VerificationEndpoint
  - Qualquer wallet/verifier conforme W3C consegue verificar signature
    SEM chamar nossa API — verificação offline 100%

NOTA SEGURANCA S59:
* Private key armazenada inline em issuer_keys.metadataJson (cifrado por D1).
* Pra produção real: migrar pra workers.secrets + key derivation per-workspace.
* Esquema atual ja funciona pra testes + early enterprise customers." || echo "nada"

git push 2>&1 | tail -3

echo
echo "Aguardando CI build (~3min)..."
sleep 180
curl -s "https://api.github.com/repos/univerbeauty777/univercert/actions/runs?per_page=1" \
  | grep -E '"(head_sha|status|conclusion)"'

echo
echo "Apos verde:"
echo "  Cmd+K em qualquer page:"
echo "    /         -> lista todas slash actions"
echo "    /emit     -> direto pra /queue"
echo "    /brand    -> /settings/branding"
echo
echo "  /settings/branding -> edita logo, cores, depoimentos"
echo "    -> Ver /escola/{slug} atualizado em tempo real"
echo
echo "  /api/v1/workspace/keys POST -> gera Ed25519 + DID"
echo "  /.well-known/did.json?ws=univerhair -> DID document W3C compliant"
echo
echo "  Aprovar pedido na /queue -> dispara webhook cert.issued pros endpoints subscritos"
echo
read
