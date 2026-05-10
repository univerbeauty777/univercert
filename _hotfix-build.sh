#!/bin/bash
# UniverCert · Hotfix dos 2 bugs que estavam quebrando CI desde Sprint 13
# Roda esse script pra subir o fix e destravar todos os sprints

set -e

cd "$(dirname "$0")"

echo "============================================================="
echo "HOTFIX BUILD · destrava S13/S14/S15a/S17/S24/S15/S16/S19"
echo "============================================================="
echo
echo "Bugs encontrados:"
echo
echo "  1. middleware.ts L75 — comentario de bloco com '*/pdf'"
echo "     fechava o /* prematuramente, transformando o resto do"
echo "     arquivo em codigo quebrado. Resultado: parse error no"
echo "     SWC, build falha."
echo
echo "  2. casos/[vertical]/page.tsx — Next 15 nao permite edge"
echo "     runtime + generateStaticParams na mesma rota."
echo "     Removida generateStaticParams (lookup e em memoria,"
echo "     nao precisa SSG)."
echo
echo "Esses 2 bugs estavam barrando 4 builds consecutivos:"
echo "  - 1c1f82b (S13)"
echo "  - e1144a4 (S14)"
echo "  - 3854302 (S15a/S17/S24)"
echo "  - 3211dc5 (S15/S16/S19)"
echo
echo "============================================================="
echo

git pull --rebase --autostash
git push

echo
echo "OK push enviado. Build vai rodar em ~3min."
echo
echo "============================================================="
echo "DEPOIS DO BUILD VERDE — APLICAR MIGRATION 0007:"
echo "============================================================="
echo
echo "  npx wrangler d1 execute univercert-mvp --remote \\"
echo "    --file=./drizzle/migrations/0007_invites.sql"
echo
echo "(Cria tabela invites pro /team page funcionar)"
echo
echo "============================================================="
echo "DEPOIS — TESTA /sign-up:"
echo "============================================================="
echo "  https://univercert.net/sign-up"
echo "  → cria sua conta admin"
echo "  → vai cair no /onboarding (5 steps)"
echo "  → depois testa /workflows /team /domain /verificar"
echo "============================================================="
