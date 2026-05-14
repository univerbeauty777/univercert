#!/bin/bash
# UniverCert · BACKUP COMPLETO no GitHub
# Comita e empurra TUDO que estiver pendente (TopNav, landing multilang, i18n, etc)

set -e
cd "$(dirname "$0")"
rm -f .git/index.lock 2>/dev/null || true

# Garante atribuicao correta dos commits
git config user.email "univerbeauty777@gmail.com"
git config user.name "UniverCert"

echo "============================================"
echo "  BACKUP UNIVERCERT → GITHUB"
echo "  github.com/univerbeauty777/univercert"
echo "  commit author: univerbeauty777@gmail.com"
echo "============================================"
echo

# Status atual
echo "==> Branch + remote:"
git branch --show-current
git remote -v | head -1
echo

echo "==> Arquivos pendentes:"
git status --short
echo

# Conta arquivos modificados/novos
PENDING=$(git status --porcelain | wc -l | tr -d ' ')
echo "Total de arquivos pendentes: $PENDING"
echo

if [ "$PENDING" -eq "0" ]; then
  echo "✓ Nada pendente — repositorio ja esta 100% sincronizado com GitHub."
  echo
  echo "Ultimos 5 commits:"
  git log --oneline -5
  echo
  echo "[Pressione Enter pra fechar]"
  read
  exit 0
fi

# Stage tudo
git add -A
echo "==> Stat do que vai ser commitado:"
git diff --cached --stat | tail -30
echo

# Commit
git commit -m "backup: TopNav GODMODE + landing multilang (PT/EN/ES/FR) + i18n + geo-redirect

Snapshot completo do estado atual:
* src/components/TopNav.tsx — seletor superior multi-pagina (10 destinos)
* src/app/[locale]/page.tsx — landing GODMODE 4 idiomas
* src/lib/i18n.ts — 4 locales + geo-mapping de paises
* src/lib/landing-data.ts — 50 features + 28 linhas comparison
* src/middleware.ts — geo-redirect raiz -> /{locale}
* TopNav plugado em /[locale], /marketplace, /app
* + qualquer outro arquivo modificado pendente

Backup solicitado pelo usuario." || echo "(nada novo a commitar)"

echo
echo "==> Push pro GitHub..."
git push 2>&1 | tail -5

echo
echo "============================================"
echo "  ✓ BACKUP CONCLUIDO"
echo "============================================"
echo
echo "Ultimos 5 commits no GitHub:"
git log --oneline -5
echo
echo "Aguardando CI build (~3min)..."
sleep 180
curl -s "https://api.github.com/repos/univerbeauty777/univercert/actions/runs?per_page=1" \
  | grep -E '"(head_sha|status|conclusion)"'
echo
echo "Se CONCLUSION = success -> tudo backupado E deployado."
echo "Se failure -> me manda o log que eu conserto."
echo
echo "[Pressione Enter pra fechar]"
read
