// UniverCert · Better Auth handler (rotas /api/auth/*)

import { getAuth } from '@/lib/auth';

export const runtime = 'edge';

async function handler(request: Request) {
  const auth = getAuth();
  return auth.handler(request);
}

export const GET = handler;
export const POST = handler;
