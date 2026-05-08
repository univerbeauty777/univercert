// UniverCert · Better Auth com D1 + Drizzle adapter
// Sprint 3: email/senha funcional. Google OAuth depende de GOOGLE_OAUTH_CLIENT_ID secret.

import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { drizzle } from 'drizzle-orm/d1';
import * as schema from '@/db/schema';

let cachedAuth: ReturnType<typeof betterAuth> | null = null;

export function getAuth() {
  // Cache por request — Better Auth funciona melhor sem reinstanciar
  if (cachedAuth) return cachedAuth;

  const { env } = getRequestContext();
  // @ts-expect-error - env binding
  const db = drizzle(env.DB, { schema });

  const googleClientId = (env as any).GOOGLE_OAUTH_CLIENT_ID;
  const googleClientSecret = (env as any).GOOGLE_OAUTH_CLIENT_SECRET;

  cachedAuth = betterAuth({
    database: drizzleAdapter(db, {
      provider: 'sqlite',
      schema: {
        user: schema.users,
        session: schema.sessions,
        account: schema.accounts,
        verification: schema.verifications,
      },
    }),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
      minPasswordLength: 8,
    },
    socialProviders: googleClientId && googleClientSecret
      ? {
          google: {
            clientId: googleClientId,
            clientSecret: googleClientSecret,
          },
        }
      : undefined,
    secret: (env as any).BETTER_AUTH_SECRET || 'dev-only-change-me',
    baseURL: (env as any).BETTER_AUTH_URL || 'https://univercert.com.br',
    trustedOrigins: [
      'https://univercert.com.br',
      'https://univercert.pages.dev',
      'http://localhost:3000',
    ],
  });

  return cachedAuth;
}

/**
 * Helper pra pegar session no server side.
 * Retorna null se não autenticado.
 */
export async function getSession(headers: Headers) {
  try {
    const auth = getAuth();
    const session = await auth.api.getSession({ headers });
    return session;
  } catch (e) {
    console.error('getSession failed:', e);
    return null;
  }
}
