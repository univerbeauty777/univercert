#!/bin/bash
# Sprint 15a + 17 + 24 — Dark mode + Workflows custom + Verifier público
set -e
git pull --rebase --autostash
git add -A
git commit -m "feat(s15a+s17+s24): dark mode toggle (CSS vars + system preference) + workflows custom (email/WhatsApp templates com {{vars}} + A/B subject + delay agendado + preview live + sample data) + /verificar público SEO (busca por ID/hash/URL + redirect canônico) · migration 0006_workflows + tabela workflows + entry no nav · footer com link verificador"
git push
echo
echo "✓ Build vai rodar em ~3min."
echo
echo "============================================================="
echo "ANTES DE TESTAR — APLICAR MIGRATION 0006:"
echo "============================================================="
echo "  npx wrangler d1 execute univercert-mvp --remote --file=./drizzle/migrations/0006_workflows.sql"
echo
echo "(Cria tabela workflows pra os templates customizados)"
echo
echo "============================================================="
echo "Sprints entregues:"
echo "============================================================="
echo
echo "  🌗 S15a · Dark mode toggle"
echo "      · Tailwind darkMode: 'class' + CSS variables semânticas"
echo "      · Componente DarkModeToggle (light/dark/system, persiste localStorage)"
echo "      · Anti-flash script inline antes do paint"
echo "      · Aplicado em navs principais (landing, demo, verify, dashboard)"
echo
echo "  📨 S17 · Workflows custom (email/WhatsApp)"
echo "      · /workflows list page com stats e cards"
echo "      · /workflows/new editor live com:"
echo "          → Variáveis dinâmicas {{recipientName}}, {{courseName}}, etc"
echo "          → 4 trigger events (issued, revoked, request, NPS D+7)"
echo "          → A/B test de subject (50/50)"
echo "          → Delay agendado em minutos"
echo "          → Status ativo/pausado"
echo "          → Preview email mockup (gmail-like) ou WhatsApp mockup (verde, balão)"
echo "          → Insertion buttons pra cada variável"
echo "      · 8 templates default (email + whatsapp × 4 events) com copy BR"
echo "      · Validação de variáveis (rejeita {{xpto}} desconhecidas)"
echo "      · Audit log em criação/edição/delete"
echo "      · 1 nova tabela: workflows"
echo
echo "  🔐 S24 · Verificador público /verificar"
echo "      · SEO-ready com canonical, OG, JSON-LD"
echo "      · Aceita ID (cred_*), hash SHA-256, ou URL completa"
echo "      · Redirect 302 pra /v/<id> quando achar"
echo "      · Empty state educativo se não encontrar"
echo "      · Sanitização anti-XSS no input"
echo "      · 4 trust callouts (hash, audit log, Cloudflare, LGPD)"
echo "      · CTA escola converter visitor em prospect"
echo "      · Footer + nav atualizados"
echo "      · Sitemap atualizado"
echo
echo "============================================================="
echo "Pra validar após verde:"
echo "============================================================="
echo "  /verificar              → busca pública (testa ID válido + ID inválido)"
echo "  /workflows              → lista vazia + 4 trigger cards"
echo "  /workflows/new          → editor com defaults preenchidos"
echo "  Toggle dark             → click no sol/lua no header (qualquer página)"
echo
echo "============================================================="
echo "Próximos sprints (ordem)"
echo "============================================================="
echo "  S15  — Multi-tenant + RBAC + invites por email"
echo "  S16  — Mobile-first + PWA"
echo "  S19  — Custom domain wizard"
echo
echo "✅ Ciclo de vendas + retenção: 99% → 100%."
