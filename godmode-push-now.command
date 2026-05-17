#!/bin/bash
# UniverCert · Push do commit S78 (965f9c5) pro GitHub
# Token ja foi atualizado com scope `workflow` — push agora deve passar.

set -e
cd "$(dirname "$0")"
rm -f .git/index.lock 2>/dev/null || true

echo "============================================"
echo "  PUSH S78 -> GITHUB"
echo "============================================"
echo

echo "==> Commit atual local:"
git log --oneline -1
echo
echo "==> Commits a empurrar (HEAD vs origin/main):"
git log --oneline origin/main..HEAD 2>&1 | head -5
echo

echo "==> Push..."
git push 2>&1 | tail -10
PUSH_RC=$?

if [ $PUSH_RC -ne 0 ]; then
  echo
  echo "PUSH FALHOU. Erro acima."
  echo "Se o erro mencionar 'workflow scope' de novo, confirme em https://github.com/settings/tokens"
  echo "que voce salvou o token com a checkbox 'workflow' marcada."
  echo
  echo "[Pressione Enter pra fechar]"
  read
  exit 1
fi

echo
echo "============================================"
echo "  Push OK. Aguardando CI build (~3min)..."
echo "============================================"
sleep 180

echo
echo "==> Status do ultimo build:"
curl -s "https://api.github.com/repos/univerbeauty777/univercert/actions/runs?per_page=1" \
  | python3 -c "
import sys,json
d=json.load(sys.stdin)
r=d['workflow_runs'][0]
print(f\"#{r['run_number']}  sha={r['head_sha'][:7]}\")
print(f\"  status:     {r['status']}\")
print(f\"  conclusion: {r['conclusion']}\")
print(f\"  msg:        {r['head_commit']['message'].splitlines()[0]}\")
print(f\"  url:        {r['html_url']}\")
"

echo
echo "Se conclusion=success -> deployado!"
echo "  Testa em: https://univercert.net/forgot-password"
echo
echo "Se conclusion=failure -> me manda a URL acima que eu vejo o log."
echo
echo "Se status=in_progress -> espera mais 1-2 min e checa em:"
echo "  https://github.com/univerbeauty777/univercert/actions"
echo
echo "[Pressione Enter pra fechar]"
read
