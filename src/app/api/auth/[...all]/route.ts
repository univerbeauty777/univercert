// UniverCert · auth handler (placeholder Sprint 0)
// Sprint 1: implementar com Better Auth.

export const runtime = 'edge';

export async function GET() {
  return Response.json({ error: 'auth_not_implemented_yet', sprint: 1 }, { status: 501 });
}

export async function POST() {
  return Response.json({ error: 'auth_not_implemented_yet', sprint: 1 }, { status: 501 });
}
