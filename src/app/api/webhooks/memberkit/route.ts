// UniverCert · webhook Memberkit (módulo concluído)
// Sprint 4: implementar verificação + criação de request

export const runtime = 'edge';

export async function POST(request: Request) {
  const payload = await request.json().catch(() => ({}));
  // TODO Sprint 4
  console.log('[memberkit webhook] received', payload);
  return Response.json({ ok: true, todo: 'sprint_4' });
}
