#!/bin/bash
# UniverCert · WAVE 7+8 — S64 (LinkedIn xAPI) + S68 (N8N nodes) + S47 (AI vision RG/CNH)

set -e
cd "$(dirname "$0")"
rm -f .git/index.lock 2>/dev/null || true

git add -A
git diff --cached --stat | tail -25
echo

git commit -m "feat(s64+s68+s47): LinkedIn xAPI + N8N nodes + AI vision RG/CNH

S64 — LINKEDIN LEARNING xAPI:
* /api/v1/integrations/linkedin/learning/xapi?credentialId=...
  - Statement xAPI 1.0.3 (Tin Can) compativel
  - Compat com LinkedIn Learning Hub, Cornerstone, Docebo, TalentLMS, Moodle LRS, SAP
  - actor (mbox/account), verb completed, object course com extensions
  - context com platform UniverCert + verify-url + badge-url
  - Authority assina (workspace as issuer)
* /api/v1/integrations/linkedin/profile/[email]
  - Empresas usam pra sincronizar certs dos colaboradores em massa
  - Retorna LinkedIn 'Education & Certifications' format
  - Lookup recipients por email + lista certificacoes

S68 — N8N NODES PACOTE OFICIAL:
* n8n-nodes/n8n-nodes-univercert/ (pacote npm separado)
* package.json com n8n-community-node-package keyword
* credentials/UniverCertApi.credentials.ts:
  - API key bearer + base URL (live ou staging)
  - Test request GET /api/v1/credentials
* nodes/UniverCert/UniverCert.node.ts:
  - 3 resources: certificate / recipient / template
  - Certificate ops: emit, get, list, revoke
  - Recipient ops: create, get, list
  - Template ops: list
  - Display options dinamicas por operation
  - continueOnFail support
* README.md com setup + example workflow
* Quando publicado no npm: usuarios n8n podem instalar via Settings ->
  Community Nodes -> n8n-nodes-univercert

S47 — AI VISION AUTO-FILL RG/CNH:
* /api/v1/ai/extract-document (POST) com Claude Haiku vision:
  - Input: imageBase64 + mediaType (jpeg/png/webp, max ~5MB)
  - System prompt brasileiro: detecta RG, CNH, CPF, passaporte, matricula
  - Retorna: document_type, confidence, fields (full_name/cpf/rg/birth_date/etc),
    warnings, is_authentic_likely, ai_generated_likelihood
  - NUNCA inventa dado (null se nao encontra)
  - Detecta photoshop/IA gerada
  - Plan limit AI integrado (checkAiLimit + incrementUsage)
  - Role aprovador+ pra validar fotos de alunos
* components/DocumentScanner.tsx:
  - Plug em qualquer form (formulario /solicitar/[ws]/[course], onboarding, team)
  - Camera/file picker (capture='environment' = camera traseira mobile)
  - Preview thumbnail + status busy/error/result
  - Auto-fill onExtracted callback se confidence >= 60%
  - Mostra warnings + flag de doc fake/IA gerada
  - Botao 'trocar foto' pra retentar

NOTAS:
* xAPI endpoint nao requer auth — tracking via credentialId
  (futuro: rate limit + workspace_id auth pra LinkedIn Learning Hub privado)
* N8N package precisa npm publish manual quando estiver pronto:
  cd n8n-nodes/n8n-nodes-univercert && npm publish --access public
* DocumentScanner pode ser plugado em /solicitar/[ws]/[course] ou em qualquer
  form do dashboard (recipients/new, etc) — proxima onda" || echo "nada"

git push 2>&1 | tail -3

echo
echo "Aguardando CI build (~3min)..."
sleep 180
curl -s "https://api.github.com/repos/univerbeauty777/univercert/actions/runs?per_page=1" \
  | grep -E '"(head_sha|status|conclusion)"'

echo
echo "Apos verde:"
echo "  1. Testar xAPI:"
echo "     curl https://univercert.com.br/api/v1/integrations/linkedin/learning/xapi?credentialId=cred_XYZ"
echo
echo "  2. Testar AI vision (precisa ANTHROPIC_API_KEY):"
echo "     POST /api/v1/ai/extract-document {imageBase64:..., mediaType:'image/jpeg'}"
echo
echo "  3. N8N nodes — quando quiser publicar:"
echo "     cd n8n-nodes/n8n-nodes-univercert"
echo "     npm install n8n-workflow"
echo "     npm publish --access public"
echo
read
