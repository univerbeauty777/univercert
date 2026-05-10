// UniverCert · POST /api/v1/ai/extract-document (S47)
// Claude vision extrai dados de RG/CNH/CPF/passaporte. Retorna campos estruturados.

import { eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { aiJobs } from '@/db/schema';
import { ID } from '@/lib/ulid';
import { requireRole, RbacError } from '@/lib/rbac';
import { callClaude, extractJson, estimateCostBrlCents, type ClaudeModel } from '@/lib/ai-client';
import { checkAiLimit, incrementUsage } from '@/lib/plan-limits';

export const runtime = 'edge';

const MODEL: ClaudeModel = 'claude-haiku-4-5-20251001';

const SYSTEM_PROMPT = `Você é um OCR/extrator de dados de documentos brasileiros.

Recebe foto de RG, CNH, CPF, comprovante de matrícula ou passaporte e retorna JSON puro com:

{
  "document_type": "rg" | "cnh" | "cpf" | "passport" | "matricula" | "unknown",
  "confidence": 0-100,
  "fields": {
    "full_name": "string ou null",
    "cpf": "string formato '000.000.000-00' ou null",
    "rg": "string ou null",
    "birth_date": "YYYY-MM-DD ou null",
    "mother_name": "string ou null",
    "father_name": "string ou null",
    "expiry_date": "YYYY-MM-DD ou null",
    "issue_date": "YYYY-MM-DD ou null",
    "passport_number": "string ou null",
    "nationality": "BR/US/etc ou null"
  },
  "warnings": ["array de strings com problemas detectados"],
  "is_authentic_likely": true | false,
  "ai_generated_likelihood": 0-100
}

REGRAS:
- Se foto borrada/recortada/escura, confidence < 50 e adicionar warning
- Se documento parece editado/photoshop, is_authentic_likely=false e flag em warnings
- CPF formatado obrigatório se detectado (000.000.000-00)
- Datas em ISO YYYY-MM-DD
- Se nao encontra um campo, null (NUNCA inventa)
- Retorne APENAS JSON puro, sem markdown`;

export async function POST(req: Request) {
  let sess;
  try {
    sess = await requireRole('aprovador');
  } catch (e) {
    if (e instanceof RbacError) return Response.json({ ok: false, error: e.code }, { status: e.code === 'UNAUTHENTICATED' ? 401 : 403 });
    throw e;
  }

  // Plan limit AI
  const limitCheck = await checkAiLimit(sess.workspace.id);
  if (!limitCheck.ok) {
    return Response.json({ ok: false, error: limitCheck.reason, message: limitCheck.message, plan: limitCheck.plan, upgradeUrl: '/billing' }, { status: 402 });
  }

  const body = await req.json().catch(() => ({})) as { imageBase64?: string; mediaType?: string };
  if (!body.imageBase64 || !body.mediaType) {
    return Response.json({ ok: false, error: 'imageBase64 + mediaType obrigatorios' }, { status: 400 });
  }
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(body.mediaType)) {
    return Response.json({ ok: false, error: 'mediaType invalido' }, { status: 400 });
  }
  // Tamanho max ~5MB base64 (Claude vision tem limit por foto)
  if (body.imageBase64.length > 7_500_000) {
    return Response.json({ ok: false, error: 'imagem muito grande (max ~5MB)' }, { status: 413 });
  }

  const db = getDb();
  const jobId = ID.aiJob();
  const startedAt = Date.now();

  await db.insert(aiJobs).values({
    id: jobId,
    workspaceId: sess.workspace.id,
    userId: sess.user.id,
    jobType: 'extract_document',
    model: MODEL,
    status: 'pending',
    inputSummary: 'document extraction',
  });

  try {
    const resp = await callClaude({
      model: MODEL,
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: body.mediaType, data: body.imageBase64 } },
          { type: 'text', text: 'Extraia os dados desse documento. Retorne JSON conforme schema.' },
        ],
      }],
    });

    const text = resp.content.map((c) => c.text).join('');
    const extraction = extractJson(text);
    const cost = estimateCostBrlCents(MODEL, resp.usage.input_tokens, resp.usage.output_tokens);
    const duration = Date.now() - startedAt;

    await Promise.all([
      db.update(aiJobs).set({
        status: 'completed',
        inputTokens: resp.usage.input_tokens,
        outputTokens: resp.usage.output_tokens,
        costBrlCents: cost,
        resultJson: JSON.stringify(extraction),
        durationMs: duration,
        completedAt: Math.floor(Date.now() / 1000),
      }).where(eq(aiJobs.id, jobId)),
      incrementUsage(sess.workspace.id, 'aiJobsCount', 1, cost),
    ]).catch(() => {});

    return Response.json({ ok: true, jobId, extraction, usage: resp.usage, costBrlCents: cost, durationMs: duration });
  } catch (e) {
    const err = (e as Error).message;
    await db.update(aiJobs).set({
      status: 'failed', errorMessage: err, durationMs: Date.now() - startedAt,
      completedAt: Math.floor(Date.now() / 1000),
    }).where(eq(aiJobs.id, jobId)).catch(() => {});
    return Response.json({ ok: false, error: err, jobId }, { status: 500 });
  }
}
