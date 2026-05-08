// UniverCert · Better Auth com D1 + Drizzle adapter
// Sprint 12: schema mapping fix + cookie hardening + onError logging

import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { drizzle } from 'drizzle-orm/d1';
import * as schema from '@/db/schema';

let cachedAuth: ReturnType<typeof betterAuth> | null = null;

export function getAuth() {
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
    user: {
      // Garante mapping correto entre nomes Better Auth e colunas D1
      modelName: 'users',
      fields: {
        // Campos opcionais — `image` agora existe na tabela users (migration 0005)
      },
    },
    session: {
      modelName: 'sessions',
      expiresIn: 60 * 60 * 24 * 30, // 30 dias
      updateAge: 60 * 60 * 24, // refresh sliding após 1 dia
      cookieCache: {
        enabled: true,
        maxAge: 5 * 60, // cache de 5min p/ reduzir DB hits
      },
    },
    advanced: {
      cookiePrefix: 'uc',
      useSecureCookies: true,
      defaultCookieAttributes: {
        sameSite: 'lax',
        secure: true,
        httpOnly: true,
      },
      crossSubDomainCookies: {
        enabled: false, // Sprint 12: ativar quando custom domain habilitado
      },
    },
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
      minPasswordLength: 8,
      maxPasswordLength: 128,
      autoSignIn: true,
    },
    socialProviders:
      googleClientId && googleClientSecret
        ? {
            google: {
              clientId: googleClientId,
              clientSecret: googleClientSecret,
            },
          }
        : undefined,
    secret: (env as any).BETTER_AUTH_SECRET || 'dev-only-change-me-NOT-FOR-PROD',
    baseURL: (env as any).BETTER_AUTH_URL || 'https://univercert.com.br',
    trustedOrigins: [
      'https://univercert.com.br',
      'https://univercert.pages.dev',
      'http://localhost:3000',
    ],
    // Logging defensivo — se algo quebra, sabemos qual stage falhou.
    logger: {
      disabled: false,
      level: 'error',
      log: (level: string, message: string, ...args: any[]) => {
        // eslint-disable-next-line no-console
        console.error(`[better-auth][${level}] ${message}`, ...args);
      },
    },
    onAPIError: {
      throw: false,
      onError: (err: unknown) => {
        // eslint-disable-next-line no-console
        console.error('[better-auth][api-error]', (err as Error)?.message, (err as Error)?.stack);
      },
    },
  });

  return cachedAuth;
}

export async function getSession(headers: Headers) {
  try {
    const auth = getAuth();
    const session = await auth.api.getSession({ headers });
    return session;
  } catch (e) {
    console.error('getSession failed:', (e as Error).message);
    return null;
  }
}
