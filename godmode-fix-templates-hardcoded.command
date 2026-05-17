#!/bin/bash
# UniverCert · Hotfix templates/page.tsx — hardcoded 'univerhair' -> sessao atual

set -e
cd "$(dirname "$0")"
rm -f .git/index.lock 2>/dev/null || true

echo "==> Fetch + reset..."
git fetch origin main 2>&1 | tail -3
LOCAL=$(git rev-parse HEAD); REMOTE=$(git rev-parse origin/main)
if [ "$LOCAL" != "$REMOTE" ]; then
  git stash -u 2>/dev/null || true
  git reset --hard origin/main
  git stash pop 2>/dev/null || true
fi

if grep -q "workspaceSlug = 'univerhair'" src/app/\(dashboard\)/templates/page.tsx; then
  echo "==> Patcheando templates/page.tsx (hardcoded -> sessao)"
  python3 <<'PY'
import re
p='src/app/(dashboard)/templates/page.tsx'
with open(p) as f: c=f.read()
c = c.replace(
  "import { eq } from 'drizzle-orm';\nimport { getDb } from '@/db/client';",
  "import { eq } from 'drizzle-orm';\nimport { redirect } from 'next/navigation';\nimport { getDb } from '@/db/client';"
)
c = c.replace(
  "import PageHeader from '@/components/PageHeader';",
  "import PageHeader from '@/components/PageHeader';\nimport { getCurrentSession } from '@/lib/rbac';"
)
c = c.replace(
  "export default async function TemplatesPage() {\n  const db = getDb();\n  const workspaceSlug = 'univerhair';\n\n  const [ws] = await db\n    .select({ workspace: workspaces, brand: brandKits })\n    .from(workspaces)\n    .leftJoin(brandKits, eq(brandKits.workspaceId, workspaces.id))\n    .where(eq(workspaces.slug, workspaceSlug))\n    .limit(1);",
  "export default async function TemplatesPage() {\n  const sess = await getCurrentSession();\n  if (!sess) redirect('/sign-in');\n  const db = getDb();\n  const [ws] = await db\n    .select({ workspace: workspaces, brand: brandKits })\n    .from(workspaces)\n    .leftJoin(brandKits, eq(brandKits.workspaceId, workspaces.id))\n    .where(eq(workspaces.id, sess.workspace.id))\n    .limit(1);"
)
with open(p,'w') as f: f.write(c)
print('ok')
PY
else
  echo "==> ja patcheado (skip)"
fi

git add -A
git diff --cached --stat | tail -5
git commit -m "fix(templates): hardcoded 'univerhair' -> workspace ativo da sessao

A galeria de templates carregava sempre o workspace univerhair em vez
do workspace atual do usuario. Affecta:
- Preview de cores (mostrava nome 'UniverHair')
- Custom templates listados (eram do UniverHair, nao do user)
- saveBrandKitAction salvava no workspace errado" || echo "(nada novo)"

git push 2>&1 | tail -3
echo
echo "Aguardando CI build (~3min)..."
sleep 180
curl -s "https://api.github.com/repos/univerbeauty777/univercert/actions/runs?per_page=1" \
  | python3 -c "import sys,json; r=json.load(sys.stdin)['workflow_runs'][0]; print(f\"#{r['run_number']} {r['conclusion']} {r['html_url']}\")"
echo
read
