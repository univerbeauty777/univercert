#!/bin/bash
# UniverCert · S78c hotfix — args do renderCertificateHtml
# Erro: "Cannot read 'replace' of undefined" — faltavam credentialId + hashSha256
# e nomes errados (primary/accent em vez de primaryColor/accentColor)

set -e
cd "$(dirname "$0")"
rm -f .git/index.lock 2>/dev/null || true

git fetch origin main 2>&1 | tail -3
LOCAL=$(git rev-parse HEAD); REMOTE=$(git rev-parse origin/main)
if [ "$LOCAL" != "$REMOTE" ]; then
  git stash -u 2>/dev/null || true
  git reset --hard origin/main
  git stash pop 2>/dev/null || true
fi

# Idempotente: se já tem credentialId, skip
if grep -q "credentialId: row.c.id" src/lib/credentials.ts; then
  echo "==> ja patcheado (skip)"
else
  echo "==> Patcheando args do renderCertificateHtml..."
  python3 <<'PY'
p='src/lib/credentials.ts'
with open(p) as f: c=f.read()
old="""    const html = renderCertificateHtml({
      recipientName: row.r?.name || 'Aluno',
      cpf: row.r?.cpf || null,
      courseName: row.c.courseName,
      courseHours: row.c.courseHours ?? null,
      issuedAt: row.c.issuedAt,
      verifyUrl: `https://univercert.net/v/${row.c.id}`,
      workspaceName: row.w?.name || 'UniverCert',
      primary: row.b?.primaryColor || '#1B2D5E',
      accent: row.b?.secondaryColor || '#D4A937',
      variant: 'classic',
    } as any);"""
new="""    const html = renderCertificateHtml({
      recipientName: row.r?.name || 'Aluno',
      cpf: row.r?.cpf || null,
      courseName: row.c.courseName,
      courseHours: row.c.courseHours ?? null,
      issuedAt: row.c.issuedAt,
      credentialId: row.c.id,
      hashSha256: row.c.hashSha256,
      verifyUrl: `https://univercert.net/v/${row.c.id}`,
      workspaceName: row.w?.name || 'UniverCert',
      primaryColor: row.b?.primaryColor || '#1B2D5E',
      accentColor: row.b?.secondaryColor || '#D4A937',
      variant: 'classic',
    });"""
c=c.replace(old, new)
with open(p,'w') as f: f.write(c)
print('ok')
PY
fi

git add -A
git diff --cached --stat | tail -5
git commit -m "fix(s78c): args do renderCertificateHtml em renderAndPersist

Erro 'Cannot read properties of undefined (reading replace)' vinha de
escapeHtml(args.credentialId) recebendo undefined. Faltavam dois campos
obrigatorios do type Args + nomes errados de cores.

- credentialId: row.c.id (obrigatorio, faltava)
- hashSha256: row.c.hashSha256 (opcional mas usado em todos templates)
- primary -> primaryColor (nome correto do Args)
- accent  -> accentColor  (nome correto do Args)
- removido 'as any' (TS estava escondendo o bug)" || echo "(nada novo)"

git push 2>&1 | tail -3
echo
echo "Aguardando CI (~3min)..."
sleep 180
curl -s "https://api.github.com/repos/univerbeauty777/univercert/actions/runs?per_page=1" \
  | python3 -c "import sys,json; r=json.load(sys.stdin)['workflow_runs'][0]; print(f\"#{r['run_number']} {r['conclusion']} {r['html_url']}\")"
echo
echo "Apos verde, me avisa que eu re-chamo o regenerate-missing via browser."
echo
read
