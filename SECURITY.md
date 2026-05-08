# UniverCert · Security Audit (Sprint 12)

Última auditoria: 8 maio 2026
Próxima: 1 jun 2026

---

## ✅ Mitigações em vigor

### Transport
- [x] HTTPS forçado pela Cloudflare Pages (TLS 1.3)
- [x] HSTS `max-age=31536000; includeSubDomains; preload`
- [x] HTTP/2 + HTTP/3 (h3)

### Headers (`middleware.ts`)
- [x] `Content-Security-Policy` com whitelist explícito
- [x] `X-Frame-Options: SAMEORIGIN` — anti-clickjacking
- [x] `X-Content-Type-Options: nosniff`
- [x] `Referrer-Policy: strict-origin-when-cross-origin`
- [x] `Permissions-Policy` — camera/mic/geo bloqueados
- [x] `Cross-Origin-Opener-Policy: same-origin`
- [x] `Server` header oculto

### Auth (`src/lib/auth.ts`)
- [x] Better Auth com Drizzle adapter no D1
- [x] Cookie `httpOnly`, `secure`, `sameSite: lax`
- [x] Cookie prefix `uc` (anti-conflito)
- [x] Senha mínima 8 caracteres, máxima 128
- [x] Session sliding (refresh após 1 dia, expira em 30)
- [x] `BETTER_AUTH_SECRET` em GitHub Secrets (não commitado)
- [x] OAuth Google opcional (só se secrets configurados)
- [x] `trustedOrigins` whitelist

### API (`src/app/api/v1/[[...route]]/route.ts`)
- [x] CORS lockdown — apenas origens conhecidas
- [x] Rate limit 5/60s em `POST /requests` (form público)
- [x] Rate limit 3/3600s em `POST /demo/issue` (anti-abuse)
- [x] HMAC SHA-256 em todos webhooks (Hotmart, Memberkit, Kiwify, Eduzz, Fluent, MercadoPago)
- [x] Validação Zod em todos endpoints com body
- [x] CPF validado server-side (algoritmo)
- [x] Stack trace só em dev (host = localhost)

### Database (Cloudflare D1)
- [x] Bindings via wrangler.toml — sem credenciais hardcoded
- [x] Foreign keys com `ON DELETE CASCADE` apropriado
- [x] Indexes em colunas sensíveis (email, workspace_id, hash_sha256)
- [x] Audit log trail em `audit_logs`
- [x] Soft delete via `revokedAt` (vs hard delete)

### Storage (R2)
- [x] Bucket `univercert-assets` privado por default
- [x] Binding `R2_ASSETS` (não `ASSETS` — reservado pelo Pages)

### Cert content
- [x] `escapeHtml` em todos campos do template (XSS prevention)
- [x] CPF mascarado na verify page (apenas 3 primeiros visíveis)
- [x] Hash SHA-256 imutável (canonical JSON)
- [x] Email do recipient não exposto na verify page

### LGPD
- [x] Consent timestamp em `recipients.lgpd_consent_at`
- [x] DPO declarado em `/lgpd`
- [x] Sub-operadores listados em `/privacidade`
- [x] Revogação de consentimento via `mailto:` ao DPO
- [x] Audit log preserva ações por 24 meses

---

## ⚠️ Pendências críticas

### IMEDIATO (antes de campanha pública)
- [ ] **Rotacionar token Cloudflare API** que foi compartilhado em sessão de chat durante setup inicial. Criar novo + revogar o anterior em https://dash.cloudflare.com/profile/api-tokens.
- [ ] **Repo privado no GitHub** — atualmente público. Settings → Danger Zone → Make private.
- [ ] **Revogar Google OAuth Client Secret** que apareceu em screenshots durante setup.

### Sprint 13 (tightening)
- [ ] CSP com **nonces** em vez de `'unsafe-inline'` (quando Next.js suportar nativo)
- [ ] **Rate limit no `/api/auth/*`** (atualmente sem) — risco de bruteforce/scraping
- [ ] **CAPTCHA no `/sign-up`** (Cloudflare Turnstile, gratuito)
- [ ] **Email verification** ligado em sign-up (atualmente `requireEmailVerification: false`)
- [ ] **2FA opcional** (TOTP via Better Auth plugin)
- [ ] **Webhook replay protection** — tracking IDs visto em janela de 5min
- [ ] **CSRF tokens** explícitos em forms (Better Auth já protege via SameSite, mas reforço manual)

### Compliance / Process
- [ ] Pen test externo antes de cliente Enterprise
- [ ] Bug bounty program em `/security` (pagar pelo Hackerone-like)
- [ ] LGPD: contrato DPA assinado com Cloudflare/Mercado Pago/Resend

---

## 🚨 Incidente response

### Quem chamar
1. DPO: Diego (diegoxp12@me.com)
2. Cloudflare Support: dash.cloudflare.com
3. ANPD (caso vazamento PII): gov.br/anpd

### Steps em caso de breach
1. **Identificar** escopo (qual endpoint? qual workspace? quantos usuários?)
2. **Conter** — desativar bindings comprometidos via Dashboard
3. **Rotacionar** todos secrets afetados (`wrangler secret put NOME`)
4. **Notificar** ANPD em prazo razoável (Art. 48 LGPD)
5. **Notificar** titulares afetados via email
6. **Postmortem** público em `/security/incident-YYYY-MM-DD.md`

---

## Secrets em uso

| Secret | Onde guardado | Uso |
|--------|---------------|-----|
| `CLOUDFLARE_API_TOKEN` | GitHub Secrets | Deploy Pages via Action |
| `CLOUDFLARE_ACCOUNT_ID` | GitHub Secrets | Idem |
| `BETTER_AUTH_SECRET` | GitHub Secrets | Sign cookies + tokens |
| `GOOGLE_OAUTH_CLIENT_ID` | GitHub Secrets | Google sign-in |
| `GOOGLE_OAUTH_CLIENT_SECRET` | GitHub Secrets | Idem |
| `RESEND_API_KEY` | Pages env (a configurar) | Envio email |
| `MERCADOPAGO_ACCESS_TOKEN` | Pages env (a configurar) | Cobrança |
| `MERCADOPAGO_WEBHOOK_SECRET` | Pages env (a configurar) | Validar webhook |
| `META_WHATSAPP_TOKEN` | Pages env (a configurar) | Envio WhatsApp |
| `META_WHATSAPP_PHONE_ID` | Pages env (a configurar) | Idem |
| `HOTMART_WEBHOOK_SECRET` | Pages env (a configurar) | Validar webhook |
| `MEMBERKIT_WEBHOOK_SECRET` | Pages env (a configurar) | Idem |
| `FLUENT_WEBHOOK_SECRET` | Pages env (a configurar) | Idem |

⚠️ **Nenhum secret é commitado no repo.** Vars públicas em `[vars]` do `wrangler.toml` (APP_NAME, etc.) — sem dado sensível.

---

## .env.example (referência)

Ver `.env.example` no repo. NUNCA commitar `.env` real.
