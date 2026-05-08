#!/bin/bash
# Sprint 4 — landing comercial + páginas dashboard completas
set -e

git pull --rebase --autostash
git add -A
git commit -m "feat(sprint4): landing comercial + páginas Templates/Credentials/Recipients/Audit + signout"
git push
echo
echo "✓ Build vai rodar em ~3min."
echo
echo "Após verde, painel completo:"
echo "  / → landing comercial com Hero + features + pricing"
echo "  /dashboard → analytics"
echo "  /queue → fila de aprovação"
echo "  /credentials → todos certificados emitidos"
echo "  /recipients → todos alunos"
echo "  /bulk → emitir lote via CSV"
echo "  /templates → gestão de templates"
echo "  /integrations → webhooks Hotmart/Memberkit/Fluent etc"
echo "  /audit → audit log"
