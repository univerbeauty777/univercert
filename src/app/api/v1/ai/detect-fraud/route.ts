// UniverCert · POST /api/v1/ai/detect-fraud (S48)
// Compara 2 fotos (selfie + RG/CNH ou cert original) — Claude vision detecta:
//   - Mesma pessoa (face match)
//   - Selfie real vs IA gerada
//   - Sinais de manipulação (deepfake, photoshop)
// Pra reduzir fraude na emissão de certs (alguém usar foto/dados de outra pessoa).

import { eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { aiJobs } from '@/db/schema';
import { ID } from '@/lib/ulid';
import { requireRole, RbacError } from '@/lib/rbac';
import { callClaude, extractJson, estimateCostBrlCents, type ClaudeModel } from '@/lib/ai-client';
import { checkAiLimit, incrementUsage } from '@/lib/plan-limits';

export const runtime = 'edge';

const MODEL: ClaudeModel = 'claude-sonnet-4-6'; // sonnet pra face match (haiku é mais fraco pra isso)

const SYSTEM_PROMPT = `Você é um especialista forense em verificação facial e detecção de fraude documental.

Recebe DUAS imagens:
1. SELFIE — foto recente da pessoa (selfie ao vivo)
2. REFERÊNCIA — foto de RG/CNH/passaporte ou cert antigo da mesma pessoa

Sua tarefa: avaliar se é a MESMA PESSOA + se ambas são autênticas (não geradas por IA, não manipuladas).

RESPONDA JSON puro:
{
  "is_same_person": true | false | null,
  "match_confidence": 0-100,
  "selfie_authentic": true | false,
  "reference_authentic": true | false,
  "selfie_is_ai_generated": 0-100,
  "reference_is_ai_generated": 0-100,
  "selfie_is_screenshot": boolean,
  "reference_is_photoshopped": boolean,
  "verdict": "approved" | "review_needed" | "rejected",
  "reasons": ["string"],
  "warnings": ["string"]
}

REGRAS:
- match_confidence > 75 e ambas autenticas → approved
- match_confidence 50-75 → review_needed
- match_confidence < 50 OU is_same_person=false OU qualquer authentic=false → rejected
- AI generated > 60 em qualquer foto → rejected
- Photoshopped detectado → rejected + warning detalhado
- Em caso de duvida, escolha review_needed (NUNCA aprove com risco)
- NÃO compare cor de pele/idade aparente como sinais de match — use estrutura óssea, marcas, traços únicos`;

export async function POST(req: Request) {
  let sess;
  try {
    sess = await requireRole('aprovador');
  } catch (e) {
    if (e instanceof RbacError) return Response.json({ ok: false, error: e.code }, { status: e.code === 'UNAUTHENTICATED' ? 401 : 403 });
    throw e;
  }

  const limitCheck = await checkAiLimit(sess.workspace.id);
  if (!limitCheck.ok) {
    return Response.json({ ok: false, error: limitCheck.reason, message: limitCheck.message, plan: limitCheck.plan, upgradeUrl: '/billing' }, { status: 402 });
  }

  const body = await req.json().catch(() => ({})) as {
    selfieBase64?: string; selfieMediaType?: string;
    referenceBase64?: string; referenceMediaType?: string;
    context?: string;
  };

  if (!body.selfieBase64 || !body.selfieMediaType || !body.referenceBase64 || !body.referenceMediaType) {
    return Response.json({ ok: false, error: 'selfieBase64+selfieMediaType+referenceBase64+referenceMediaType obrigatorios' }, { status: 400 });
  }

  const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!validTypes.includes(body.selfieMediaType) || !validTypes.includes(body.referenceMediaType)) {
    return Response.json({ ok: false, error: 'mediaType invalido' }, { status: 400 });
  }
  if (body.selfieBase64.length > 7_500_000 || body.referenceBase64.length > 7_500_000) {
    return Response.json({ ok: false, error: 'imagem muito grande (max ~5MB cada)' }, { status: 413 });
  }

  const db = getDb();
  const jobId = ID.aiJob();
  const startedAt = Date.now();

  await db.insert(aiJobs).values({
    id: jobId,
    workspaceId: sess.workspace.id,
    userId: sess.user.id,
    jobType: 'detect_fraud',
    model: MODEL,
    status: 'pending',
    inputSummary: body.context?.slice(0, 120) ?? 'face match + fraud detection',
  });

  try {
    const resp = await callClaude({
      model: MODEL,
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: '=== IMAGEM 1: SELFIE (foto recente da pessoa) ===' },
          { type: 'image', source: { type: 'base64', media_type: body.selfieMediaType, data: body.selfieBase64 } },
          { type: 'text', text: '=== IMAGEM 2: REFERENCIA (RG/CNH/passaporte ou cert antigo) ===' },
          { type: 'image', source: { type: 'base64', media_type: body.referenceMediaType, data: body.referenceBase64 } },
          { type: 'text', text: `Contexto: ${body.context ?? 'verificacao de identidade pra emissao de certificado'}.\nAvalie e responda JSON conforme schema.` },
        ],
      }],
    });

    const text = resp.content.map((c) => c.text).join('');
    const result = extractJson(text);
    const cost = estimateCostBrlCents(MODEL, resp.usage.input_tokens, resp.usage.output_tokens);
    const duration = Date.now() - startedAt;

    await Promise.all([
      db.update(aiJobs).set({
        status: 'completed',
        inputTokens: resp.usage.input_tokens, outputTokens: resp.usage.output_tokens,
        costBrlCents: cost, resultJson: JSON.stringify(result),
        durationMs: duration, completedAt: Math.floor(Date.now() / 1000),
      }).where(eq(aiJobs.id, jobId)),
      incrementUsage(sess.workspace.id, 'aiJobsCount', 1, cost),
    ]).catch(() => {});

    return Response.json({ ok: true, jobId, result, usage: resp.usage, costBrlCents: cost, durationMs: duration });
  } catch (e) {
    const err = (e as Error).message;
    await db.update(aiJobs).set({
      status: 'failed', errorMessage: err, durationMs: Date.now() - startedAt,
      completedAt: Math.floor(Date.now() / 1000),
    }).where(eq(aiJobs.id, jobId)).catch(() => {});
    return Response.json({ ok: false, error: err, jobId }, { status: 500 });
  }
}
