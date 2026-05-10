// UniverCert · POST /api/v1/ai/suggest-improvements (S28)
// Input: { layoutJson } → output: critica + sugestoes priorizadas

import { eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { aiJobs } from '@/db/schema';
import { ID } from '@/lib/ulid';
import { requireRole, RbacError } from '@/lib/rbac';
import { callClaude, extractJson, estimateCostBrlCents, type ClaudeModel } from '@/lib/ai-client';

export const runtime = 'edge';

const MODEL: ClaudeModel = 'claude-haiku-4-5-20251001';

const SYSTEM_PROMPT = `Você é design critic especialista em certificados. Analisa layoutJson V2 e retorna criticas + sugestoes acionaveis.

RESPONDA JSON puro:
{
  "score": 0-100,
  "summary": "string curta",
  "issues": [
    { "severity": "critical"|"warning"|"info", "field_id"?: "string", "message": "string", "fix"?: "string" }
  ],
  "suggestions": [
    { "category": "typography"|"spacing"|"hierarchy"|"color"|"qr"|"branding", "title": "string", "rationale": "string", "impact": "high"|"medium"|"low" }
  ],
  "missing_required": ["string"]
}

CHECKLIST:
- QR de verificacao presente e visivel? (kind:"qr" >= 100x100)
- Nome do aluno em destaque (>=40px)?
- Hierarquia tipografica clara (3+ niveis)?
- Espacamento confortavel?
- Contraste suficiente?
- Carga horaria + data presentes?
- Cores combinam (max 3 cores principais)?`;

export async function POST(req: Request) {
  let sess;
  try {
    sess = await requireRole('editor');
  } catch (e) {
    if (e instanceof RbacError) return Response.json({ ok: false, error: e.code }, { status: e.code === 'UNAUTHENTICATED' ? 401 : 403 });
    throw e;
  }

  const body = await req.json().catch(() => ({})) as { layoutJson?: any; templateName?: string };
  if (!body.layoutJson) return Response.json({ ok: false, error: 'layoutJson obrigatorio' }, { status: 400 });

  const db = getDb();
  const jobId = ID.aiJob();
  const startedAt = Date.now();

  await db.insert(aiJobs).values({
    id: jobId,
    workspaceId: sess.workspace.id,
    userId: sess.user.id,
    jobType: 'suggest_improvements',
    model: MODEL,
    status: 'pending',
    inputSummary: (body.templateName ?? 'template').slice(0, 120),
  });

  try {
    const resp = await callClaude({
      model: MODEL,
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [{
        role: 'user',
        content: `Template: ${body.templateName ?? 'sem nome'}\nLayoutJson:\n${JSON.stringify(body.layoutJson, null, 2)}\n\nAnalise e retorne JSON.`,
      }],
      temperature: 0.4,
    });

    const text = resp.content.map((c) => c.text).join('');
    const review = extractJson(text);
    const cost = estimateCostBrlCents(MODEL, resp.usage.input_tokens, resp.usage.output_tokens);
    const duration = Date.now() - startedAt;

    await db.update(aiJobs).set({
      status: 'completed',
      inputTokens: resp.usage.input_tokens, outputTokens: resp.usage.output_tokens,
      costBrlCents: cost, resultJson: JSON.stringify(review),
      durationMs: duration, completedAt: Math.floor(Date.now() / 1000),
    }).where(eq(aiJobs.id, jobId)).catch(() => {});

    return Response.json({ ok: true, jobId, review, usage: resp.usage, costBrlCents: cost, durationMs: duration });
  } catch (e) {
    const err = (e as Error).message;
    await db.update(aiJobs).set({
      status: 'failed', errorMessage: err, durationMs: Date.now() - startedAt,
      completedAt: Math.floor(Date.now() / 1000),
    }).where(eq(aiJobs.id, jobId)).catch(() => {});
    return Response.json({ ok: false, error: err, jobId }, { status: 500 });
  }
}
