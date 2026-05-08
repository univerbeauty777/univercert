#!/bin/bash
# Sprint 1 — aprovação real da fila + helpers de credentials
set -e
git pull --rebase --autostash
git add -A
git commit -m "feat(sprint1): aprovação/rejeição da fila com hash SHA-256 + server actions"
git push
echo
echo "✓ Push feito. Build vai rodar em ~3min e univercert.pages.dev terá fluxo completo:"
echo "  1. /uh/solicitar → cria request em D1"
echo "  2. /queue → admin aprova → credential criada com hash"
echo "  3. /v/{id} → verify page mostra dados reais"
