#!/bin/bash
# Sprint 15 + 16 + 19 — RBAC/invites + Mobile/PWA + Custom domain wizard
set -e
git pull --rebase --autostash
git add -A
git commit -m "feat(s15+s16+s19): RBAC + invites por email (4 roles · /team page · /aceitar-convite/[token] · audit log) + PWA install prompt + service worker (cache verify pages offline) + manifest com shortcuts + custom domain wizard 4-steps (input → DNS → SSL verify auto-poll → active) + Cloudflare for SaaS findByName helper · migration 0007_invites · lib/rbac.ts com requireRole helpers"
git push
echo
echo "✓ Build vai rodar em ~3min."
echo
echo "============================================================="
echo "ANTES DE TESTAR — APLICAR MIGRATION 0007:"
echo "============================================================="
echo "  npx wrangler d1 execute univercert-mvp --remote --file=./drizzle/migrations/0007_invites.sql"
echo
echo "(Cria tabela invites pra convites por email)"
echo
echo "============================================================="
echo "Sprints entregues:"
echo "============================================================="
echo
echo "  👥 S15 · Multi-tenant + RBAC + invites"
echo "      · 4 roles: 👑 Admin · ✏ Editor · ✓ Aprovador · 👁 Viewer"
echo "      · /team page com lista de membros + role inline switcher + remover"
echo "      · Modal convite com email + role + gera link único"
echo "      · /aceitar-convite/[token] valida email + cria membership"
echo "      · Tokens com 24 bytes random + expiração 7d"
echo "      · Audit log em todas operações (invite/accept/role_change/remove)"
echo "      · Proteções: não rebaixa último admin · não remove a si mesmo"
echo "      · lib/rbac.ts com requireRole(), getCurrentSession(), hierarquia"
echo "      · 1 nova tabela: invites"
echo
echo "  📲 S16 · Mobile-first + PWA"
echo "      · manifest.json premium com 4 shortcuts (Dashboard, Fila, Verificar, Demo)"
echo "      · Tema dark navy + categorias (business, education, productivity)"
echo "      · public/sw.js com cache-first em /v/<id> (verify offline)"
echo "      · ServiceWorkerRegister no layout (skip em localhost)"
echo "      · PwaInstallPrompt component captura beforeinstallprompt"
echo "      · Install card aparece após 3s + dismiss persistente 14d"
echo
echo "  🌐 S19 · Custom domain wizard"
echo "      · 4 steps: input → DNS instructions → verifying → active"
echo "      · Stepper visual com progress bar"
echo "      · DNS card com tipo/nome/valor + botão copiar"
echo "      · Status auto-poll a cada 8s checando CF API"
echo "      · Validação SSL (Let's Encrypt) e CNAME verification"
echo "      · Modo ativo: 3 quick links (site, verifier, demo) no domínio próprio"
echo "      · Validação anti-conflito: 1 domain por workspace"
echo "      · RBAC: só admin pode adicionar/remover"
echo "      · Tutorial inline pra Registro.br"
echo
echo "============================================================="
echo "Pra validar:"
echo "============================================================="
echo "  /team               → convidar usuário, copiar link, mudar role"
echo "  /aceitar-convite/<token>  → fluxo aceitar (precisa estar logado)"
echo "  /domain             → wizard 4 steps"
echo "  Toggle dark         → testa em /team e /domain"
echo "  Mobile PWA          → abre em mobile, install prompt aparece"
echo
echo "============================================================="
echo "Sprints S15a + S17 + S24 + S15 + S16 + S19 = 6 sprints completos"
echo "============================================================="
echo "✅ Plataforma feature-complete pra Pro/Enterprise."
echo "Próximos: S18 (observability), S20 (integrações ponta-a-ponta), S22 (reseller)"
