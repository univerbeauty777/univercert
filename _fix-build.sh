#!/bin/bash
# Sprint 3 — Better Auth real (email/senha + Google) + sign pages
set -e

git pull --rebase --autostash
git add -A
git commit -m "feat(sprint3): Better Auth com D1 + sign-in/sign-up funcionais + accounts/verifications no schema"
git push
echo
echo "✓ Build vai rodar em ~3min."
echo
echo "Após verde:"
echo "  /sign-up → criar conta com email + senha"
echo "  /sign-in → login"
echo "  /dashboard → protegido (redireciona se não logado)"
echo
echo "Pra Google OAuth funcionar:"
echo "  1. Crie projeto em console.cloud.google.com → OAuth client → Web"
echo "  2. Authorized redirect URIs: https://univercert.pages.dev/api/auth/callback/google"
echo "  3. Adicione GOOGLE_OAUTH_CLIENT_ID + GOOGLE_OAUTH_CLIENT_SECRET nos GitHub Secrets"
