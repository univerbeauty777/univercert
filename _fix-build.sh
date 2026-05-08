#!/bin/bash
# Sprint 5 + 6 + 7 — MP billing + Custom domain + Open Badges 3.0
set -e
git pull --rebase --autostash
git add -A
git commit -m "feat(sprint5-7): Mercado Pago + Custom domain (CF for SaaS) + Open Badges 3.0 JSON-LD + nav completa"
git push
echo
echo "✓ Build vai rodar em ~3min."
echo
echo "Plataforma agora completa pra rodar HOJE:"
echo "  /              → landing comercial"
echo "  /sign-in       → email+senha + Google OAuth ✓"
echo "  /dashboard     → analytics"
echo "  /queue         → fila aprovação"
echo "  /credentials   → certificados emitidos"
echo "  /recipients    → alunos"
echo "  /bulk          → CSV emit em massa"
echo "  /templates     → templates"
echo "  /integrations  → webhooks Hotmart/Memberkit/Fluent/Kiwify/Eduzz"
echo "  /billing       → Mercado Pago checkout (Pix/Boleto/Cartão até 12x)"
echo "  /domain        → Custom domain wizard (Cloudflare for SaaS)"
echo "  /audit         → audit log"
echo "  /api/v1/credentials/:id/openbadge.json → Open Badges 3.0 JSON-LD"
echo
echo "Pra ativar tudo: configure secrets faltando:"
echo "  RESEND_API_KEY, MERCADOPAGO_ACCESS_TOKEN, MERCADOPAGO_WEBHOOK_SECRET,"
echo "  META_WHATSAPP_TOKEN, META_WHATSAPP_PHONE_ID, CLOUDFLARE_ZONE_ID"
