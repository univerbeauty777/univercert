#!/bin/bash
# UniverCert · WAVE 1 — S26 (Recipient WOW) + S29 (Open Badges/VC) + S31 (Issuer pages)

set -e
cd "$(dirname "$0")"
rm -f .git/index.lock 2>/dev/null || true

git add -A
git diff --cached --stat | tail -25
echo

git commit -m "feat(s26+s29+s31): recipient WOW + open badges 3.0 + issuer pages

S26 — RECIPIENT WOW (loop viral):
* lib/share-urls.ts: helpers oficiais LinkedIn 'Add to Profile', WhatsApp,
  Twitter, Facebook, Email, Apple/Google Wallet
* components/CertShareBar.tsx: barra de share mobile-first com 9 canais
  + native share API + copy link + tracking automatico
* /api/v1/share/track: registra cada share event (LGPD: IP hashed SHA-256)
* /api/v1/credentials/[id]/wallet/apple: stub pkpass (501 ate signing)
* /api/v1/credentials/[id]/wallet/google: stub JWT pass (501 ate setup)
* verify page (/v/[id]): substitui share buttons antigos por CertShareBar

S29 — OPEN BADGES 3.0 + W3C VERIFIABLE CREDENTIALS:
* /api/v1/credentials/[id]/badge: JSON Open Badges 3.0 (1EdTech standard)
  Compativel com LinkedIn Learning, Credly, Accredible, Badgr
* /api/v1/credentials/[id]/vc: W3C VC 2.0 com did:web issuer + status list
* DID format: did:web:univercert.com.br:escola:slug
* Buttons no verify page p/ exportar ambos formatos

S31 — ISSUER PROFILE PAGES:
* /escola/[slug]: pagina publica SEO-friendly do workspace
  - Cover banner + logo + tagline + bio
  - Stats: certs emitidos, links sociais
  - Grid de certs recentes (12) clicaveis
  - Depoimentos (testimonials_json)
  - Brand color customizavel
  - Metadata + OG image dinamica
* Revalidate ISR 10min

MIGRATION 0012:
* share_events: id, credential_id, workspace_id, channel, ip_hash,
  user_agent, referer, occurred_at + 3 indexes
* workspace_brand: display_name, tagline, description, logo_url,
  cover_url, brand_color, social_*, show_*, testimonials_json
* issuer_keys: did, public_key_jwk, algorithm (signing future)

ULID: + asset, shareEvent prefixos.

Notas:
* Wallet endpoints retornam 501 ate config Apple Developer + Google Cloud
  service account. Setup_url incluido na resposta de erro.
* Brand page renderiza com defaults se workspace_brand nao existe ainda
  (UI dashboard pra editar virá no S32).
* Build local pulado (disk cheio sandbox) — CI valida." || echo "nada"
git push 2>&1 | tail -3

echo
echo "Aguardando CI build (~3min)..."
sleep 180
curl -s "https://api.github.com/repos/univerbeauty777/univercert/actions/runs?per_page=1" \
  | grep -E '"(head_sha|status|conclusion)"'
echo
echo "Apos verde, aplicar migration 0012 no D1 remoto:"
echo "  wrangler d1 execute univercert-prod --remote --file=drizzle/migrations/0012_share_events_and_branding.sql"
echo
echo "Daí testar:"
echo "  /v/<algum_cred_id>     -> share bar com 9 canais funcionando"
echo "  /api/v1/credentials/<id>/badge -> JSON Open Badges 3.0"
echo "  /api/v1/credentials/<id>/vc    -> W3C VC"
echo "  /escola/univerhair    -> issuer page publica"
echo
read
