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
      // Sprint 19 FINAL FIX: passar schema inteiro (Drizzle exporta variaveis
      // pluralizadas: users, sessions, accounts, verifications). Better Auth
      // usa modelName ('users'/'sessions'/...) pra lookup.
      // Antes: schema:{ user: ... } com modelName:'users' → adapter procurava
      // schema['users'] e nao encontrava (so tinha 'user').
      schema: {
        users: schema.users,
        sessions: schema.sessions,
        accounts: schema.accounts,
        verifications: schema.verifications,
      },
    }),
    user: {
      modelName: 'users',
      fields: {},
    },
    account: {
      modelName: 'accounts',
    },
    verification: {
      modelName: 'verifications',
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
    // Sprint 19 hotfix: NÃO hardcoda domínio.
    // Better Auth detecta baseURL via request origin quando undefined.
    // Antes: 'https://univercert.com.br' quebrava login em pages.dev.
    baseURL: (env as any).BETTER_AUTH_URL || undefined,
    trustedOrigins: [
      'https://univercert.com.br',
      'https://univercert.pages.dev',
      'https://*.univercert.pages.dev', // preview deploys
      'http://localhost:3000',
    ],
    session: {
      modelName: 'sessions',
      expiresIn: 60 * 60 * 24 * 30,
      updateAge: 60 * 60 * 24,
      cookieCache: { enabled: true, maxAge: 5 * 60 },
      // Mapeia colunas antigas → nomes esperados pelo Better Auth
      fields: {
        ipAddress: 'ipAddress',
        userAgent: 'userAgent',
        expiresAt: 'expiresAt',
        token: 'token',
        userId: 'userId',
        createdAt: 'createdAt',
        updatedAt: 'updatedAt',
      },
    },
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
      // Sprint 19 hotfix DEBUG: bubble errors → handler em route.ts captura e expõe.
      // Voltar pra false depois de consertar o signup.
      throw: true,
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
