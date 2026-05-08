// UniverCert · webhook Fluent Community (UniverHair usa)
// Disparado quando aluno completa um curso na Fluent.
// HMAC obrigatório se integration tiver webhook_secret configurado.
//
// URL config no Fluent: https://univercert.com.br/api/webhooks/fluent?ws=univerhair
//
// Payload esperado (formato canônico que UniverHair vai postar do plugin WP):
// {
//   "event": "course.completed",
//   "course": { "name": "Coloração Avançada", "hours": 80 },
//   "student": { "name": "Maria Silva", "email": "maria@x.com", "cpf": "12345678900", "phone": "5511..." }
// }

import { processWebhook, getWebhookSecret, resolveWorkspaceFromQuery } from '@/lib/webhook-handler';
import { verifyHmacSha256 } from '@/lib/hmac';

export const runtime = 'edge';

export async function POST(request: Request) {
  const url = new URL(request.url);
  const wsSlug = await resolveWorkspaceFromQuery(url.searchParams);
  if (!wsSlug) {
    return Response.json({ error: 'workspace_query_param_required (?ws=slug)' }, { status: 400 });
  }

  const rawBody = await request.text();
  const sig = request.headers.get('x-fluent-signature') ?? request.headers.get('x-signature') ?? '';

  // Valida HMAC se houver secret configurado pra essa workspace
  const secret = await getWebhookSecret(wsSlug, 'fluent');
  if (secret) {
    const valid = await verifyHmacSha256(rawBody, sig, secret);
    if (!valid) return Response.json({ error: 'invalid_signature' }, { status: 401 });
  }

  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return Response.json({ error: 'invalid_json' }, { status: 400 });
  }

  const courseName = payload?.course?.name ?? payload?.course_name;
  const studentEmail = payload?.student?.email ?? payload?.email;
  if (!courseName || !studentEmail) {
    return Response.json({ error: 'missing_required_fields', expected: ['course.name', 'student.email'] }, { status: 400 });
  }

  const result = await processWebhook('fluent', rawBody, {
    workspaceSlug: wsSlug,
    courseName,
    courseHours: payload?.course?.hours ?? payload?.course_hours,
    student: {
      name: payload?.student?.name ?? payload?.name ?? studentEmail,
      email: studentEmail,
      cpf: payload?.student?.cpf ?? payload?.cpf,
      phone: payload?.student?.phone ?? payload?.phone ?? payload?.whatsapp,
    },
    externalRef: payload?.event_id ?? payload?.id,
  });

  if (!result.ok) {
    return Response.json({ error: result.error }, { status: result.status });
  }
  return Response.json({ ok: true, request_id: result.requestId });
}
