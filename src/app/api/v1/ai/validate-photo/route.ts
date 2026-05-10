// UniverCert · POST /api/v1/ai/validate-photo (S28)
// Input: { imageBase64, mediaType, context? } → output: validacao detalhada (fake/blur/recorte)

import { eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { aiJobs } from '@/db/schema';
import { ID } from '@/lib/ulid';
import { requireRole, RbacError } from '@/lib/rbac';
import { callClaude, extractJson, estimateCostBrlCents, type ClaudeModel } from '@/lib/ai-client';

export const runtime = 'edge';

const MODEL: ClaudeModel = 'claude-haiku-4-5-20251001';

const SYSTEM_PROMPT = `Você é um analista forense de imagens. Recebe foto enviada por aluno (selfie ou comprovante)
e detecta problemas de qualidade, autenticidade e conformidade.

RESPONDA EM JSON PURO, formato:
{
  "valid": true | false,
  "score": 0-100,
  "issues": ["string"],
  "warnings": ["string"],
  "recommendations": ["string"],
  "detected": {
    "is_selfie": boolean,
    "is_document": boolean,
    "is_screenshot": boolean,
    "ai_generated_likelihood": 0-100,
    "blur_score": 0-100,
    "lighting_quality": "good"|"medium"|"poor",
    "face_visible": boolean | null
  }
}

REGRAS:
- score < 60 = invalido (valid: false)
- ai_generated_likelihood > 70 = warning forte
- blur_score < 50 = recomenda nova foto
- Sem rosto em selfie = invalid`;

export async function POST(req: Request) {
  let sess;
  try {
    sess = await requireRole('aprovador');
  } catch (e) {
    if (e instanceof RbacError) return Response.json({ ok: false, error: e.code }, { status: e.code === 'UNAUTHENTICATED' ? 401 : 403 });
    throw e;
  }

  const body = await req.json().catch(() => ({})) as {
    imageBase64?: string;
    mediaType?: string;
    context?: string;
  };

  if (!body.imageBase64 || !body.mediaType) {
    return Response.json({ ok: false, error: 'imageBase64 + mediaType obrigatorios' }, { status: 400 });
  }
  if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(body.mediaType)) {
    return Response.json({ ok: false, error: `mediaType invalido: ${body.mediaType}` }, { status: 400 });
  }

  const db = getDb();
  const jobId = ID.aiJob();
  const startedAt = Date.now();

  await db.insert(aiJobs).values({
    id: jobId,
    workspaceId: sess.workspace.id,
    userId: sess.user.id,
    jobType: 'validate_photo',
    model: MODEL,
    status: 'pending',
    inputSummary: body.context?.slice(0, 120) ?? 'photo validation',
  });

  try {
    const resp = await callClaude({
      model: MODEL,
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: body.mediaType, data: body.imageBase64 } },
            { type: 'text', text: `Contexto: ${body.context ?? 'foto enviada por aluno em formulario de cert'}.\nValide e responda JSON.` },
          ],
        },
      ],
    });

    const text = resp.content.map((c) => c.text).join('');
    const validation = extractJson(text);
    const cost = estimateCostBrlCents(MODEL, resp.usage.input_tokens, resp.usage.output_tokens);
    const duration = Date.now() - startedAt;

    await db.update(aiJobs).set({
      status: 'completed',
      inputTokens: resp.usage.input_tokens,
      outputTokens: resp.usage.output_tokens,
      costBrlCents: cost,
      resultJson: JSON.stringify(validation),
      durationMs: duration,
      completedAt: Math.floor(Date.now() / 1000),
    }).where(eq(aiJobs.id, jobId)).catch(() => {});

    return Response.json({ ok: true, jobId, validation, usage: resp.usage, costBrlCents: cost, durationMs: duration });
  } catch (e) {
    const err = (e as Error).message;
    await db.update(aiJobs).set({
      status: 'failed', errorMessage: err, durationMs: Date.now() - startedAt,
      completedAt: Math.floor(Date.now() / 1000),
    }).where(eq(aiJobs.id, jobId)).catch(() => {});
    return Response.json({ ok: false, error: err, jobId }, { status: 500 });
  }
}
