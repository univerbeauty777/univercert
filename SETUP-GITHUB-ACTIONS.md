# Setup GitHub Actions → Cloudflare Pages

> A UI do Cloudflare Pages tem cache OAuth quebrado pra contas GitHub recém-adicionadas. Solução melhor: **GitHub Actions com wrangler**. Mais robusto, replicável, e funciona em qualquer org.

## Como funciona

`.github/workflows/deploy.yml` roda em cada `push` na `main`:
1. Checkout do código
2. `npm ci` (install)
3. `npx @cloudflare/next-on-pages` (build)
4. `wrangler pages deploy` (deploy via API token)

## 3 secrets que você precisa criar (uma vez só)

### 1. CLOUDFLARE_ACCOUNT_ID
Já sabemos: `4a89b58af57b3ffb99858479a75b1e61`

### 2. CLOUDFLARE_API_TOKEN

Crie em: https://dash.cloudflare.com/profile/api-tokens

- Click **Create Token**
- Use o template **"Edit Cloudflare Workers"** (já vem com permissões certas)
  - Ou Custom token com permissions:
    - Account · Cloudflare Pages · Edit
    - Account · Workers Scripts · Edit
    - Account · D1 · Edit
    - Account · Workers KV Storage · Edit
    - Account · Workers R2 Storage · Edit
- Account Resources: Include → DXPRO Univerbeauty
- Click **Continue → Create Token**
- **COPIE o token** (só aparece uma vez)

### 3. BETTER_AUTH_SECRET

Gere localmente:
```bash
openssl rand -base64 32
```

Copie o output.

## Adicionar os 3 secrets no GitHub

1. Vá em https://github.com/univerbeauty777/univercert/settings/secrets/actions
2. Click **New repository secret** pra cada um:
   - Name: `CLOUDFLARE_ACCOUNT_ID` → Value: `4a89b58af57b3ffb99858479a75b1e61`
   - Name: `CLOUDFLARE_API_TOKEN` → Value: (o token criado acima)
   - Name: `BETTER_AUTH_SECRET` → Value: (output do openssl)

## Fazer o primeiro deploy

```bash
cd /Users/.../outputs/univercert
git add .github/workflows/deploy.yml SETUP-GITHUB-ACTIONS.md
git commit -m "chore: add Cloudflare Pages deploy via GitHub Actions"
git push
```

Push dispara a Action. Acompanhar em:
https://github.com/univerbeauty777/univercert/actions

Em ~3 minutos o site fica live em:
https://univercert.pages.dev

## Próximos secrets (quando configurar Resend, Google OAuth, etc)

- `GOOGLE_OAUTH_CLIENT_ID` · `GOOGLE_OAUTH_CLIENT_SECRET` (Sprint 1)
- `RESEND_API_KEY` (Sprint 3)
- `META_WHATSAPP_TOKEN` · `META_WHATSAPP_PHONE_ID` (Sprint 3)
- `ASAAS_API_KEY` · `NFEIO_API_KEY` (Sprint 5)
