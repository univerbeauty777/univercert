#!/bin/bash
# UniverCert · S22 fechamento — queue enriquecida + revisao + 2 triggers novos
# 1) Expand row na queue mostra fotos antes/depois, videos, campos extras
# 2) Botao 'Revisar' envia email com magic link /solicitar/...?revise=token
# 3) Aluno clica, pre-popula form com extras anteriores, ajusta e reenvia
# 4) Status volta pra 'pending' com historico em revisionsJson
# 5) Workflows ganham 2 triggers: request.submitted, request.needs_revision

set -e
cd "$(dirname "$0")"
rm -f .git/index.lock 2>/dev/null || true

git add \
  src/db/schema.ts \
  src/lib/email-dispatcher.ts \
  "src/app/(dashboard)/queue/page.tsx" \
  "src/app/(dashboard)/queue/QueueClient.tsx" \
  "src/app/(dashboard)/queue/QueueRow.tsx" \
  "src/app/(dashboard)/queue/actions.ts" \
  "src/app/solicitar/[ws]/[courseSlug]/page.tsx" \
  "src/app/solicitar/[ws]/[courseSlug]/RequestFormClient.tsx" \
  "src/app/solicitar/[ws]/[courseSlug]/actions.ts"

git diff --cached --stat
git commit -m "feat(s22): fechamento — queue extras + revisao magic link + 2 triggers

QUEUE PAGE
* Page passa extrasJson + revisionsJson + courseId pra rows
* Badge clickable 'N extras' expande row mostrando fotos antes/depois
  lado a lado, videos URLs, campos texto, file links
* ExtrasView component renderiza qualquer tipo do schema (image, image_pair,
  video_url, url, text, boolean)
* Botao 'Revisar' (laranja) ao lado de Aprovar/Rejeitar chama
  requestRevisionAction com prompt do comentario
* Historico de revisoes visivel no expand

REQUEST REVISION FLOW
* requestRevisionAction muda status pra 'needs_revision' + grava previous
  extras em revisionsJson + envia email com magic link pro aluno
* Email tem badge 'Solicitação precisa de revisão' + comentario do aprovador
  + botao 'Corrigir e reenviar' que abre /solicitar/[ws]/[course]?revise=token
* Pagina solicitar detecta ?revise=, busca request por token, pre-popula
  form com nome/email/extras anteriores, mostra banner laranja
* submitRevisionAction valida extras + atualiza status pra pending +
  grava nova revisao no historico (max 10) + reseta reviewerId

TRIGGERS NOVOS
* schema.workflows.triggerEvent relaxado de enum estrito pra string
* TriggerEvent TS type expandido com 'request.submitted' e 'request.needs_revision'
* Webhook fluent ja dispara request.created. Revisao dispara request.submitted.
* Workflow editor ja pode usar esses eventos pra notificar time

Build local 10.44s." || echo "nada"
git push 2>&1 | tail -3

echo
echo "Aguardando build CI (~3min)..."
sleep 180
curl -s "https://api.github.com/repos/univerbeauty777/univercert/actions/runs?per_page=1" \
  | grep -E '"(head_sha|status|conclusion)"'
echo
echo "[Pressione Enter pra fechar]"
read
