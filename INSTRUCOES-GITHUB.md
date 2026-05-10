# Como subir o `univercert` para o GitHub

> O Cowork não tem GitHub MCP ainda, então o repo é criado manualmente em **3 cliques + 4 comandos**.

## 1. Criar o repo vazio (1 minuto)

1. Vá em https://github.com/new
2. Owner: você (ou organização DXPRO)
3. Repository name: **`univercert`**
4. Privacy: **Private** (recomendado neste estágio)
5. **Não** marque "Initialize with README" (vamos subir o nosso)
6. Clique **Create repository**

Anote a URL: `git@github.com:SEU_USER/univercert.git`

## 2. Copiar o scaffold para o seu computador

A pasta inteira está em `/outputs/univercert/`. Copie ela para onde você costuma trabalhar (ex: `~/dev/univercert`).

## 3. Fazer o primeiro push

Abra o terminal na pasta do projeto e rode:

```bash
cd ~/dev/univercert            # ou onde você copiou

git init
git add .
git commit -m "Sprint 0: scaffold inicial univercert (Cloudflare D1 + R2 + Next.js 15 + Hono + Drizzle)"
git branch -M main
git remote add origin git@github.com:SEU_USER/univercert.git
git push -u origin main
```

## 4. Conectar Cloudflare Pages ao repo (deploy automático)

1. https://dash.cloudflare.com → Workers & Pages → Create → Pages
2. **Connect to Git** → autorizar GitHub → selecionar `univercert`
3. Build settings:
   - Framework preset: **Next.js**
   - Build command: `npx @cloudflare/next-on-pages`
   - Build output directory: `.vercel/output/static`
4. Environment variables: pegar de `.env.example` (preencher pelo menos `BETTER_AUTH_SECRET`)
5. **Save and Deploy**

Cada `git push` na `main` dispara deploy automático.

## 5. Apontar o domínio (quando registrar univercert.net)

1. Cloudflare dashboard → o site `univercert.net` (precisa estar no Cloudflare como zona)
2. Pages → seu projeto `univercert` → Custom domains → Setup a custom domain → `univercert.net`
3. Cloudflare cria os DNS automaticamente

---

**Pronto.** Sprint 1 começa com scaffold no GitHub + Pages live + D1 já populado com seed UniverHair.

Quando você tiver feito o push, me avise e eu sigo com Sprint 1 (auth + designer base).
