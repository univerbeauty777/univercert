#!/bin/bash
# UniverCert · S23 Multi-workspace push
# Cookie + rbac + WorkspaceSwitcher + 17 arquivos refatorados

set -e
cd "$(dirname "$0")"
rm -f .git/index.lock 2>/dev/null || true

echo "Stage + commit + push..."
git add -A
git diff --cached --stat | tail -25
echo

git commit -m "feat(s23): multi-workspace — cookie + WorkspaceSwitcher + 17 arquivos refatorados

* lib/current-workspace.ts cookie 'uc_current_ws'
* lib/rbac.ts: getCurrentSession lista todos memberships + cookie picks active
* listMyWorkspaces() pra UI
* app/(dashboard)/workspaces/actions.ts: switch + create + list actions
* WorkspaceSwitcher.tsx (~145 linhas): dropdown estilo Linear
* Sidebar.tsx: substitui badge fixo por <WorkspaceSwitcher/>
* layout.tsx: popula via getCurrentSession + listMyWorkspaces

REFACTOR 17 ARQUIVOS removendo hardcoded 'univerhair'/'ws_univerhair':
12 pages (dashboard, queue, recipients, audit, billing, credentials,
templates, workflows, team, domain, integrations, integrations/fluent)
com getCurrentSession + 'Faça login' early return.
5 actions (templates, templates/new, workflows, bulk, integrations) com
requireRole(role) + RbacError handling.

Build local 10.41s." || echo "nada"

git push 2>&1 | tail -3

echo
echo "Aguardando build CI (~3min)..."
sleep 180
curl -s "https://api.github.com/repos/univerbeauty777/univercert/actions/runs?per_page=1" \
  | grep -E '"(head_sha|status|conclusion)"'
echo
echo "Apos verde:"
echo "  /dashboard -> sidebar mostra dropdown de workspace"
echo "  Clica '+ Criar novo workspace' -> 'Liso Blindado' / liso-blindado"
echo "  Cookie troca, todas paginas isolam por workspace"
echo
echo "[Pressione Enter pra fechar]"
read
