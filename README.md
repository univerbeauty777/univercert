# UniverCert

Plataforma brasileira de certificados digitais. Construída sobre Cloudflare (D1 + R2 + Workers + Pages) com Next.js 15.

> **Status:** Sprint 0 — infra Cloudflare provisionada, schema D1 v0 aplicado, scaffold rodando. Próximo: Sprint 1 (Auth + Designer base).

---

## Stack

- **Frontend:** Next.js 15 (App Router) + Tailwind 3 + React 19
- **API:** Hono em Edge runtime (Cloudflare Workers)
- **Database:** Cloudflare D1 (SQLite) + Drizzle ORM
- **Storage:** Cloudflare R2 (zero egress fees)
- **Cache:** Cloudflare KV
- **Auth:** Better Auth (open-source, integra D1 via Drizzle)
- **PDF render:** Cloudflare Browser Rendering (Sprint 2)
- **Email:** Resend (Sprint 3)
- **WhatsApp:** Meta Cloud API (Sprint 3)
- **Pagamento:** Asaas (Pix + Boleto + Cartão · Sprint 5)
- **NF-e:** NFE.io (Sprint 5)

---

## Recursos Cloudflare provisionados

| Recurso | Nome | ID |
|---|---|---|
| Account | DXPRO Univerbeauty | `4a89b58af57b3ffb99858479a75b1e61` |
| D1 Database | `univercert-mvp` | `161fc60a-d5d3-4722-8c04-d8120f2682bc` |
| R2 Bucket | `univercert-assets` | — |
| KV Namespace | `univercert-cache` | `155def9a0c5249bca41686d25e4f7208` |

---

## Setup local

```bash
# 1. Instalar deps
npm install

# 2. Copiar env
cp .env.example .env.local
# preencher BETTER_AUTH_SECRET (gerar: openssl rand -base64 32)

# 3. Login no Cloudflare
npx wrangler login

# 4. Aplicar schema no D1 local
npm run db:push:local

# 5. Rodar dev (Next.js + bindings Cloudflare)
npm run dev
```

Acesse:
- http://localhost:3000 — landing
- http://localhost:3000/uh/solicitar — form de solicitação UniverHair
- http://localhost:3000/dashboard — dashboard admin
- http://localhost:3000/v/{credentialId} — verify page

---

## Deploy para Cloudflare Pages

```bash
# Build + deploy de uma vez
npm run deploy
```

Primeira vez: o wrangler vai pedir o nome do projeto Pages — use `univercert`.

---

## Schema multi-tenant

**CRÍTICO:** D1 não tem RLS nativo (como Postgres). O isolamento entre workspaces é feito **no app layer** via:

- Campo `workspace_id NOT NULL` em **toda** tabela operacional
- Helper `requireWorkspaceAccess(workspaceId, userId)` em `src/lib/workspace.ts`
- Middleware Hono força o filtro em todas as queries

**Regra de ouro:** nunca faça query a tabelas operacionais sem passar pelo helper. Há testes E2E cross-tenant em CI para garantir.

---

## Estrutura de pastas

```
univercert/
├── drizzle/
│   └── migrations/         # SQL migrations versionadas
│       ├── 0000_init.sql   # 15 tabelas core
│       └── 0001_seed_univerhair.sql
├── src/
│   ├── app/                # Next.js App Router
│   │   ├── (auth)/         # rotas de login/signup
│   │   ├── (dashboard)/    # rotas autenticadas
│   │   ├── api/
│   │   │   ├── auth/       # Better Auth handler
│   │   │   ├── v1/         # API pública (Hono)
│   │   │   └── webhooks/   # webhooks de entrada (Hotmart, Memberkit, Fluent...)
│   │   ├── uh/solicitar/   # form público UniverHair
│   │   └── v/[id]/         # verify page pública
│   ├── components/         # shadcn/ui + custom
│   ├── db/
│   │   ├── client.ts       # getDb(), getAssetsBucket(), getCache()
│   │   └── schema.ts       # Drizzle schema (espelha D1)
│   └── lib/
│       ├── auth.ts         # Better Auth config
│       ├── workspace.ts    # multi-tenant safety helper
│       ├── ulid.ts         # ID generators (cred_*, req_*, etc)
│       └── cpf.ts          # validação CPF BR
├── wrangler.toml           # Cloudflare bindings
└── .env.example
```

---

## Sprints

Ver `/outputs/univercert-ooda-sprints.html` para o plano completo. Em resumo:

- **Sprint 0** ✅ — Infra + scaffold (estamos aqui)
- **Sprint 1** — Auth + Designer base (Konva.js)
- **Sprint 2** — Emissão em massa + Render PDF
- **Sprint 3** — Verify page + WhatsApp + Email + Form Fluent live
- **Sprint 4** — Webhooks Fluent/Hotmart/Memberkit + 🚀 Beta UniverHair
- **Sprint 5** — Asaas + NF-e + Analytics
- **Sprint 6** — Multi-tenant + Custom domain (white-label)
- **Sprint 7** — Open Badges + Polygon + GTM público

---

## Contato

Diego · diegoxp12@me.com
