// UniverCert · Better Auth handler (todas as rotas /api/auth/*)

import { getAuth } from '@/lib/auth';

export const runtime = 'edge';

async function handler(request: Request) {
  const auth = getAuth();
  return auth.handler(request);
}

export { handler as GET, handler as POST };
