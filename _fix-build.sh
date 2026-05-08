#!/bin/bash
# Sprint 8 — Typeform-style form + queue avançada + verify premium + NPS cron + Reseller program
set -e
git pull --rebase --autostash
git add -A
git commit -m "feat(sprint8): redesign Typeform-style + queue avançada com bulk/filtros + verify premium + NPS automation + Reseller program + sign-in premium"
git push
echo
echo "✓ Build vai rodar em ~3min."
echo
echo "Após verde, novidades:"
echo "  /uh/solicitar       → Form Typeform-style fullscreen multi-step com animations + Enter keyboard"
echo "  /queue              → Fila com tabs (pendente/emitido/rejeitado), busca, filtro por origem, bulk approve"
echo "  /v/{id}             → Verify page premium com gradients, brand colors do tenant"
echo "  /sign-in            → Login premium com Google OAuth · animations · backdrop blur"
echo "  /reseller           → Programa de parceiros UniverCert Partners"
echo "  /api/cron/nps       → Cron handler NPS D+7 (configurar Cloudflare cron pra rodar 1x/dia)"
echo "  Open Badge button   → Verify page tem botão pra Open Badge JSON-LD"
