// UniverCert · GET /api/v1/credentials/[id]/wallet/google (S56)
// Gera Save to Google Wallet URL com JWT RS256 assinado.

import { eq } from 'drizzle-orm';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { getDb } from '@/db/client';
import { credentials, recipients, workspaces, shareEvents } from '@/db/schema';
import { ID } from '@/lib/ulid';
import { signGoogleWalletJwt, googleWalletSaveUrl } from '@/lib/google-wallet';

export const runtime = 'edge';

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const { env } = getRequestContext();
  const issuerId = (env as any).GOOGLE_WALLET_ISSUER_ID;
  const saEmail = (env as any).GOOGLE_WALLET_SA_EMAIL;
  const privateKey = (env as any).GOOGLE_WALLET_SA_PRIVATE_KEY;

  if (!issuerId || !saEmail || !privateKey) {
    return Response.json({
      ok: false,
      error: 'google_wallet_not_configured',
      message: 'Configure GOOGLE_WALLET_ISSUER_ID + GOOGLE_WALLET_SA_EMAIL + GOOGLE_WALLET_SA_PRIVATE_KEY (PEM PKCS8) no Cloudflare Pages env vars.',
      setup_url: 'https://developers.google.com/wallet/generic',
    }, { status: 501 });
  }

  const db = getDb();
  const [cred] = await db.select().from(credentials).where(eq(credentials.id, id)).limit(1);
  if (!cred) return Response.json({ ok: false, error: 'cert nao encontrado' }, { status: 404 });

  const [rcp] = await db.select().from(recipients).where(eq(recipients.id, cred.recipientId)).limit(1);
  const [ws] = await db.select().from(workspaces).where(eq(workspaces.id, cred.workspaceId)).limit(1);

  const baseUrl = new URL(req.url).origin;
  const verifyUrl = `${baseUrl}/v/${cred.id}`;
  const issuedISO = new Date((cred.issuedAt ?? Math.floor(Date.now() / 1000)) * 1000).toISOString().slice(0, 10);

  const classId = `${issuerId}.univercert_v1`;
  const objectId = `${issuerId}.${cred.id}`;

  try {
    const jwt = await signGoogleWalletJwt({
      saEmail,
      privateKeyPem: privateKey,
      issuerId,
      classId,
      objectId,
      cert: {
        recipientName: rcp?.name ?? 'Aluno',
        courseName: cred.courseName,
        issueDateISO: issuedISO,
        issuerName: ws?.name ?? 'UniverCert',
        verifyUrl,
        credentialId: cred.id,
        hours: cred.courseHours ?? undefined,
      },
    });

    const saveUrl = googleWalletSaveUrl(jwt);

    // Track share event
    db.insert(shareEvents).values({
      id: ID.shareEvent(),
      credentialId: cred.id,
      workspaceId: cred.workspaceId,
      channel: 'wallet_google',
    }).catch(() => {});

    return Response.redirect(saveUrl, 302);
  } catch (e) {
    return Response.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}
