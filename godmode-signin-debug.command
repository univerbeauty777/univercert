#!/bin/bash
# UniverCert · Hotfix sign-in error visibility + esqueci senha link

set -e
cd "$(dirname "$0")"
rm -f .git/index.lock 2>/dev/null || true

git add -A
git diff --cached --stat | tail -5
echo

git commit -m "fix(auth): expose sign-in error code/status + esqueci senha link

* /sign-in: error agora mostra '[code] (HTTP status)' + console.error
  full object — antes 'Email ou senha incorretos' generico mascarava
  bug de DB/cookie/CORS.
* Adicionado link 'Esqueci minha senha' apontando pra /forgot-password
* Diagnostico p/ caso 'senha certa mas falha'." || echo "nada"
git push 2>&1 | tail -3

echo
echo "Aguardando build CI (~3min)..."
sleep 180
curl -s "https://api.github.com/repos/univerbeauty777/univercert/actions/runs?per_page=1" \
  | grep -E '"(head_sha|status|conclusion)"'
echo
echo "Apos verde:"
echo "  Vai em /sign-in e tenta logar com a senha"
echo "  Anota EXATAMENTE o que aparece no banner vermelho"
echo "  (incluindo [codigo] e (HTTP xxx))"
echo "  Me passa esse texto pra eu corrigir o root cause"
echo
read
