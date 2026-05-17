#!/bin/bash
# UniverCert · Hotfix rbac.ts — schema drift (createdAt -> invitedAt)
#
# Bug encontrado:
# rbac.ts:43 e :98 ordenavam por workspaceMembers.createdAt mas a tabela
# workspace_members so tem invitedAt + acceptedAt (sem createdAt).
# Query joga erro no D1, getCurrentSession() retorna null,
# /dashboard redireciona pra /sign-in mesmo com sessão válida.
#
# Side-effects: tambem criei o workspace ws_univercert + membership admin
# diretamente no D1 (ja aplicado, nao precisa migration).

set -e
cd "$(dirname "$0")"
rm -f .git/index.lock 2>/dev/null || true

echo "============================================"
echo "  HOTFIX rbac.ts (schema drift)"
echo "============================================"
echo

echo "==> Fetch + reset pro origin (pega tudo que Diego/Kennedy pusharam)"
git fetch origin main 2>&1 | tail -3
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/main)
if [ "$LOCAL" != "$REMOTE" ]; then
  git stash -u 2>/dev/null || true
  git reset --hard origin/main
  git stash pop 2>/dev/null || true
fi
echo

# -------------------------------------------------------------------------
# Aplica o fix com sed (idempotente)
# -------------------------------------------------------------------------
if grep -q "workspaceMembers.createdAt" src/lib/rbac.ts; then
  echo "==> Patcheando rbac.ts: createdAt -> invitedAt..."
  # macOS sed precisa de '' depois de -i
  sed -i '' 's/workspaceMembers\.createdAt/workspaceMembers.invitedAt/g' src/lib/rbac.ts
  echo "  feito ($(grep -c "workspaceMembers.invitedAt" src/lib/rbac.ts) ocorrencias)"
else
  echo "==> rbac.ts ja patcheado (skip)"
fi
echo

echo "==> Status:"
git status --short
echo
git add -A
git diff --cached --stat | tail -10
echo

git commit -m "fix(rbac): schema drift — workspaceMembers.createdAt nao existe

A tabela workspace_members so tem invitedAt + acceptedAt (ver
schema.ts). orderBy(desc(createdAt)) jogava erro no D1, fazendo
getCurrentSession() retornar null. /dashboard redirecionava pra /sign-in
mesmo com sessao Better Auth valida.

2 ocorrencias em src/lib/rbac.ts (linhas 43 e 98)." || echo "(nada novo a commitar)"

echo
echo "==> Push..."
git push 2>&1 | tail -5
echo

echo "============================================"
echo "  Aguardando CI build (~3min)..."
echo "============================================"
sleep 180

curl -s "https://api.github.com/repos/univerbeauty777/univercert/actions/runs?per_page=1" \
  | python3 -c "
import sys,json
r = json.load(sys.stdin)['workflow_runs'][0]
print(f\"#{r['run_number']}  sha={r['head_sha'][:7]}  status={r['status']}  conclusion={r['conclusion']}\")
print(f\"url: {r['html_url']}\")
"

echo
echo "Se success -> testa o login em https://univercert.net/sign-in"
echo "  Senha provisoria (que setei via DB): TesteUC@2026"
echo "  Apos logar e cair no dashboard, troca a senha em /forgot-password"
echo
echo "[Pressione Enter pra fechar]"
read
