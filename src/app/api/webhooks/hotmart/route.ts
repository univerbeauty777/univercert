// UniverCert · webhook Hotmart (compra aprovada)
// Sprint 4: implementar verificação HMAC + criação de request

export const runtime = 'edge';

export async function POST(request: Request) {
  const payload = await request.json().catch(() => ({}));
  // TODO Sprint 4: validar X-Hotmart-Signature, criar request
  console.log('[hotmart webhook] received', payload);
  return Response.json({ ok: true, todo: 'sprint_4' });
}
