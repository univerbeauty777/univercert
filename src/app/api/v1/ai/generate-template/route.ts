// UniverCert · POST /api/v1/ai/generate-template (S28)
// Input: { courseName, courseDescription?, style?, hours? } → output: layoutJson V2 completo

import { eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { aiJobs } from '@/db/schema';
import { ID } from '@/lib/ulid';
import { requireRole, RbacError } from '@/lib/rbac';
import { callClaude, extractJson, estimateCostBrlCents, type ClaudeModel } from '@/lib/ai-client';

export const runtime = 'edge';

const MODEL: ClaudeModel = 'claude-haiku-4-5-20251001';

const SYSTEM_PROMPT = `Você é um designer especialista em certificados digitais brasileiros. Recebe descrição de curso e gera layoutJson V2 completo pra UniverCert.

Schema obrigatório:
{
  "version": 2,
  "page": { "size": "A4_landscape", "width": 1123, "height": 794 },
  "background": { "kind": "color", "color": "#FFF8E7" },
  "fields": [
    { "id": "string-unico", "kind": "text" | "qr" | "image",
      "x": number, "y": number, "width": number, "height": number,
      "text"?: "string com {{nome_aluno}} {{curso}} {{data}} {{horas}}",
      "fontFamily"?: "string", "fontSize"?: number, "fontWeight"?: "normal"|"bold",
      "color"?: "#hex", "align"?: "left"|"center"|"right",
      "letterSpacing"?: number, "lineHeight"?: number, "italic"?: boolean
    }
  ]
}

REGRAS:
1. Sempre incluir QR de verificação (kind:"qr") em canto inferior, x~950 y~620 size 120
2. Nome do aluno em destaque (~48-64px, color #1B2D5E ou similar)
3. Nome do curso médio (~28-36px)
4. Carga horária + data em rodapé (~14-16px)
5. Cores devem combinar com tema do curso (estética=rose, tech=navy, beleza=gold)
6. Coordenadas em pixels (page.width × page.height)
7. Retornar APENAS JSON puro, sem markdown, sem prefixo explicativo`;

export async function POST(req: Request) {
  let sess;
  try {
    sess = await requireRole('editor');
  } catch (e) {
    if (e instanceof RbacError) return Response.json({ ok: false, error: e.code }, { status: e.code === 'UNAUTHENTICATED' ? 401 : 403 });
    throw e;
  }

  const body = await req.json().catch(() => ({})) as {
    courseName?: string;
    courseDescription?: string;
    style?: string;
    hours?: number;
  };

  if (!body.courseName?.trim()) {
    return Response.json({ ok: false, error: 'courseName obrigatorio' }, { status: 400 });
  }

  const db = getDb();
  const jobId = ID.aiJob();
  const startedAt = Date.now();

  await db.insert(aiJobs).values({
    id: jobId,
    workspaceId: sess.workspace.id,
    userId: sess.user.id,
    jobType: 'generate_template',
    model: MODEL,
    status: 'pending',
    inputSummary: body.courseName.slice(0, 120),
  });

  const userPrompt = `Curso: ${body.courseName}
${body.courseDescription ? `Descrição: ${body.courseDescription}\n` : ''}${body.hours ? `Carga horária: ${body.hours}h\n` : ''}${body.style ? `Estilo desejado: ${body.style}\n` : ''}
Gere o layoutJson V2 completo. Retorne APENAS o JSON, sem markdown.`;

  try {
    const resp = await callClaude({
      model: MODEL,
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
      temperature: 0.7,
    });

    const text = resp.content.map((c) => c.text).join('');
    const layout = extractJson(text);
    const cost = estimateCostBrlCents(MODEL, resp.usage.input_tokens, resp.usage.output_tokens);
    const duration = Date.now() - startedAt;

    await db.update(aiJobs).set({
      status: 'completed',
      inputTokens: resp.usage.input_tokens,
      outputTokens: resp.usage.output_tokens,
      costBrlCents: cost,
      resultJson: JSON.stringify(layout),
      durationMs: duration,
      completedAt: Math.floor(Date.now() / 1000),
    }).where(eq(aiJobs.id, jobId)).catch(() => {});

    return Response.json({ ok: true, jobId, layout, usage: resp.usage, costBrlCents: cost, durationMs: duration });
  } catch (e) {
    const err = (e as Error).message;
    await db.update(aiJobs).set({
      status: 'failed',
      errorMessage: err,
      durationMs: Date.now() - startedAt,
      completedAt: Math.floor(Date.now() / 1000),
    }).where(eq(aiJobs.id, jobId)).catch(() => {});
    return Response.json({ ok: false, error: err, jobId }, { status: 500 });
  }
}
