// UniverCert · Better Auth configurado para D1 + Drizzle
// Doc: https://www.better-auth.com/docs/adapters/drizzle

import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { getDb } from '@/db/client';
import * as schema from '@/db/schema';

/**
 * Lazy auth instance — Better Auth precisa do DB do request context,
 * então criamos por request (Cloudflare Workers pattern).
 */
export function getAuth() {
  const db = getDb();
  return betterAuth({
    database: drizzleAdapter(db, {
      provider: 'sqlite',
      schema: {
        user: schema.users,
        session: schema.sessions,
        // Better Auth também espera `account` e `verification` — para OAuth e email confirm.
        // Adicionar nas próximas migrations:
        //   account: schema.accounts,
        //   verification: schema.verifications,
      },
    }),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false, // ativar quando Resend estiver configurado
    },
    socialProviders: {
      google: {
        clientId: process.env.GOOGLE_OAUTH_CLIENT_ID || '',
        clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET || '',
      },
    },
    secret: process.env.BETTER_AUTH_SECRET || 'dev-only-change-me',
    baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3000',
  });
}

export type Auth = ReturnType<typeof getAuth>;
