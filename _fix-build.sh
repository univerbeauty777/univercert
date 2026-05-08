#!/bin/bash
# Fix typecheck — remove @ts-expect-error não utilizado
set -e
git pull --rebase --autostash
git add -A
git commit -m "fix(types): clean workspace.ts helper (drop unused @ts-expect-error)"
git push
echo
echo "✓ Build #7 disparou em https://github.com/univerbeauty777/univercert/actions"
