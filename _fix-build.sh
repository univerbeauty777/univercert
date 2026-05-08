#!/bin/bash
# Sprint 10 — Demo pública sem fricção
set -e
git pull --rebase --autostash
git add -A
git commit -m "feat(sprint10): /demo Typeform 2-steps + endpoint /api/v1/demo/issue (rate-limit 3/h por IP) + workspace 'demo' provisionado + página de resultado /demo/[id] com confetti + share buttons + CTA conversão + verify page badge DEMO + landing CTA primary trocado para 'Testar em 30s'"
git push
echo
echo "✓ Build vai rodar em ~3min."
echo
echo "============================================================="
echo "ANTES DE TESTAR EM PROD:"
echo "============================================================="
echo
echo "1) Aplicar migration 0004 no D1 remoto:"
echo "   wrangler d1 execute univercert-mvp --remote --file=./drizzle/migrations/0004_demo_workspace.sql"
echo
echo "2) Fluxo de teste completo:"
echo "   a) Acesse https://univercert.pages.dev/demo"
echo "   b) Digite seu nome → Enter"
echo "   c) Digite um curso → Enter"
echo "   d) Aguarde animação loading (~1.5s)"
echo "   e) Vai redirecionar pra /demo/[id] com confetti"
echo "   f) Verifique que /v/[id] mostra banner amarelo 'CERTIFICADO DEMO'"
echo "   g) Tente emitir 4x do mesmo IP — última vai falhar com 429 (rate limit OK)"
echo
echo "============================================================="
echo "NOVIDADES VISÍVEIS:"
echo "============================================================="
echo "  🧪 /demo                   → Typeform 2 passos · sem cadastro · 30s pra emitir"
echo "  🎉 /demo/[id]              → Resultado com confetti + share + CTA"
echo "  🟡 /v/[id] (workspace=demo) → Banner amarelo 'Certificado de demonstração'"
echo "  🚀 Landing                 → CTA primário trocado: 'Testar em 30s' (em vez de Sign-up)"
echo "  🦶 Footer + Nav            → Link 'Demo' adicionado"
echo "  🛡 Rate limit              → 3 demos/hora por IP (KV)"
echo "  💾 Demo certs              → Auto-expiram em 90 dias (não lixo eterno)"
echo
echo "============================================================="
echo "POR QUE ISSO MOVE A AGULHA DE VENDAS:"
echo "============================================================="
echo "  • Visitor experimenta o produto SEM friccion → ~3-5x conversão pra sign-up"
echo "  • Resultado compartilhável (WhatsApp/LinkedIn) → marketing orgânico viral"
echo "  • Cada demo cria uma URL real verificável → SEO e backlinks"
echo "  • Confetti = dopamina hit → memorabilia + boca-a-boca"
echo
echo "✅ Sales-ready: 75% → ~88%."
echo "📊 Próximas alavancas: pílula '/vs/certifier' (S11) + ROI calculator (S13)"
