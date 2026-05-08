// UniverCert · webhook Kiwify
export const runtime = 'edge';
export async function POST(request: Request) {
  const payload = await request.json().catch(() => ({}));
  console.log('[kiwify webhook] received', payload);
  return Response.json({ ok: true, todo: 'sprint_4' });
}
