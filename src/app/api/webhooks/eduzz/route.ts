// UniverCert · webhook Eduzz
export const runtime = 'edge';
export async function POST(request: Request) {
  const payload = await request.json().catch(() => ({}));
  console.log('[eduzz webhook] received', payload);
  return Response.json({ ok: true, todo: 'sprint_4' });
}
