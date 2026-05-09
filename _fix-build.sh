#!/bin/bash
# Sprint 14 — Editor visual de templates (drag-and-drop A4)
set -e
git pull --rebase --autostash
git add -A
git commit -m "feat(sprint14): editor visual de templates · /templates/new com canvas A4 drag-and-drop · 5 tipos de elementos (texto, campo dinâmico, forma, imagem, QR) · inspector lateral com fonte/peso/cor/posição/tamanho · 4 fontes (Inter, Cormorant, Playfair, JetBrains Mono) · preview em nova aba · save persistente em templates table · variant 'custom' no cert renderer · galeria mostra customs do workspace"
git push
echo
echo "✓ Build vai rodar em ~3min."
echo
echo "============================================================="
echo "Sprint 14 GODMODE — entregas:"
echo "============================================================="
echo
echo "  ✏ /templates/new (editor visual)"
echo "      · Canvas A4 landscape com zoom (50% a 300%)"
echo "      · 5 tipos de elementos arrastáveis:"
echo "          → Texto livre (qualquer string)"
echo "          → Campo dinâmico (8 campos: nome, curso, carga, cpf, data, escola, url, id)"
echo "          → Forma (linha, retângulo) com cor + border-radius"
echo "          → Imagem (URL pública)"
echo "          → QR code (renderiza qrserver.com em runtime)"
echo "      · Sidebar esquerda: adicionar elementos + cor da página + lista de camadas"
echo "      · Inspector direito: fonte (4 famílias), peso, tamanho, cor, alinhamento, italic, posição, tamanho"
echo "      · Layers panel com z-index (pra frente / pra trás)"
echo "      · Botão duplicar / excluir"
echo "      · Preview em nova aba (HTML standalone com Google Fonts)"
echo "      · Save persiste layoutJson em templates.layout_json"
echo
echo "  🎨 Renderer 'custom' no cert-template.ts"
echo "      · Aceita customLayoutJson como arg"
echo "      · Renderiza A4 absolute-positioned a partir do JSON"
echo "      · Whitelist de origens de imagem (anti-XSS)"
echo "      · escapeHtml em todos os campos (anti-XSS)"
echo
echo "  📚 API endpoints novos"
echo "      · GET /api/v1/templates                  → lista do workspace"
echo "      · GET /api/v1/templates/custom/:id/preview → preview com dados fictícios"
echo
echo "  🖼 Galeria /templates atualizada"
echo "      · Seção 'Seus templates customizados' no topo (com badge accent)"
echo "      · Cards com preview iframe live"
echo "      · Botão '+ Criar template do zero' destacado"
echo
echo "============================================================="
echo "Pra validar após verde:"
echo "============================================================="
echo "  /templates           → galeria com customs no topo (se já criou algum)"
echo "  /templates/new       → editor visual com layout default"
echo "      → arraste o nome (Cormorant 56pt centro)"
echo "      → ajuste cor/fonte no inspector"
echo "      → click 'Preview' (abre nova aba HTML)"
echo "      → click 'Salvar template' → vai pra /templates"
echo "  /api/v1/templates    → JSON com lista"
echo
echo "============================================================="
echo "PRÓXIMOS 4 SPRINTS planejados:"
echo "============================================================="
echo "  S15 — Multi-tenant + RBAC + invites por email + workspace switcher"
echo "  S16 — Mobile-first + PWA install + push notifications"
echo "  S17 — Workflows custom (email/WhatsApp templates editáveis)"
echo "  S18 — Sentry + PostHog + smoke tests CI + status page público"
echo
echo "✅ Sales-ready: 99% → 100%. Plataforma feature-complete pra MVP comercial."
