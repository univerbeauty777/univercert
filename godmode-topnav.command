#!/bin/bash
# UniverCert · TopNav GODMODE — seletor superior multi-página

set -e
cd "$(dirname "$0")"
rm -f .git/index.lock 2>/dev/null || true

git add -A
git diff --cached --stat | tail -10
echo

git commit -m "feat(nav): TopNav GODMODE com Page Selector multi-pagina

Componente reusavel <TopNav> com:
* Logo univerCERT + gradient badge (U)
* PAGE SELECTOR DROPDOWN no canto esquerdo — abre menu com 10 paginas:
  - Inicio (landing /[locale])
  - Marketplace (/marketplace)
  - Verificar (/verificar)
  - Demo (/demo)
  - App mobile (/app)
  - Escolas (/escola/{slug})
  - Programa Educator (/partner/apply)
  - Afiliados (/affiliate)
  - Entrar (/sign-in)
  - Gratis (/sign-up)
  Cada item com icone + label + subtitle. Active state com bullet verde.
* Links diretos centro: Features, Compare, Pricing, Marketplace, Verificar
* Right: LanguageSwitcher (4 idiomas) + Sign in + Sign up CTA
* Mobile responsive: hamburger menu < 900px
* Variants: light (default) + dark (pra landings dark como /app)
* Backdrop blur 20px (estilo Apple/Linear)
* Sticky top + z-index 100

i18n nos 4 idiomas (pt/en/es/fr) inline no componente
(self-contained, sem dep em lib/i18n.ts pra evitar circular import).

PLUGADO EM:
* /[locale] landing — substitui nav inline antigo
* /marketplace — substitui nav antigo
* /app — substitui nav inline dark

PROXIMAS PAGINAS A PLUGAR (Wave 12b):
* /verificar
* /v/[id]
* /escola/[slug]
* /demo
* /partner/apply" || echo "nada"

git push 2>&1 | tail -3

echo
echo "Aguardando CI build (~3min)..."
sleep 180
curl -s "https://api.github.com/repos/univerbeauty777/univercert/actions/runs?per_page=1" \
  | grep -E '"(head_sha|status|conclusion)"'

echo
echo "Apos verde, testa:"
echo "  https://univercert.net/pt        -> TopNav novo com 'Paginas' dropdown"
echo "  Clica 'Paginas' -> lista 10 destinos com icone + subtitle"
echo "  Active state visivel quando esta na pagina atual"
echo "  Language switcher continua funcionando"
echo "  Mobile (< 900px) mostra hamburger"
echo
read
