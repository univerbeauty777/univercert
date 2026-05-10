// UniverCert · GET /api/v1/credentials/[id]/wallet/apple (S55)
// Gera Apple Wallet .pkpass via worker dedicado (signing externo).

import { eq } from 'drizzle-orm';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { getDb } from '@/db/client';
import { credentials, recipients, workspaces, shareEvents } from '@/db/schema';
import { ID } from '@/lib/ulid';
import { generateSignedPkpass } from '@/lib/apple-wallet';

export const runtime = 'edge';

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const { env } = getRequestContext();

  const passTypeId = (env as any).APPLE_WALLET_PASS_TYPE_ID;
  const teamId = (env as any).APPLE_WALLET_TEAM_ID;
  const workerUrl = (env as any).APPLE_PASS_SIGNING_WORKER_URL;
  const workerSecret = (env as any).APPLE_PASS_SIGNING_WORKER_SECRET;

  if (!passTypeId || !teamId || !workerUrl || !workerSecret) {
    return Response.json(
      {
        ok: false,
        error: 'apple_wallet_not_configured',
        message: 'Configure APPLE_WALLET_PASS_TYPE_ID + APPLE_WALLET_TEAM_ID + APPLE_PASS_SIGNING_WORKER_URL + APPLE_PASS_SIGNING_WORKER_SECRET. Worker dedicado faz signing PKCS#7 do manifest.',
        setup_docs: 'https://developer.apple.com/wallet/',
        worker_template: 'https://github.com/walletpasses/passkit-generator (deploy como Worker separado)',
      },
      { status: 501 },
    );
  }

  const db = getDb();
  const [cred] = await db.select().from(credentials).where(eq(credentials.id, id)).limit(1);
  if (!cred) return Response.json({ ok: false, error: 'cert nao encontrado' }, { status: 404 });

  const [rcp] = await db.select().from(recipients).where(eq(recipients.id, cred.recipientId)).limit(1);
  const [ws] = await db.select().from(workspaces).where(eq(workspaces.id, cred.workspaceId)).limit(1);

  const baseUrl = new URL(req.url).origin;
  const issuedISO = new Date((cred.issuedAt ?? Math.floor(Date.now() / 1000)) * 1000).toISOString().slice(0, 10);

  try {
    const pkpass = await generateSignedPkpass({
      workerUrl,
      workerSecret,
      passData: {
        passTypeIdentifier: passTypeId,
        teamIdentifier: teamId,
        serialNumber: cred.id,
        organizationName: ws?.name ?? 'UniverCert',
        description: `Certificado de ${cred.courseName}`,
        recipientName: rcp?.name ?? 'Aluno',
        courseName: cred.courseName,
        issuerName: ws?.name ?? 'UniverCert',
        issueDateISO: issuedISO,
        verifyUrl: `${baseUrl}/v/${cred.id}`,
        credentialId: cred.id,
        hours: cred.courseHours ?? undefined,
        primaryColor: 'rgb(27, 45, 94)',
      },
    });

    db.insert(shareEvents).values({
      id: ID.shareEvent(),
      credentialId: cred.id,
      workspaceId: cred.workspaceId,
      channel: 'wallet_apple',
    }).catch(() => {});

    return new Response(pkpass, {
      headers: {
        'content-type': 'application/vnd.apple.pkpass',
        'content-disposition': `attachment; filename="${cred.id}.pkpass"`,
        'cache-control': 'private, no-cache',
      },
    });
  } catch (e) {
    return Response.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}
