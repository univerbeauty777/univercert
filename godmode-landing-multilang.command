#!/bin/bash
# UniverCert · Landing GODMODE 4 idiomas (PT/EN/ES/FR) + geo-redirect

set -e
cd "$(dirname "$0")"
rm -f .git/index.lock 2>/dev/null || true

git add -A
git diff --cached --stat | tail -15
echo

git commit -m "feat(landing): multi-idioma GODMODE PT/EN/ES/FR + geo-redirect + comparison table

* src/middleware.ts: detecta CF-IPCountry header e redirect / -> /{locale}
  - Fallback: cookie uc_locale > geo IP > Accept-Language > pt default
  - 50+ countries mapeados (BR/PT/AO/MZ -> pt, US/GB/CA/AU -> en, ES/MX/AR/CO -> es,
    FR/BE/CH/SN/CI -> fr)
* src/lib/i18n.ts: expandido com FR + 50+ chaves de landing
  - getLocale() agora consulta cf-ipcountry header tambem
  - detectLocaleFromCountry helper exportado
* src/lib/landing-data.ts:
  - FEATURES: 50 features em 8 categorias (editor/ai/delivery/integrations/
    security/business/branding/standards) com title+desc ML em 4 idiomas
  - COMPARISON: 28 linhas comparando UniverCert vs Credly/Accredible/
    Sertifier/Hotmart Certificados
  - getCategoryLabel + pickML helpers
* src/app/[locale]/page.tsx: Landing GODMODE
  - Sticky nav com LanguageSwitcher
  - Hero gradient + trust bar
  - Features section: 8 categorias × ~6 features cada = 50+ recursos
  - Comparison table com 28 linhas vs 4 competidores
  - Pricing 4 planos (Free / Starter R\$97 / Pro R\$297 / Enterprise)
  - CTA final gradient navy->cyan
  - Footer dark com 4 colunas (product/resources/company/legal)
  - SEO: generateMetadata com alternate languages (hreflang)
  - ISR revalidate 1h pra cache CDN agressivo

SEO ALTERNATES:
  /pt /en /es /fr + x-default -> /pt
  Google indexa cada locale separadamente
  Cloudflare cacheia HTML por locale na edge

NAO COBRIDO (proxima onda):
  - Testimonials section (precisa de cases reais)
  - FAQ section
  - ROI calculator interativo (ja existe S13.2, integrar)" || echo "nada"

git push 2>&1 | tail -3

echo
echo "Aguardando CI build (~3min)..."
sleep 180
curl -s "https://api.github.com/repos/univerbeauty777/univercert/actions/runs?per_page=1" \
  | grep -E '"(head_sha|status|conclusion)"'

echo
echo "Apos verde, testa:"
echo "  https://univercert.net              -> redirect 302 pra /pt /en /es /fr (geo)"
echo "  https://univercert.net/pt           -> landing portugues"
echo "  https://univercert.net/en           -> landing english"
echo "  https://univercert.net/es           -> landing español"
echo "  https://univercert.net/fr           -> landing français"
echo "  Language switcher (canto direito da nav) muda + seta cookie uc_locale"
echo
echo "Com VPN US, acessa univercert.net -> direto pra /en"
echo "Com VPN ES, acessa univercert.net -> direto pra /es"
echo
read
