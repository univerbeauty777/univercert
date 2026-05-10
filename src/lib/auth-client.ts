// UniverCert · Better Auth client (browser side)

import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
  baseURL:
    typeof window !== 'undefined'
      ? window.location.origin
      : 'https://univercert.net',
});

export const { signIn, signUp, signOut, useSession } = authClient;
