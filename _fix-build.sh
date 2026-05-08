#!/bin/bash
# Sprint 2 — webhooks reais (HMAC) + bulk CSV + admin integrations + dashboard analytics
set -e
[ -f src/app/api/v1/route.ts ] && rm -f src/app/api/v1/route.ts

git pull --rebase --autostash
git add -A
git commit -m "feat(sprint2): webhooks Fluent/Hotmart/Memberkit/Kiwify/Eduzz com HMAC + bulk CSV emit + admin integrações UI + dashboard analytics"
git push
echo
echo "✓ Build vai rodar em ~3min."
echo
echo "Após verde:"
echo "  /integrations → configurar URLs de webhook + gerar secrets"
echo "  /bulk → emitir lote de alunos antigos via CSV"
echo "  /api/webhooks/fluent?ws=univerhair → endpoint pronto pra Fluent"
echo "  /api/webhooks/hotmart?ws=univerhair → endpoint pronto pra Hotmart"
echo "  /dashboard → métricas atualizadas em real-time"
