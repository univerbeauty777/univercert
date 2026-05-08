// UniverCert · webhook Fluent Community
// Disparado quando aluno completa um curso na Fluent.
// Cria automaticamente uma certificate_request pendente.

import { eq, and } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { workspaces, integrations, recipients, certificateRequests, webhooksIn } from '@/db/schema';
import { ID } from '@/lib/ulid';

export const runtime = 'edge';

export async function POST(request: Request) {
  const db = getDb();
  const payload = await request.json().catch(() => ({}));

  // Esperado: { workspace_slug, course_name, course_hours, student: { name, email, cpf?, phone? } }
  const { workspace_slug, course_name, course_hours, student } = payload as any;

  if (!workspace_slug || !course_name || !student?.email) {
    return new Response(JSON.stringify({ error: 'invalid_payload' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  const [ws] = await db.select().from(workspaces).where(eq(workspaces.slug, workspace_slug)).limit(1);
  if (!ws) {
    return new Response(JSON.stringify({ error: 'workspace_not_found' }), { status: 404 });
  }

  // TODO: validar HMAC do header X-Fluent-Signature

  // Log do webhook bruto (para auditoria)
  const webhookId = ID.webhookIn();
  await db.insert(webhooksIn).values({
    id: webhookId,
    workspaceId: ws.id,
    provider: 'fluent',
    rawPayloadJson: JSON.stringify(payload),
    status: 'received',
  });

  // Upsert recipient (por email + workspace)
  const existing = await db
    .select()
    .from(recipients)
    .where(and(eq(recipients.workspaceId, ws.id), eq(recipients.email, student.email)))
    .limit(1);

  let recipientId = existing[0]?.id;
  if (!recipientId) {
    const [created] = await db
      .insert(recipients)
      .values({
        id: ID.recipient(),
        workspaceId: ws.id,
        name: student.name ?? student.email,
        email: student.email,
        cpf: student.cpf,
        phoneWhatsapp: student.phone,
      })
      .returning();
    recipientId = created.id;
  }

  // Cria a request
  const [req] = await db
    .insert(certificateRequests)
    .values({
      id: ID.request(),
      workspaceId: ws.id,
      recipientId,
      source: 'webhook',
      sourceDataJson: JSON.stringify({ provider: 'fluent', webhook_id: webhookId, raw: payload }),
      courseName: course_name,
      courseHours: course_hours,
      status: 'pending',
    })
    .returning();

  // Marca webhook como processado
  await db
    .update(webhooksIn)
    .set({ status: 'processed', processedAt: Math.floor(Date.now() / 1000) })
    .where(eq(webhooksIn.id, webhookId));

  return new Response(JSON.stringify({ ok: true, request_id: req.id }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
}
