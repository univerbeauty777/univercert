#!/bin/bash
# Fix Next 15 typecheck — headers() e searchParams agora são Promise
set -e
git pull --rebase --autostash
git add -A
git commit -m "fix(next15): await headers() and searchParams Promise"
git push
echo
echo "✓ Build #6 disparou em https://github.com/univerbeauty777/univercert/actions"
