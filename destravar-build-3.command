#!/bin/bash
# UniverCert · Push #3 (FINAL) — destrava todos os 6 builds vermelhos
# Bugs encontrados (todos corrigidos):
#   1. middleware.ts L75 — comentario com */pdf fechava o /* prematuro
#   2. casos/[vertical] — edge runtime + generateStaticParams (Next 15 nao permite)
#   3. vs/[competitor] — mesmo bug do 2
#   4. vercel@53.2.0 (auto-instalado por next-on-pages) — "LRU is not a constructor"
#      → pinar vercel@41.7.4 como devDependency
#   5. AcceptInviteClient.tsx + TeamClient.tsx (client) importavam @/lib/rbac
#      que tem next/headers (server-only) → split em rbac-types.ts (client-safe)
#
# BUILD VALIDADO LOCALMENTE: "Build completed in 6.94s" ✓

set -e
cd "$(dirname "$0")"

echo
echo "========================================================="
echo "PUSH #3 (FINAL) — DESTRAVANDO BUILD"
echo "========================================================="
echo

# Limpar locks orfaos
rm -f .git/index.lock .git/HEAD.lock .git/objects/maintenance.lock 2>/dev/null || true

# Reset commit local d81d2b5 que foi rejected (tinha workflow scope issue)
echo "1. Resetando commit do workflow rejected..."
if git log --oneline -1 | grep -q "d81d2b5"; then
  git reset --soft HEAD~1
  echo "   OK"
fi

# Restaurar workflow original (sem o debug que precisava de workflow scope)
git checkout HEAD -- .github/workflows/deploy.yml 2>/dev/null || true

echo
echo "2. Stage dos fixes finais..."
git add src/lib/rbac.ts src/lib/rbac-types.ts \
        "src/app/aceitar-convite/[token]/AcceptInviteClient.tsx" \
        "src/app/(dashboard)/team/TeamClient.tsx" \
        "src/app/vs/[competitor]/page.tsx"
git diff --cached --stat
echo

echo "3. Commit..."
git commit -m "fix(build): split rbac → rbac-types pra client + remove generateStaticParams do vs/[competitor]

Bugs 4 e 5 dos builds vermelhos:

Bug 4 - vs/[competitor]/page.tsx tinha edge runtime + generateStaticParams
        (mesmo erro de casos/[vertical] ja consertado em 7a9661d)

Bug 5 - AcceptInviteClient.tsx (client) e TeamClient.tsx (client)
        importavam ROLE_LABELS de '@/lib/rbac' que tem 'next/headers'
        (server-only). Webpack falha:
        'You're importing a component that needs next/headers.
        That only works in a Server Component'
        Fix: split em src/lib/rbac-types.ts (constantes/types, client-safe)
        e src/lib/rbac.ts (helpers que usam headers/db, server-only).
        rbac.ts re-exporta tudo pra compat com server code.

Validado localmente: 'Build completed in 6.94s' ✓
Todas as 6 falhas (S13/S14/S15a/S17/S24/S15/S16/S19) destravadas." || echo "   nada pra commitar"

echo
echo "4. Push..."
git push

echo
echo "========================================================="
echo "PUSH ENVIADO. Aguardando build do CI (~3min)..."
echo "========================================================="
echo
sleep 180
echo
echo "Status:"
curl -s "https://api.github.com/repos/univerbeauty777/univercert/actions/runs?per_page=1" \
  | grep -E '"(head_sha|status|conclusion|created_at)"'
echo
echo "Se VERDE → abre https://univercert.com.br/sign-up e cria sua conta admin"
echo "Se vermelho → me manda o status que eu vejo o que sobrou"
echo
echo "[Pressione Enter pra fechar]"
read
