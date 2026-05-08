#!/bin/bash
# UniverCert · fix de deps em uma tacada
# Uso: bash _fix-deps.sh

set -e

echo "1/5 backup dos 4 arquivos modificados..."
cp package.json /tmp/uc-pkg.json
cp src/lib/auth.ts /tmp/uc-auth.ts
cp 'src/app/api/auth/[...all]/route.ts' /tmp/uc-authroute.ts
cp src/app/api/v1/route.ts /tmp/uc-v1route.ts

echo "2/5 sync com remoto..."
git fetch origin
git reset --hard origin/main

echo "3/5 restaurar meus arquivos..."
cp /tmp/uc-pkg.json package.json
cp /tmp/uc-auth.ts src/lib/auth.ts
cp /tmp/uc-authroute.ts 'src/app/api/auth/[...all]/route.ts'
cp /tmp/uc-v1route.ts src/app/api/v1/route.ts

echo "4/5 stage + commit..."
git add -A
git commit -m "fix(deps): drop better-auth scaffold (Sprint 1 reintegra) + minimal package.json"

echo "5/5 push..."
git push

echo
echo "✓ Pronto. Build #5 vai disparar agora em https://github.com/univerbeauty777/univercert/actions"
