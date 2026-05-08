#!/bin/bash
# Sprint 12 — Logo navy/gold + 6 templates + galeria + editor + segurança + fix /sign-up
set -e
git pull --rebase --autostash
git add -A
git commit -m "feat(sprint12): logo escudo navy+gold + 6 cert templates premium (classic/modern/gold/minimal/executive/creative) + /templates galeria com preview live + color picker + presets de paleta + fix /sign-up (image column) + security headers (CSP/HSTS) + CORS lockdown + rate-limit auth + SECURITY.md"
git push
echo
echo "✓ Build vai rodar em ~3min."
echo
echo "============================================================="
echo "ANTES DE TESTAR EM PROD — APLICAR MIGRATION 0005:"
echo "============================================================="
echo "  npx wrangler d1 execute univercert-mvp --remote --file=./drizzle/migrations/0005_better_auth_fix.sql"
echo
echo "(Adiciona coluna 'image' que Better Auth precisa pra /sign-up funcionar)"
echo
echo "============================================================="
echo "Sprint 12 GODMODE — entregas:"
echo "============================================================="
echo
echo "  🎨 Identidade visual nova"
echo "      · Logo escudo navy+gold (componente <Logo /> SVG)"
echo "      · Paleta atualizada: primary #1B2D5E + accent #D4A937"
echo "      · Favicon dinâmico + OG image refeitos"
echo "      · 'univerCERT' wordmark em todos navs (8 lugares)"
echo
echo "  📜 6 templates de certificado premium"
echo "      · Classic: editorial Cormorant Garamond (default)"
echo "      · Modern: tech minimalista com banda lateral"
echo "      · Gold: luxury art déco com Playfair Display + ornamentos"
echo "      · Minimal: swiss style com grid lines"
echo "      · Executive: corporate dark com gold stripes"
echo "      · Creative: gradient bold com confetti decorativo"
echo
echo "  🖼 Galeria /templates"
echo "      · 6 cards com preview iframe ao vivo (escala 36%)"
echo "      · Color picker primary/accent (hex + visual)"
echo "      · 8 presets de paleta (Navy+Gold, Black+Gold, etc)"
echo "      · Botão 'Salvar como ativo' que persiste no brand_kit"
echo "      · Cada cert futuro herda template + cores ativos"
echo
echo "  🔧 Fix /sign-up (Better Auth)"
echo "      · Migration 0005 adiciona coluna 'image' em users"
echo "      · auth.ts com cookie hardening + onError logging"
echo "      · Better Auth com fields mapping correto"
echo
echo "  🛡 Auditoria de segurança GODMODE"
echo "      · middleware.ts com CSP + HSTS + X-Frame-Options + Permissions-Policy"
echo "      · CORS lockdown apenas pra origens conhecidas"
echo "      · Rate limit em /api/auth/* (10/5min anti-bruteforce)"
echo "      · Stack trace só em dev local"
echo "      · SECURITY.md com checklist + plano de incident response"
echo
echo "============================================================="
echo "Pra testar após verde:"
echo "============================================================="
echo "  /api/v1/templates/classic/preview     (cert classic)"
echo "  /api/v1/templates/gold/preview        (cert gold luxury)"
echo "  /api/v1/templates/minimal/preview     (cert minimal swiss)"
echo "  /api/v1/templates/executive/preview   (cert executive dark)"
echo "  /api/v1/templates/creative/preview    (cert creative gradient)"
echo "  /api/v1/templates/modern/preview      (cert modern tech)"
echo
echo "  /templates                            (galeria interativa)"
echo "  /sign-up                              (deve funcionar agora)"
echo
echo "============================================================="
echo "AÇÕES MANUAIS URGENTES:"
echo "============================================================="
echo "  1) Rotacionar token Cloudflare API exposto durante setup inicial (criar novo + revogar antigo no dashboard)"
echo "  2) Tornar repo PRIVADO em GitHub Settings"
echo "  3) Revogar Google OAuth Client Secret antigo"
echo
echo "✅ Sprint 12 fecha as bases. Próximo: Sprint 13 — onboarding pós sign-up + ROI calculator + páginas comparativas /vs/*"
