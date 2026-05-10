#!/bin/bash
# UniverCert · WAVE 2 — S28 (AI assist) + S30 (Cmd+K + SSE realtime)

set -e
cd "$(dirname "$0")"
rm -f .git/index.lock 2>/dev/null || true

git add -A
git diff --cached --stat | tail -20
echo

git commit -m "feat(s28+s30): AI assist (Claude API) + Cmd+K search + SSE realtime queue

S28 — AI ASSIST (Claude Haiku 4.5):
* lib/ai-client.ts: edge-compatible fetch wrapper + cost estimation BRL
* /api/v1/ai/generate-template: input curso → layoutJson V2 completo
  System prompt detalhado com schema obrigatorio, regras de design, QR auto.
* /api/v1/ai/validate-photo: vision input → detecta fake/IA/blur/recorte/lighting
  Score 0-100 + issues + recommendations. Role aprovador+.
* /api/v1/ai/suggest-improvements: critica template existente
  Score + severity (critical/warning/info) + suggestions categorizadas.
* Migration 0013_ai_jobs: tabela tracking custos + tokens + duration

S30 — CMD+K SEARCH + REALTIME QUEUE:
* /api/v1/search?q=...: busca multi-entity (alunos/certs/templates/requests)
  Role viewer+, retorna 5 por categoria, em paralelo via Promise.all
* components/CommandPalette.tsx: modal Cmd+K / Ctrl+K
  - Auto-focus input, debounce 200ms
  - 10 nav shortcuts default + resultados live
  - Keyboard nav (arrows + enter + esc)
  - Icons coloridos por kind, kbd hint
  - Botao 'Buscar' visivel na sidebar
* /api/v1/queue/stream: SSE endpoint
  - Tick 5s × 5 = 25s (dentro do limite Workers ~30s)
  - Eventos: hello, requests (new/updated rows), ping, reconnect, error
  - Auto-reconnect via EventSource client-side
* Sidebar.tsx: monta <CommandPalette/> globalmente

ULID: + aiJob prefix.
SCHEMA: + aiJobs table com indexes (ws + type + status).

ENV VARS NECESSARIAS apos push:
* ANTHROPIC_API_KEY (sem isso AI endpoints retornam erro claro)

PRICING (Haiku 4.5):
* Input  ~R\$0.0055/1k tokens (1.0 USD/1M × 5.5 BRL)
* Output ~R\$0.0275/1k tokens
* Generate-template tipico: ~600 in + 1200 out = R\$0.04/template
* Validate-photo: ~800 in + 200 out = R\$0.01/foto
* Suggest-improvements: ~1500 in + 800 out = R\$0.03/critica" || echo "nada"

git push 2>&1 | tail -3

echo
echo "Aguardando CI build (~3min)..."
sleep 180
curl -s "https://api.github.com/repos/univerbeauty777/univercert/actions/runs?per_page=1" \
  | grep -E '"(head_sha|status|conclusion)"'

echo
echo "Apos verde:"
echo "  1. Aplicar migration 0013:"
echo "     wrangler d1 execute univercert-prod --remote --file=drizzle/migrations/0013_ai_jobs.sql"
echo
echo "  2. Setar ANTHROPIC_API_KEY no Cloudflare Pages env vars"
echo "     https://dash.cloudflare.com -> Pages -> univercert -> Settings -> Env vars"
echo
echo "  3. Testar:"
echo "     - Cmd+K em qualquer pagina dashboard"
echo "     - POST /api/v1/ai/generate-template { courseName: 'Botox capilar' }"
echo "     - /queue abre conexao SSE auto (devtools Network -> EventStream)"
echo
read
