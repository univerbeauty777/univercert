#!/bin/bash
# UniverCert · Push GODMODE UI redesign
# - globals.css novo (Inter, paleta sutil, sidebar tokens, animations)
# - Sidebar fixa colapsavel
# - layout.tsx com Sidebar + main wrapper
# - Dashboard refeito (stats minimalistas + setup checklist real + activity)
# - PageHeader v2 sem icone gradient pesado
# - StatsBar v2 com stat-card minimalista
# - TemplatesGalleryClient com skeleton + active state nas paletas
#
# Build local validado: 9.28s

set -e
cd "$(dirname "$0")"

rm -f .git/index.lock .git/HEAD.lock 2>/dev/null || true

echo "Stage..."
git add src/app/globals.css \
        src/components/Sidebar.tsx \
        src/components/PageHeader.tsx \
        src/components/StatsBar.tsx \
        "src/app/(dashboard)/layout.tsx" \
        "src/app/(dashboard)/dashboard/page.tsx" \
        "src/app/(dashboard)/templates/page.tsx" \
        "src/app/(dashboard)/templates/TemplatesGalleryClient.tsx"
git diff --cached --stat
echo

echo "Commit + push..."
git commit -m "feat(ui): GODMODE 2.0 — sidebar fixa + redesign dashboard + galeria templates polida

Inspirado em Certifier / Linear / Stripe.

* Sidebar fixa colapsavel (240px / 68px) com 3 secoes:
  Operacao (Visao, Fila, Certs, Alunos, Bulk)
  Personalizacao (Templates, Workflows, Dominio)
  Workspace (Equipe, Integracoes, Billing, Reseller, Audit)
  + persistencia em localStorage + mobile drawer + active state via pathname
* globals.css refeito:
  - Tokens semanticos (surface/fg/border/brand) com light + dark
  - Inter UI / numero monospace pra stats
  - Buttons (primary/secondary/ghost/icon) sem gradients pesados
  - .card / .stat-card minimalistas
  - .sidebar / .sidebar-link / .with-sidebar
  - .page wrapper consistente (max-1280, padding 24)
  - Animations sutis (fade-in, slide-up, spring, shimmer skeleton)
  - Paleta navy + gold mantida mas sutil
* Dashboard refeito:
  - Page header limpo, 4 stat-cards (label uppercase + valor 28px monospace)
  - Setup checklist computado de dados reais (brandKit, templates, members,
    domain, emitted) com progress bar visivel
  - Atividade recente com empty state ilustrado
* PageHeader v2: sem icone gradient pesado (so emoji opaco opcional)
* StatsBar v2: usa stat-card class
* TemplatesGalleryClient:
  - Editor de cores com paletas active state
  - PreviewFrame com skeleton enquanto iframe carrega
  - 6 variantes premium voltam a aparecer (bug visual antigo era glass
    card branco-em-branco escondendo o conteudo)
  - Section heads claros + badges sutis (gold pra Custom, brand pra Ativo)

Build local 9.28s." || echo "nada"
git push 2>&1 | tail -3

echo
echo "Aguardando build (~3min)..."
sleep 180
echo
echo "Status:"
curl -s "https://api.github.com/repos/univerbeauty777/univercert/actions/runs?per_page=1" \
  | grep -E '"(head_sha|status|conclusion)"'
echo
echo "Quando verde abre:"
echo "  https://univercert.pages.dev/dashboard"
echo "  https://univercert.pages.dev/templates"
echo
echo "[Pressione Enter pra fechar]"
read
