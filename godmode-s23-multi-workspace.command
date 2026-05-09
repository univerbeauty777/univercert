#!/bin/bash
# UniverCert · S23 — Multi-workspace
# Cookie + rbac refactor + WorkspaceSwitcher + 17 arquivos refatorados (sem hardcoded slug)

set -e
cd "$(dirname "$0")"
rm -f .git/index.lock 2>/dev/null || true

git add -A
git diff --cached --stat | tail -25
git commit -m "feat(s23): multi-workspace com WorkspaceSwitcher + cookie + 17 arquivos refatorados

* lib/current-workspace.ts: cookie 'uc_current_ws' (get/set/clear)
* lib/rbac.ts: getCurrentSession lista TODOS memberships + escolhe ativo
  via cookie ou primeiro fallback. Nova listMyWorkspaces() pra UI.
* app/(dashboard)/workspaces/actions.ts: switchWorkspaceAction (valida +
  seta cookie + revalidate layout) + createWorkspaceAction (ws + member
  admin + cookie auto) + listWorkspacesAction.
* components/WorkspaceSwitcher.tsx: dropdown estilo Linear com avatar
  iniciais + role badge + lista clicavel + 'Criar novo workspace' inline form.
* components/Sidebar.tsx: substitui badge fixo por <WorkspaceSwitcher/>.
  Recebe currentWorkspace + workspaces[] como props.
* app/(dashboard)/layout.tsx: popula via getCurrentSession + listMyWorkspaces.

REFACTOR DE 17 ARQUIVOS REMOVENDO HARDCODE 'univerhair'/'ws_univerhair':
* 12 pages (server components): getCurrentSession + early return 'Faça login'
  + sess.workspace.id direto. Inclui dashboard, queue, recipients, audit,
  billing, credentials, templates, workflows, team, domain, integrations,
  integrations/fluent.
* 5 actions: requireRole(role) + RbacError handling. Roles: editor pra
  saves/upserts, admin pra delete/secrets. Inclui templates, templates/new,
  workflows, bulk, integrations.

PRESERVADOS (intencional):
* rbac.ts:56 fallback legacy single-tenant
* api/v1/[[...route]]/route.ts:383 query param publico

Build local 10.41s." || echo "nada"
git push 2>&1 | tail -3

echo
echo "Aguardando build CI (~3min)..."
sleep 180
curl -s "https://api.github.com/repos/univerbeauty777/univercert/actions/runs?per_page=1" \
  | grep -E '"(head_sha|status|conclusion)"'
echo
echo "Apos verde, abre /dashboard — sidebar mostra dropdown de workspaces."
echo "Crie um segundo workspace 'liso-blindado' clicando '+ Criar novo workspace'."
echo
read
