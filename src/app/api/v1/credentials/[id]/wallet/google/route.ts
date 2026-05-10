// UniverCert · GET /api/v1/credentials/[id]/wallet/google (S26)
// Gera Google Wallet pass JWT URL on-demand.
//
// SETUP REQUIRED:
// 1. Google Cloud project + Wallet API habilitada
// 2. Service Account JSON com escopo wallet_object.issuer
// 3. Issuer ID registrado no Google Wallet Business Console
// 4. Env vars: GOOGLE_WALLET_ISSUER_ID, GOOGLE_WALLET_SA_JSON_BASE64
//
// JWT precisa ser signed com RS256 usando a private key do SA.
// Stub abaixo retorna 501 ate setup pronto.

import { eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { credentials, shareEvents } from '@/db/schema';
import { ID } from '@/lib/ulid';

export const runtime = 'edge';

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  // @ts-expect-error - runtime env
  const env = (req as any).cf ? (await import('@cloudflare/next-on-pages')).getRequestContext().env : {};

  if (!env.GOOGLE_WALLET_ISSUER_ID || !env.GOOGLE_WALLET_SA_JSON_BASE64) {
    return Response.json(
      {
        ok: false,
        error: 'google_wallet_not_configured',
        message: 'Configure GOOGLE_WALLET_ISSUER_ID + GOOGLE_WALLET_SA_JSON_BASE64 no Cloudflare Pages env vars.',
        setup_url: 'https://developers.google.com/wallet/generic',
        wave: 'S26 — JWT signing pendente',
      },
      { status: 501 },
    );
  }

  // Log share intent
  const db = getDb();
  const [cred] = await db.select().from(credentials).where(eq(credentials.id, id)).limit(1);
  if (cred) {
    await db.insert(shareEvents).values({
      id: ID.shareEvent(),
      credentialId: cred.id,
      workspaceId: cred.workspaceId,
      channel: 'wallet_google',
    }).catch(() => {});
  }

  return Response.json({ ok: false, error: 'google_wallet_jwt_not_wired_yet' }, { status: 501 });
}
