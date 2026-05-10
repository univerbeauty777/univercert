// UniverCert · webhook Memberkit (lesson_complete event)
// Documentação: https://memberkit.com.br/help/api/webhooks
// Header: X-Memberkit-Signature (HMAC-SHA256 hex do body)
//
// URL: https://univercert.net/api/webhooks/memberkit?ws=univerhair

import { processWebhook, getWebhookSecret, resolveWorkspaceFromQuery } from '@/lib/webhook-handler';
import { verifyHmacSha256 } from '@/lib/hmac';

export const runtime = 'edge';

export async function POST(request: Request) {
  const url = new URL(request.url);
  const wsSlug = await resolveWorkspaceFromQuery(url.searchParams);
  if (!wsSlug) return Response.json({ error: 'workspace_query_param_required' }, { status: 400 });

  const rawBody = await request.text();
  const sig = request.headers.get('x-memberkit-signature') ?? '';
  const secret = await getWebhookSecret(wsSlug, 'memberkit');
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

  // Memberkit envia: { event: 'course_completed', user: {...}, course: {...} }
  if (payload?.event !== 'course_completed' && payload?.event !== 'progress.completed') {
    return Response.json({ ok: true, ignored: payload?.event });
  }

  const user = payload?.user ?? {};
  const course = payload?.course ?? payload?.classroom ?? {};

  if (!course?.name || !user?.email) {
    return Response.json({ error: 'missing_fields' }, { status: 400 });
  }

  const result = await processWebhook('memberkit', rawBody, {
    workspaceSlug: wsSlug,
    courseName: course.name,
    courseHours: course?.duration_hours,
    student: {
      name: user.name ?? user.email,
      email: user.email,
      cpf: user?.cpf ?? user?.document,
      phone: user?.phone ?? user?.whatsapp,
    },
    externalRef: payload?.id,
  });

  if (!result.ok) return Response.json({ error: result.error }, { status: result.status });
  return Response.json({ ok: true, request_id: result.requestId });
}
