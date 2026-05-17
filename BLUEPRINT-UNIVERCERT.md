# UniverCert — Blueprint de Reconstrução

> **Documento stack-agnóstico** para replicar o UniverCert em qualquer linguagem/infra.
> Versão do blueprint: 1.0 · Gerado em 14/05/2026 · App v0.2.0
>
> Este documento descreve **o quê** o sistema faz e **por quê**, de forma independente
> da stack. Onde a implementação atual é citada (Cloudflare, Next.js, D1...), há sempre
> a abstração equivalente para você portar para outra stack.

---

## Índice

1. [Visão de produto](#1-visão-de-produto)
2. [Arquitetura em camadas](#2-arquitetura-em-camadas)
3. [Stack atual e tabela de equivalências](#3-stack-atual-e-tabela-de-equivalências)
4. [Modelo de dados (40 tabelas)](#4-modelo-de-dados)
5. [Mapa de rotas — páginas e APIs](#5-mapa-de-rotas)
6. [Camadas de lógica de negócio](#6-camadas-de-lógica-de-negócio)
7. [Integrações externas](#7-integrações-externas)
8. [Regras de negócio centrais](#8-regras-de-negócio-centrais)
9. [Sequência de sprints — entregue](#9-sequência-de-sprints--entregue)
10. [Roadmap futuro](#10-roadmap-futuro)
11. [Guia de replicação passo a passo](#11-guia-de-replicação-passo-a-passo)
12. [Variáveis de ambiente e secrets](#12-variáveis-de-ambiente-e-secrets)

---

## 1. Visão de produto

### 1.1 O que é

UniverCert é um **SaaS B2B de certificados digitais verificáveis**. Escolas, cursos,
infoprodutores e instituições emitem certificados que:

- são **verificáveis publicamente** por um link/QR code único (hash SHA-256);
- seguem **padrões abertos** — Open Badges 3.0 e W3C Verifiable Credentials assinados com Ed25519;
- entram na **carteira do aluno** (Apple Wallet / Google Wallet) e no LinkedIn;
- são emitidos **automaticamente** via webhooks de plataformas de curso (Hotmart, Kiwify, etc.).

### 1.2 Problema que resolve

Certificados em PDF solto não provam nada — qualquer um edita um PDF. Instituições precisam
de uma forma de emitir em escala, com a marca delas, e de um jeito que o aluno consiga
**provar** que o certificado é real (para empregador, conselho de classe, etc.). Hoje isso
ou é manual (designer + e-mail), ou preso a plataformas caras e fechadas.

### 1.3 Posicionamento competitivo

Concorrentes diretos e como o UniverCert se diferencia:

| Concorrente | Posicionamento deles | Diferencial UniverCert |
|---|---|---|
| **Credly** | Padrão corporativo de "badges", caro, foco US | Preço BR, PT-BR nativo, PDF + badge, sem lock-in |
| **Accredible** | Robusto, enterprise, caro | Editor visual self-service, marketplace de templates |
| **Sertifier** | Mid-market, bom editor | Padrões abertos (OB 3.0 / W3C VC) assinados, multi-idioma |
| **Hotmart Certificados** | Embutido no Hotmart, fechado | Funciona com qualquer plataforma via webhook + API + n8n |

**Tese central:** ser a plataforma de certificados **mais aberta** (padrões W3C, API,
self-hosted-friendly) e ao mesmo tempo a **mais fácil** (editor visual GODMODE, emissão
automática, white-label completo) — competindo em preço no mercado BR/LATAM e em
padrões/abertura no global.

### 1.4 Personas

- **Admin da escola** — configura marca, templates, integrações, time, billing.
- **Editor** — cria e edita templates de certificado no editor visual.
- **Aprovador** — revisa a fila de solicitações e aprova/rejeita emissões.
- **Aluno / recipient** — recebe, verifica, compartilha e guarda o certificado.
- **Afiliado / educator partner** — indica novas escolas e ganha comissão recorrente.
- **Verificador** — terceiro (empregador, conselho) que confere a autenticidade.

---

## 2. Arquitetura em camadas

O sistema é um **monólito modular serverless**. Toda a lógica roda em funções edge/serverless
stateless; o estado vive em banco relacional, blob storage e cache KV.

```
┌──────────────────────────────────────────────────────────────────┐
│  CLIENTE (browser / PWA / wallet / LinkedIn / sites embed)        │
└───────────────┬──────────────────────────────────────────────────┘
                │ HTTPS
┌───────────────▼──────────────────────────────────────────────────┐
│  EDGE / CDN  — geo-redirect, cache de verify pages, assets        │
├──────────────────────────────────────────────────────────────────┤
│  APP LAYER (serverless)                                          │
│   ├─ Páginas SSR/ISR  (landing, dashboard, verify, demo, escola)  │
│   ├─ API REST /api/v1 (Hono router — bearer + sessão)             │
│   ├─ Webhooks-in      (Hotmart, Kiwify, Fluent, Pagar.me...)      │
│   ├─ Server actions   (mutations do dashboard)                    │
│   └─ Cron jobs        (NPS, retry de webhooks-out)                │
├──────────────────────────────────────────────────────────────────┤
│  DOMAIN / LÓGICA  (src/lib — stateless, testável)                 │
│   auth · rbac · credentials · cert-template · render-pdf ·        │
│   webhook-dispatcher · email-dispatcher · plans/plan-limits ·     │
│   ed25519/openbadge · wallet (apple/google) · ai-client · ...     │
├──────────────────────────────────────────────────────────────────┤
│  PERSISTÊNCIA                                                     │
│   ├─ Banco relacional (SQLite/D1 → Postgres/MySQL)                │
│   ├─ Blob storage     (R2 → S3/GCS) — PDFs, PNGs, logos, fundos   │
│   ├─ Cache KV         (KV → Redis) — sessões curtas, rate limit   │
│   └─ Browser rendering (gera PDF a partir de HTML)                │
├──────────────────────────────────────────────────────────────────┤
│  SERVIÇOS EXTERNOS                                                │
│   Resend (email) · Stripe + Pagar.me (billing) · Claude API (IA)  │
│   Meta WhatsApp · Google/Apple Wallet · plataformas de curso      │
└──────────────────────────────────────────────────────────────────┘
```

### 2.1 Princípios de arquitetura

- **Stateless app layer** — nada de estado em memória entre requests; tudo no banco/KV.
- **Multi-tenant por linha** — toda tabela de domínio tem `workspace_id`; isolamento por query, não por schema.
- **Edge-first** — funções rodam perto do usuário; o banco SQLite (D1) é replicado na borda. Em outra stack, isso vira "região única + cache agressivo".
- **Padrões abertos como produto** — Open Badges 3.0 / W3C VC não são "exportação", são o core.
- **Idempotência em webhooks** — todo webhook-in é gravado cru antes de processar; reprocessável.
- **Build com erros de tipo tolerados** — `ignoreBuildErrors: true` no MVP (dívida técnica consciente; remover ao maturar).

---

## 3. Stack atual e tabela de equivalências

### 3.1 Stack atual (referência)

| Camada | Tecnologia atual | Papel |
|---|---|---|
| Framework | Next.js 15 (App Router) | SSR/ISR + API routes + server actions |
| Runtime | Cloudflare Pages + Workers (edge) | Execução serverless |
| Build adapter | `@cloudflare/next-on-pages` | Compila Next → Workers |
| Banco | Cloudflare D1 (SQLite) | Dados relacionais |
| ORM | Drizzle ORM | Schema + queries tipadas |
| Blob storage | Cloudflare R2 | PDFs, PNGs, logos, backgrounds |
| Cache/KV | Cloudflare KV | Sessões curtas, rate limit, cache verify |
| PDF rendering | Cloudflare Browser Rendering | HTML → PDF do certificado |
| Auth | Better Auth (email+senha, Google, Microsoft OAuth) | Sessão, contas, recuperação de senha |
| API router | Hono (`/api/v1/[[...route]]`) | Rotas REST com bearer auth |
| Email | Resend | Transacional (welcome, reset, notificações) |
| Billing | Stripe (global) + Pagar.me (BR) | Assinaturas, invoices, webhooks |
| IA | Claude API (Anthropic) | Gerar templates, validar fotos, OCR de docs, anti-fraude |
| Mensageria | Meta WhatsApp Cloud API | Notificação por WhatsApp |
| Wallet | Apple PassKit (.pkpass) + Google Wallet (JWT) | Carteira do aluno |
| Assinatura cripto | Ed25519 (`did:web`) | Open Badges 3.0 / W3C VC |
| Automação | Pacote n8n-nodes oficial | Workflows no-code |
| IDs | ULID | Chaves primárias ordenáveis |
| Validação | Zod | Schemas de input |

### 3.2 Tabela de equivalências para outras stacks

| Conceito | Cloudflare (atual) | AWS | GCP | Vercel + Supabase | Self-hosted |
|---|---|---|---|---|---|
| Compute serverless | Workers/Pages | Lambda + API Gateway | Cloud Run / Functions | Vercel Functions | Node/Bun + Docker |
| Banco relacional | D1 (SQLite) | RDS/Aurora Postgres | Cloud SQL | Supabase Postgres | Postgres |
| Blob storage | R2 | S3 | GCS | Supabase Storage | MinIO |
| Cache/KV | KV | DynamoDB / ElastiCache | Memorystore | Upstash Redis | Redis |
| HTML→PDF | Browser Rendering | Lambda + Chromium layer | Cloud Run + Puppeteer | Browserless.io | Puppeteer/Gotenberg |
| Cron | Cron Triggers | EventBridge | Cloud Scheduler | Vercel Cron | cron / Temporal |
| Fila (lote) | Queues | SQS | Pub/Sub | Upstash QStash | BullMQ |
| Edge cache | CDN nativo | CloudFront | Cloud CDN | Vercel Edge | Varnish/Nginx |

**Pontos de atenção ao portar:**

- **SQLite → Postgres:** `integer unixepoch()` vira `timestamptz`/`bigint`; `text` JSON vira
  `jsonb`; índices compostos iguais. Drizzle suporta os dois — trocar o dialect.
- **Edge → região única:** o app foi pensado stateless; rodar numa região só funciona,
  só perde latência. Compense com cache nas verify pages.
- **Browser Rendering:** é o único componente "pesado". Alternativa: serviço dedicado de
  PDF (Gotenberg/Browserless) chamado via HTTP, ou fila assíncrona.
- **Better Auth:** é agnóstico de banco (tem adapters Drizzle/Prisma/Kysely). Mantém.
- **Hono:** roda em qualquer runtime JS (Node, Bun, Deno, Lambda). Mantém.

---

## 4. Modelo de dados

40 tabelas, agrupadas por domínio. Todas as tabelas de domínio têm `workspace_id`
(multi-tenancy). PKs são ULIDs (`text`). Datas são `integer` (unix epoch) no SQLite —
em Postgres use `timestamptz`/`bigint`. Campos `*_json` são `text` no SQLite — em Postgres use `jsonb`.

### 4.1 Núcleo: tenancy e identidade

| Tabela | Papel | Campos-chave |
|---|---|---|
| `workspaces` | Tenant (a escola/conta) | `slug` único, `name`, `plan`, `status`, `custom_domain` |
| `users` | Usuário (compatível Better Auth) | `email` único, `name`, `image`, `password_hash`, `email_verified` |
| `workspace_members` | Vínculo user↔workspace + papel | `role` (admin/editor/aprovador/viewer), único (workspace,user) |
| `sessions` | Sessões Better Auth | `token` único, `expires_at`, `ip_address` |
| `accounts` | Contas Better Auth (OAuth + credential) | `provider_id`, `account_id`, `password`, tokens OAuth |
| `verifications` | Tokens Better Auth (confirmar email, reset senha) | `identifier`, `value`, `expires_at` |
| `invites` | Convite de usuário a workspace | `token` único, `role`, `expires_at`, `accepted_at` |

### 4.2 Marca e templates

| Tabela | Papel | Campos-chave |
|---|---|---|
| `brand_kits` | Identidade visual do workspace | cores, fonte, logo, favicon, email sender |
| `templates` | Template de certificado | `layout_json` (canvas), `vertical`, `is_published`, `thumbnail_url` |
| `workspace_brand` | Página pública de issuer (/escola/[slug]) | display name, bio, redes sociais, flags de exibição |
| `assets` | Biblioteca de uploads (R2) | `r2_key` único, `kind`, `content_type`, `size_bytes` |
| `template_marketplace` | Templates publicados pela comunidade | `layout_json`, `category`, `downloads`, `rating`, `status`, `is_premium` |

### 4.3 Emissão de certificados (core)

| Tabela | Papel | Campos-chave |
|---|---|---|
| `courses` | Curso formal por workspace | `slug` (único por ws), `hours`, `default_template_id`, `requirements_json`, `auto_approve` |
| `recipients` | Aluno/destinatário | `cpf`, `name`, `email`, `phone_whatsapp`, `lgpd_consent_at` |
| `certificate_requests` | Solicitação na fila | `source` (form/webhook/manual/csv), `status` (pending/approved/rejected/emitted/needs_revision), `extras_json`, `revisions_json`, `request_token` |
| `credentials` | Certificado emitido | `hash_sha256` (verificação), `pdf_r2_key`, `png_r2_key`, `issued_at`, `expires_at`, `revoked_at` |
| `verify_logs` | Log de cada verificação pública | `credential_id`, `ip_country`, `ip_city`, `user_agent` |
| `share_events` | Tracking de compartilhamento | `channel`, `ip_hash` |
| `issuer_keys` | Chave Ed25519 do workspace (assina VC) | `did`, `public_key_jwk`, `algorithm` |

### 4.4 Integrações e automação

| Tabela | Papel | Campos-chave |
|---|---|---|
| `integrations` | Config de integração ativa | `provider` (hotmart/memberkit/fluent/kiwify/eduzz/...), `config_json`, `webhook_secret` |
| `webhooks_in` | Webhook recebido (cru, idempotente) | `provider`, `raw_payload_json`, `status` (received/processed/error) |
| `webhooks_out` | Webhook de saída (legado/simples) | `event_type`, `target_url`, `status`, `attempts`, `next_retry_at` |
| `webhook_endpoints` | Endpoint configurado pelo cliente (S40) | `url`, `secret`, `events_json`, contadores de entrega |
| `webhook_deliveries` | Entrega individual + retry | `event_type`, `payload_json`, `attempt_count`, `max_attempts`, `next_retry_at` |
| `workflows` | Template de email/WhatsApp por evento | `channel`, `trigger_event`, `body_template`, `delay_seconds`, `ab_subject_b` |
| `email_events` | Log de email enviado (Resend) | `status` (queued/sent/failed/bounced/opened/clicked), `provider_message_id` |

### 4.5 Billing e limites

| Tabela | Papel | Campos-chave |
|---|---|---|
| `subscriptions` | Assinatura do workspace | `plan`, `status`, `provider` (stripe/pagarme), IDs do provider, período |
| `invoices` | Faturas | `provider_invoice_id`, `status`, `amount_brl_cents`, `invoice_pdf_url` |
| `billing_meter` | Medição de uso por período | certs/whatsapps/emails/storage emitidos |
| `usage_meters` | Uso corrente p/ enforcement de plano | PK (workspace, period_ym), `certs_emitted`, `ai_jobs_count`, `ai_cost` |

### 4.6 IA, segurança, observabilidade

| Tabela | Papel | Campos-chave |
|---|---|---|
| `ai_jobs` | Chamada à Claude API | `job_type`, `model`, tokens in/out, `cost_brl_cents`, `result_json` |
| `api_keys` | Chave de API do cliente (bearer /api/v1) | `prefix`, `hash`, `scope` (read/write), `last_used_at`, `revoked_at` |
| `workspace_security` | Política de segurança do workspace | `enforce_2fa`, `ip_allowlist_json`, `session_max_minutes`, política de senha |
| `user_2fa` | TOTP do usuário | `secret`, `backup_codes_hash` |
| `audit_logs` | Trilha de auditoria | `action`, `entity_type`, `entity_id`, `metadata_json`, `ip` |
| `error_events` | Captura de erros (observability) | `path`, `status_code`, `error_message`, `error_stack` |
| `workspace_email_domains` | Domínio de email custom (S61) | `domain`, `resend_domain_id`, `status`, `records_json` (DKIM/SPF) |

### 4.7 Growth: afiliados, parceiros, embed

| Tabela | Papel | Campos-chave |
|---|---|---|
| `affiliates` | Afiliado (1:1 com workspace) | `code` único, `tier`, `commission_pct`, totais de comissão |
| `referrals` | Indicação rastreada | `affiliate_id`, `referred_user_id`, `status` (signup/paying), `commission_earned` |
| `partner_applications` | Candidatura ao programa Educator | `audience_size`, `niche`, `channels_json`, `status` |
| `embed_views` | View do badge embedado | `variant`, `referer_domain`, `ip_hash` |

> **Migrations:** 19 arquivos SQL (`0000_init` → `0018_email_domains`). Numere igual em
> outra stack; o `0000` cria o núcleo e cada sprint que mexe em schema adiciona uma migration.

---

## 5. Mapa de rotas

### 5.1 Páginas públicas (marketing + verificação)

| Rota | Função |
|---|---|
| `/` → `/[locale]` | Landing GODMODE multilíngue (PT/EN/ES/FR), geo-redirect por IP |
| `/[locale]` | Landing por idioma — features, comparação com concorrentes, pricing |
| `/verificar` | Verificador público SEO (busca por hash/ID) |
| `/v/[id]` | Página de verificação de um certificado específico |
| `/escola/[slug]` | Perfil público do issuer (bio, certs recentes, cursos) |
| `/demo` + `/demo/[id]` | Fluxo de demonstração (emite cert fake em 3 passos) |
| `/marketplace` | Marketplace de templates da comunidade |
| `/casos` + `/casos/[vertical]` | Landing pages por nicho (cabelo, estética, MBA...) |
| `/vs/[competitor]` | Páginas comparativas SEO (vs Credly, etc.) |
| `/roi` | Calculadora de ROI interativa |
| `/app` | Landing do app nativo / PWA |
| `/solicitar/[ws]/[courseSlug]` | Formulário público de solicitação de certificado |
| `/aceitar-convite/[token]` | Aceitar convite para um workspace |
| `/embed/student/[email]` | Widget embedável dos certificados de um aluno |
| `/termos` `/privacidade` `/lgpd` | Páginas legais |

### 5.2 Páginas autenticadas (dashboard)

| Rota | Função |
|---|---|
| `/sign-in` `/sign-up` `/forgot-password` `/reset-password` | Autenticação |
| `/onboarding` | Onboarding 5 passos pós-signup |
| `/dashboard` | Visão geral (métricas, atividade) |
| `/queue` | Fila de solicitações — aprovar/rejeitar/pedir revisão |
| `/credentials` | Certificados emitidos |
| `/recipients` | Base de destinatários |
| `/courses` `/courses/new` `/courses/[id]` | Gestão de cursos |
| `/templates` `/templates/new` `/templates/editor` | Galeria + editor visual de templates |
| `/workflows` `/workflows/new` | Workflows de email/WhatsApp |
| `/bulk` | Emissão em lote + export ZIP |
| `/analytics` | Analytics de certificados |
| `/audit` | Trilha de auditoria + export CSV/JSON |
| `/team` | Gestão de time + convites + RBAC |
| `/billing` | Assinatura, plano, faturas |
| `/domain` | Wizard de domínio customizado |
| `/settings/branding` | White-label (cores, logo, remover marca d'água) |
| `/integrations` `/integrations/fluent` `/integrations/api-keys` | Integrações + API keys |
| `/affiliate` | Dashboard de afiliado |
| `/reseller` | Painel de revenda |
| `/admin/health` | Saúde do sistema (observability) |
| `/partner/apply` | Candidatura ao programa Educator |

### 5.3 API REST (`/api/v1/*` — Hono, bearer ou sessão)

**Certificados:** `credentials/[id]/badge` (Open Badge), `credentials/[id]/vc` (W3C VC),
`credentials/[id]/wallet/apple`, `credentials/[id]/wallet/google`, `credentials/bulk-export`.

**IA:** `ai/generate-template`, `ai/validate-photo`, `ai/suggest-improvements`,
`ai/extract-document` (OCR RG/CNH), `ai/detect-fraud` (face match).

**Billing:** `billing/checkout`, `billing/portal`, `billing/usage`.

**Webhooks-out:** `webhooks/endpoints`, `webhooks/endpoints/[id]`, `webhooks/retry`.

**Webhooks-in billing:** `webhooks/stripe`, `webhooks/pagarme`.

**Marketplace:** `marketplace`, `marketplace/submit`, `marketplace/[id]/install`.

**Growth:** `affiliate`, `affiliate/track`, `partner/apply`, `embed/badge/[ws]`, `share/track`.

**Integrações:** `integrations/linkedin/learning/xapi`, `integrations/linkedin/profile/[email]`.

**Plataforma:** `api-keys`, `api-keys/[id]`, `workspace/brand`, `workspace/keys`,
`email/domains`, `email/domains/[id]/verify`, `analytics/workspace`,
`analytics/credential/[id]`, `audit/export`, `search`, `queue/stream` (SSE realtime),
`assets/[key]`.

### 5.4 Webhooks de entrada (plataformas de curso)

`/api/webhooks/hotmart` · `/kiwify` · `/memberkit` · `/eduzz` · `/fluent` · `/mercadopago`

Cada um: valida HMAC → grava em `webhooks_in` (cru) → mapeia curso→template → cria
`certificate_request` → auto-aprova se `course.auto_approve` → emite.

### 5.5 Cron

`/api/cron/nps` — dispara pesquisa NPS D+7 após emissão.

---

## 6. Camadas de lógica de negócio

Tudo em `src/lib/` — funções stateless, sem dependência de framework. **Esta é a camada
que você porta primeiro** ao mudar de stack; o resto é "cola".

| Módulo | Responsabilidade |
|---|---|
| `auth.ts` / `auth-client.ts` | Config Better Auth (server) + cliente (browser). Email+senha, OAuth Google/Microsoft, `sendResetPassword`. |
| `rbac.ts` / `rbac-types.ts` | Papéis (admin/editor/aprovador/viewer) e checagem de permissão por ação. |
| `workspace.ts` / `current-workspace.ts` | Resolução do workspace ativo (cookie) + criação/troca. |
| `credentials.ts` | Emissão: gera hash SHA-256, monta metadata, grava `credentials`, dispara eventos. |
| `cert-template.ts` / `cert-template-shared.ts` / `layout-v2.ts` | Modelo do `layout_json` (canvas) e renderização para HTML. |
| `render-pdf.ts` / `pdf-to-png.ts` | HTML do certificado → PDF (browser rendering) → PNG (thumbnail/preview). |
| `ed25519.ts` / `openbadge.ts` | Geração de chave Ed25519, `did:web`, assinatura de Open Badge 3.0 / W3C VC. |
| `apple-wallet.ts` / `google-wallet.ts` | Geração de `.pkpass` (Apple) e JWT de "Generic Pass" (Google). |
| `webhook-handler.ts` | Recebe webhook-in: valida HMAC, grava cru, roteia por provider. |
| `webhook-dispatcher.ts` | Webhook-out: monta payload, assina HMAC, entrega com retry exponencial. |
| `email-dispatcher.ts` / `resend.ts` / `notify.ts` | Pipeline: evento → busca workflows ativos → renderiza template → envia via Resend → loga. |
| `resend-domains.ts` | API de domínios Resend (criar/verificar domínio de email custom). |
| `workflow-template.ts` | Renderização dos `body_template` de workflows (variáveis `{{...}}`). |
| `plans.ts` / `plan-limits.ts` | Definição dos 4 planos e enforcement de limites (certs/mês, AI jobs, storage). |
| `stripe-client.ts` / `mercadopago.ts` | Checkout, portal, parsing de webhooks de billing. |
| `ai-client.ts` | Wrapper da Claude API: gerar template, validar foto, OCR de documento, anti-fraude. |
| `i18n.ts` / `landing-data.ts` | 4 locales (pt/en/es/fr), geo-mapping país→locale, dados da landing. |
| `whitelabel.ts` / `cloudflare-saas.ts` | White-label: detecção de host, custom domain, remoção de marca d'água. |
| `api-key.ts` | Geração/hash/validação de API keys (bearer auth do `/api/v1`). |
| `hmac.ts` | Assinatura/verificação HMAC (webhooks in e out). |
| `rate-limit.ts` | Rate limiting via KV nos endpoints públicos. |
| `observability.ts` | `captureError()` → grava `error_events`; health checks. |
| `affiliate.ts` | Tracking de indicação, cálculo de comissão. |
| `share-urls.ts` | Geração de URLs de compartilhamento (LinkedIn, WhatsApp, etc.). |
| `course-requirements.ts` | Form builder: schema de requisitos por curso, validação de submissão. |
| `editor-history.ts` | Undo/redo do editor de templates. |
| `nps.ts` | Lógica do NPS D+7. |
| `r2-assets.ts` | Upload/download/signed URLs do blob storage. |
| `cpf.ts` / `ulid.ts` | Utilitários (validação de CPF, geração de ULID). |

---

## 7. Integrações externas

| Serviço | Uso | Como portar |
|---|---|---|
| **Resend** | Email transacional (welcome, reset de senha, notificações de workflow). Domínio verificado por DKIM/SPF/DMARC. | Qualquer provedor (SES, Postmark, SendGrid) — abstrair atrás de `sendEmail()`. |
| **Stripe** | Billing global — checkout, portal, assinaturas, webhooks HMAC. | Mantém (Stripe é multi-stack). |
| **Pagar.me** | Billing Brasil (cartão, boleto, PIX). | Trocar por gateway local equivalente. |
| **Claude API (Anthropic)** | Gerar template via prompt, validar foto do aluno, OCR de RG/CNH, detecção de fraude (face match). | Mantém — é HTTP puro. |
| **Meta WhatsApp Cloud API** | Notificação de certificado emitido por WhatsApp. | Mantém ou troca por Twilio/Zenvia. |
| **Apple Wallet (PassKit)** | `.pkpass` assinado para o aluno adicionar o cert à carteira. | Precisa de certificado Apple Developer. |
| **Google Wallet** | JWT de "Generic Pass". | Precisa de service account Google. |
| **Plataformas de curso** | Webhooks-in: Hotmart, Kiwify, Memberkit, Eduzz, Fluent (WordPress/FluentCommunity), Hubla, Greenn. | Cada uma: parser de payload + validação HMAC própria. |
| **n8n** | Pacote de nodes oficial (`n8n-nodes-univercert`) para automação no-code. | Reempacotar apontando para a nova API. |
| **LinkedIn** | "Add to profile" + xAPI (LinkedIn Learning) + lookup de perfil. | Mantém. |

---

## 8. Regras de negócio centrais

### 8.1 Ciclo de vida de um certificado

```
Origem (form público / webhook / manual / CSV)
   │
   ▼
certificate_requests (status=pending)
   │   ├─ se course.auto_approve → pula revisão
   │   └─ senão → fila /queue, aprovador decide
   ▼
status=approved
   │
   ▼  EMISSÃO (credentials.ts)
   ├─ cria recipient (ou reusa por CPF/email)
   ├─ gera hash_sha256 do conteúdo canônico
   ├─ renderiza HTML do template + dados → PDF (browser rendering) → PNG
   ├─ sobe PDF/PNG no blob storage (R2)
   ├─ assina Open Badge 3.0 / W3C VC com Ed25519 (issuer_keys)
   ├─ grava credentials (status emitido)
   └─ dispara evento 'credential.issued'
        ├─ workflows de email/WhatsApp
        ├─ webhooks-out configurados
        └─ incrementa usage_meters
   ▼
Aluno recebe: link /v/[id] + PDF + badge + wallet pass
   │
   ▼  VERIFICAÇÃO PÚBLICA (/verificar, /v/[id])
   ├─ busca por hash_sha256 ou id
   ├─ checa revoked_at / expires_at
   ├─ grava verify_logs (geo, UA)
   └─ mostra status: válido / revogado / expirado
```

### 8.2 RBAC — papéis e permissões

- **admin** — tudo: billing, time, integrações, branding, emitir, aprovar, editar.
- **editor** — cria/edita templates e cursos; **não** aprova fila nem mexe em billing/time.
- **aprovador** — aprova/rejeita/pede revisão na fila; **não** edita templates.
- **viewer** — só leitura.

Checagem sempre por `(workspace_id, user_id) → role → ação permitida`. Nunca confiar no client.

### 8.3 Planos e limites

4 planos (`free`, e três pagos). `plan-limits.ts` faz enforcement por período mensal
(`usage_meters` PK `workspace_id+period_ym`): nº de certificados emitidos, nº de AI jobs,
custo de IA acumulado, storage. Ao estourar: bloqueia a ação e sugere upgrade.

### 8.4 Idempotência e retry de webhooks

- **Entrada:** todo webhook é gravado cru em `webhooks_in` **antes** de processar →
  reprocessável, auditável. HMAC validado por provider.
- **Saída:** `webhook_deliveries` com `attempt_count`/`max_attempts` (5) e `next_retry_at`
  (backoff exponencial). Cron varre pendentes e reenvia.

### 8.5 Verificação criptográfica

Cada workspace tem um par de chaves Ed25519 (`issuer_keys`) e um `did:web`. O Open Badge 3.0
e o W3C Verifiable Credential são assinados — um verificador externo confere a assinatura
**sem precisar do UniverCert**. O `hash_sha256` em `credentials` é a âncora de integridade
do conteúdo.

### 8.6 White-label

Workspace em plano superior pode: domínio próprio (`custom_domain`), cores/logo próprios,
remover a marca d'água "emitido via UniverCert", e ter as verify pages no domínio dele.
`whitelabel.ts` resolve o host da request → workspace → aplica o branding.

### 8.7 Multi-idioma

Páginas públicas em PT/EN/ES/FR. `middleware` faz geo-redirect de `/` para `/{locale}`
baseado em: cookie `uc_locale` > header de país (geo do CDN) > `accept-language` > `pt`.

---

## 9. Sequência de sprints — entregue

Ordem cronológica real de construção. Cada sprint = um incremento deployável.

### Fundação

- **S0 — Provisionamento.** Banco + schema v0 (15 tabelas), blob storage, KV, scaffold do
  app, repositório, CI de deploy automático, primeiro build verde.
- **S1 — Emissão core.** API approve/reject de requests, UI da fila (1 clique), verify page
  consultando credential real, render de PDF, smoke test do fluxo completo.
- **S2 — Autenticação.** Better Auth com signin/signup reais.
- **S3 — Webhooks-in.** Hotmart, Memberkit, Kiwify (HMAC + idempotência).

### Growth e conversão

- **S9 — SEO & growth.** WhatsApp FAB global, meta tags + OG image + robots + sitemap,
  footer LGPD/CNPJ, trust bar + depoimentos + FAQ, rate limit via KV, páginas legais.
- **S10 — Demo flow.** Endpoint público de emissão (rate-limited), workspace demo, fluxo
  `/demo` em 3 passos, página de resultado com share + CTA, badge "DEMO" na verify page.
- **S13 — Conversão.** Onboarding 5 passos, calculadora de ROI, páginas `/vs/*`
  comparativas, páginas `/casos/[vertical]`, sticky CTA.

### Design system GODMODE

- **S11 — GODMODE.** Tema premium (tokens CSS), template de certificado PDF-ready, verify
  page, demo flow, landing, páginas do dashboard, páginas de auth — tudo redesenhado.
- **S12 — Templates premium.** 6 templates premium, galeria com preview, editor de
  personalização, logo escudo navy/gold + nova paleta, auditoria de segurança.

### Editor visual

- **S14 — Construtor de templates.** Página `/templates/new` com canvas drag-and-drop,
  renderer do `layout_json`, API de templates (criar/editar/listar).
- **S21 — Editor V2.** Upload de assets (R2) + importers (PNG/JPG/PDF/SVG/Figma/Canva),
  canvas com background + zonas arrastáveis, renderer V2, PDF background interativo (pdf.js).
- **S22b/c/d — Polimento do editor.** Undo/redo, resize, atalhos, fontes, fix de delete,
  editar/duplicar templates customizados, auto-fit de texto, edição inline (double-click),
  biblioteca de assets, tamanhos de página (A4/Letter/A3/Square/Custom), multi-seleção,
  marquee selection, toolbar de alinhar/distribuir, modal de reuso de uploads.

### Multi-tenant e operação

- **S15 — Multi-tenant.** RBAC + convites; **S15a** — dark mode.
- **S16 — Mobile-first + PWA.**
- **S17 — Workflows.** Templates custom de email/WhatsApp por evento.
- **S18 — Observability.** `/admin/health`, error tracking; **S18b** — sistema de email
  Resend (engine de workflow + dispatcher).
- **S19 — Custom domain wizard.**
- **S20 — WordPress.** Plugin UniverCert × FluentCommunity, embed widget
  `/embed/student/[email]`, auto-approve + mapeamento curso→template no webhook Fluent,
  wizard `/integrations/fluent`.
- **S22 — Cursos e formulários.** Entidade `courses`, requisitos + extras + revisões,
  form builder no editor, página pública `/solicitar/[ws]/[courseSlug]`, fila enriquecida,
  reenvio + magic link, eventos `request.submitted` / `request.needs_revision`.
- **S23 — Workspace switcher.** Cookie de workspace atual, refactor RBAC, switcher na
  sidebar, fim dos lookups hardcoded.
- **S24 — Verificador público SEO** (`/verificar`).

### Recipient WOW e padrões abertos

- **S26 — Recipient WOW.** "Add to LinkedIn", Apple/Google Wallet, share bar.
- **S29 — Padrões abertos.** Export Open Badges 3.0 + W3C Verifiable Credentials.
- **S31 — Issuer profile** (`/escola/[slug]`).
- **S55+S56 — Wallet real.** Apple `.pkpass` assinado + Google Wallet JWT real.
- **S59 — Open Badges 3.0 com assinatura Ed25519 real.**

### IA

- **S28 — AI assist.** Gerar template via prompt, validar foto, sugerir melhorias.
- **S47 — AI vision.** Auto-preenchimento de RG/CNH (OCR).
- **S48 — AI anti-fraude.** Detecção de fraude (face match).

### Plataforma e produtividade

- **S30 — Cmd+K** search global + fila em tempo real (SSE).
- **S32 — Analytics** de certificados + export ZIP em lote.
- **S33 — i18n** PT/EN/ES nas páginas públicas.
- **S34 — PWA enhancement** + landing do app nativo (stub).
- **S77 — Cmd+K /actions** (slash commands).

### Monetização

- **S35 — Billing.** Stripe + Pagar.me real, 4 planos.
- **S36 — Plan limits enforcement.**
- **S37 — Página `/billing` GODMODE.**

### Segurança e enterprise

- **S38 — SSO** Google + Microsoft + stub SAML.
- **S39 — API keys** (criar/rotacionar/escopo) + middleware de auth.
- **S40 — Webhooks-out** + dispatcher; **S40b** — wire dos eventos reais.
- **S41 — 2FA TOTP** + IP allowlist.
- **S42 — Audit log export** CSV/JSON.

### Ecossistema e white-label

- **S43 — Marketplace** de templates da comunidade.
- **S44 — Afiliados** — tracking + dashboard.
- **S45 — Educator partner program** (revenue share).
- **S46 — Embed badge code** (script + SVG).
- **S60+S62+S63 — White-label** — CSS custom + remover marca d'água + detecção de host na
  verify; **S62b** — UI `/settings/branding` GODMODE.
- **S61 — Domínio de email custom** (wizard, verificação DKIM/SPF via Resend).
- **S64 — LinkedIn Learning xAPI.**
- **S68 — Pacote n8n-nodes oficial.**

### Infra e marca (recentes)

- **Migração de domínio** `univercert.com.br` → `univercert.net` (todo o código + infra).
- **Custom domain** `univercert.net` + `www` configurados e verificados.
- **Landing 4 idiomas** (PT/EN/ES/FR) + geo-redirect por IP.
- **TopNav GODMODE** — seletor superior multi-página.
- **S78 — Recuperação de senha real** via Resend + Better Auth (`sendResetPassword`,
  páginas `/forgot-password` e `/reset-password`, secrets no ambiente de produção).

### Itens em aberto (dívida)

- S22c/d: multi-select + align/distribute e modal de AssetLibrary ainda parcialmente pendentes.
- Hotfix UX: permissão do editor + switcher na sidebar.
- Aplicar migrations 0012–0018 no banco remoto (se ainda não aplicadas).
- Configurar secrets restantes: `ANTHROPIC_API_KEY`, chaves Stripe, OAuth Microsoft, Wallet.

---

## 10. Roadmap futuro

Sprints propostos, agrupados por tema. Numeração sugerida; priorize conforme o negócio.

### Bloco A — Confiabilidade e padrões (S79–S84)

- **S79 — Renovação e expiração automática.** Cron que avisa antes de `expires_at`, fluxo
  de re-emissão, certificados com validade (ex: NRs, conselhos de classe).
- **S80 — Blockchain anchoring (opcional).** Âncora do `hash_sha256` em uma chain pública
  para prova de existência com timestamp imutável.
- **S81 — Revogação em lote + CRL.** Lista de revogação publicável + revogar por critério.
- **S82 — Verificação offline.** Pacote do certificado (VC + chave pública) que verifica
  sem internet.
- **S83 — Assinatura de PDF (PAdES).** Além do hash, assinar o próprio PDF digitalmente.
- **S84 — Conteúdo do certificado multilíngue.** Mesmo certificado renderizável em N idiomas.

### Bloco B — Escala de emissão (S85–S89)

- **S85 — Import CSV com UI.** Upload de planilha → preview → emissão em lote com fila.
- **S86 — Fila assíncrona real.** Mover emissão pesada (PDF render) para fila/worker.
- **S87 — API pública v2 + portal de docs.** Documentação interativa (OpenAPI), sandbox.
- **S88 — Bulk via API.** Endpoint de emissão em lote idempotente para integradores.
- **S89 — Templates dinâmicos por dados.** Campos condicionais no `layout_json`.

### Bloco C — Enterprise (S90–S95)

- **S90 — SAML/SSO real + SCIM.** Provisionamento automático de usuários.
- **S91 — Workspaces aninhados / org hierarchy.** Rede de escolas sob uma org-mãe.
- **S92 — Permissões granulares (ABAC).** Além de RBAC, regras por atributo.
- **S93 — Data residency.** Escolha de região de armazenamento por workspace.
- **S94 — Audit log imutável + SIEM export.** Stream para ferramentas de compliance.
- **S95 — SLA dashboard + status page.**

### Bloco D — Ecossistema e growth (S96–S101)

- **S96 — App de integrações (Zapier/Make/Pipedream).**
- **S97 — Slack/Teams/Discord notifications.**
- **S98 — Marketplace v2.** Templates pagos com split de receita para autores.
- **S99 — Programa de parceiros White-label/Reseller completo.**
- **S100 — Embeds avançados.** Carteira pública embedável, "wall of certificates".
- **S101 — Mobile app nativo** (iOS/Android) — hoje só PWA.

### Bloco E — IA (S102–S106)

- **S102 — Designer de certificado por prompt** ("crie um cert de barbearia art déco").
- **S103 — Anti-fraude contínuo.** Score de risco por emissão, detecção de anomalia.
- **S104 — Assistente de suporte (chatbot)** no dashboard com contexto do workspace.
- **S105 — Insights automáticos.** "Seus certs de curso X têm 3x mais share."
- **S106 — Tradução automática** de conteúdo de certificado.

### Bloco F — Operação e qualidade (contínuo)

- **Remover `ignoreBuildErrors`** — zerar a dívida de tipos.
- **Cobertura de testes** — unit nas funções de `src/lib`, e2e no fluxo de emissão.
- **Observability real** — tracing distribuído, alertas, dashboards.
- **Performance** — orçamento de latência nas verify pages, lazy-load do editor.

---

## 11. Guia de replicação passo a passo

Sequência recomendada para reconstruir do zero em **qualquer** stack.

### Fase 0 — Infra base
1. Provisione: banco relacional, blob storage, cache KV, runtime serverless, CI/CD.
2. Configure domínio + DNS + TLS.
3. Defina o esquema de segredos (ver seção 12).

### Fase 1 — Núcleo de dados e auth
4. Crie as tabelas do **bloco 4.1** (tenancy + identidade) — migration `0000`.
5. Implemente autenticação (email+senha, OAuth, sessão, reset de senha). Better Auth é
   portável; alternativas: Auth.js, Lucia, Supabase Auth, Clerk.
6. Implemente RBAC (`workspace_members.role` → permissões).

### Fase 2 — Emissão (o coração)
7. Tabelas do **bloco 4.3** (cursos, recipients, requests, credentials, verify_logs, issuer_keys).
8. Modelo do `layout_json` + renderer HTML do certificado.
9. Pipeline de render: HTML → PDF → PNG → blob storage.
10. Função `emitirCredencial()`: hash SHA-256, grava credential, sobe arquivos, dispara eventos.
11. Verify page pública + `verify_logs`.

### Fase 3 — Marca e templates
12. Tabelas do **bloco 4.2** (`brand_kits`, `templates`, `assets`).
13. Editor visual de templates (canvas drag-and-drop) — é o maior esforço de front.
14. Galeria + 6 templates premium de partida.

### Fase 4 — Entrada de dados
15. Webhooks-in (`integrations`, `webhooks_in`) — comece por 1 provider (ex: Hotmart).
16. Formulário público de solicitação (`/solicitar/...`).
17. Fila de aprovação (`/queue`) + RBAC do aprovador.

### Fase 5 — Comunicação e automação
18. Tabelas do **bloco 4.4** (`workflows`, `email_events`, webhooks-out).
19. `email-dispatcher`: evento → workflow → render → envio → log.
20. Webhooks-out com retry.

### Fase 6 — Padrões abertos
21. `issuer_keys` (Ed25519 + `did:web`).
22. Export Open Badge 3.0 + W3C VC assinados.
23. Apple/Google Wallet.

### Fase 7 — Monetização
24. Tabelas do **bloco 4.5** (`subscriptions`, `invoices`, `usage_meters`).
25. Integração de billing + webhooks de pagamento.
26. Enforcement de limites por plano.

### Fase 8 — Plataforma e enterprise
27. API REST `/api/v1` + API keys (bearer).
28. Tabelas do **bloco 4.6** (segurança, 2FA, audit, observability).
29. White-label + custom domain + domínio de email.

### Fase 9 — Growth
30. Tabelas do **bloco 4.7** (afiliados, parceiros, embed).
31. Marketplace, programa de afiliados, embed badge.

### Fase 10 — IA e polimento
32. Integração com LLM (gerar template, OCR, anti-fraude).
33. Cmd+K, analytics, i18n, PWA.
34. Roadmap futuro (seção 10).

> **Atalho pragmático:** as Fases 1–2 já entregam um produto vendável (emitir + verificar).
> Tudo depois é expansão. Não tente fazer as 10 fases antes de ter o primeiro cliente.

---

## 12. Variáveis de ambiente e secrets

| Variável | Tipo | Função |
|---|---|---|
| `APP_NAME` | pública | Nome da aplicação |
| `APP_URL` | pública | URL base (ex: `https://univercert.net`) |
| `DEFAULT_LOCALE` | pública | Locale padrão (`pt-BR`) |
| `SUPPORTED_LOCALES` | pública | Locales suportados |
| `BETTER_AUTH_SECRET` | **secret** | Chave de assinatura de sessão/token (gerar aleatório forte) |
| `BETTER_AUTH_URL` | secret/config | URL base do auth (ou auto-detect) |
| `RESEND_API_KEY` | **secret** | Envio de email transacional |
| `RESEND_FROM` | secret/config | Remetente (`UniverCert <no-reply@univercert.net>`) |
| `GOOGLE_OAUTH_CLIENT_ID` / `_SECRET` | **secret** | Login com Google |
| `MICROSOFT_OAUTH_CLIENT_ID` / `_SECRET` / `_TENANT_ID` | **secret** | Login com Microsoft |
| `ANTHROPIC_API_KEY` | **secret** | Claude API (IA) |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` / `STRIPE_PRICE_*` | **secret** | Billing global |
| `PAGARME_API_KEY` (ou `ASAAS_API_KEY`) | **secret** | Billing Brasil |
| `META_WHATSAPP_TOKEN` / `META_WHATSAPP_PHONE_ID` | **secret** | WhatsApp Cloud API |
| `HOTMART_WEBHOOK_SECRET` / `MEMBERKIT_WEBHOOK_SECRET` / `FLUENT_WEBHOOK_SECRET` / ... | **secret** | Validação HMAC dos webhooks-in |
| `NFEIO_API_KEY` | **secret** | Emissão de nota fiscal (BR) |
| Credenciais Apple Wallet / Google Wallet | **secret** | Geração de passes |
| Bindings de infra (`DB`, `R2_ASSETS`, `CACHE`, `BROWSER`) | binding | Banco, storage, cache, render — na sua stack viram connection strings |

**Regra de ouro:** nada de secret no repositório. Públicas vão no config; secrets vão no
gerenciador de secrets da plataforma (no atual: Cloudflare Pages Secrets / `wrangler secret put`).

---

*Fim do blueprint. Para detalhe de implementação de qualquer módulo, consulte o código-fonte
em `src/lib/` (lógica), `src/app/` (rotas) e `src/db/schema.ts` (modelo de dados).*
