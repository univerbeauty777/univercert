// UniverCert · Better Auth com D1 + Drizzle adapter
// Sprint 12: schema mapping fix + cookie hardening + onError logging

import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { drizzle } from 'drizzle-orm/d1';
import * as schema from '@/db/schema';
import { sendEmail } from '@/lib/resend';


// S78: HTML branded do email de reset
function resetPasswordEmailHtml(name: string, url: string): string {
  return `<!DOCTYPE html><html lang="pt-BR"><body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;"><tr><td align="center"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(15,23,42,0.08);"><tr><td style="background:linear-gradient(135deg,#1B2D5E,#0A0E1A);padding:28px 32px;"><span style="font-size:18px;font-weight:800;color:#ffffff;letter-spacing:-0.02em;">univer<span style="color:#D4A937;">CERT</span></span></td></tr><tr><td style="padding:32px;"><h1 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#0f172a;">Redefinir sua senha</h1><p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#475569;">Olá ${name}, recebemos um pedido para redefinir a senha da sua conta UniverCert. Clique no botão abaixo para criar uma nova senha:</p><table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 24px;"><tr><td style="border-radius:12px;background:linear-gradient(135deg,#1B2D5E,#06B6D4);"><a href="${url}" style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;">Redefinir senha &rarr;</a></td></tr></table><p style="margin:0 0 8px;font-size:13px;line-height:1.6;color:#94a3b8;">Este link expira em 1 hora. Se você não pediu isso, pode ignorar este email com segurança.</p><p style="margin:16px 0 0;font-size:12px;line-height:1.6;color:#cbd5e1;word-break:break-all;">Se o botão não funcionar, copie e cole: ${url}</p></td></tr><tr><td style="padding:20px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;"><p style="margin:0;font-size:12px;color:#94a3b8;">UniverCert · univercert.net</p></td></tr></table></td></tr></table></body></html>`;
}

let cachedAuth: ReturnType<typeof betterAuth> | null = null;

export function getAuth() {
  if (cachedAuth) return cachedAuth;

  const { env } = getRequestContext();
  // @ts-expect-error - env binding
  const db = drizzle(env.DB, { schema });

  const googleClientId = (env as any).GOOGLE_OAUTH_CLIENT_ID;
  const googleClientSecret = (env as any).GOOGLE_OAUTH_CLIENT_SECRET;
  const microsoftClientId = (env as any).MICROSOFT_OAUTH_CLIENT_ID;
  const microsoftClientSecret = (env as any).MICROSOFT_OAUTH_CLIENT_SECRET;
  const microsoftTenantId = (env as any).MICROSOFT_OAUTH_TENANT_ID || 'common';

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
      // S78: recuperacao de senha real via Resend
      resetPasswordTokenExpiresIn: 60 * 60,
      sendResetPassword: async ({ user, url }: { user: any; url: string }) => {
        const res = await sendEmail({
          to: user.email,
          subject: 'Redefinir sua senha · UniverCert',
          html: resetPasswordEmailHtml(user.name || user.email.split('@')[0], url),
          text: `Olá ${user.name || ''}, redefina sua senha (expira em 1h): ${url}`,
          tags: [{ name: 'category', value: 'password-reset' }],
        });
        if (!res.ok) {
          console.error('[better-auth][sendResetPassword] falhou:', res.error);
          throw new Error('Falha ao enviar email de recuperacao');
        }
      },
    },
    socialProviders: {
      ...(googleClientId && googleClientSecret
        ? { google: { clientId: googleClientId, clientSecret: googleClientSecret } }
        : {}),
      ...(microsoftClientId && microsoftClientSecret
        ? {
            microsoft: {
              clientId: microsoftClientId,
              clientSecret: microsoftClientSecret,
              tenantId: microsoftTenantId,
            },
          }
        : {}),
    } as any,
    secret: (() => {
      const s = (env as any).BETTER_AUTH_SECRET;
      if (!s || typeof s !== 'string' || s.length < 32) {
        throw new Error('BETTER_AUTH_SECRET is required (>=32 chars). Set via `wrangler secret put BETTER_AUTH_SECRET`.');
      }
      return s;
    })(),
    // Sprint 19 hotfix: NÃO hardcoda domínio.
    // Better Auth detecta baseURL via request origin quando undefined.
    // Antes: 'https://univercert.net' quebrava login em pages.dev.
    baseURL: (env as any).BETTER_AUTH_URL || undefined,
    trustedOrigins: [
      'https://univercert.net',
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
