// UniverCert · GET /api/v1/credentials/[id]/wallet/apple (S26)
// Gera Apple Wallet .pkpass on-demand.
//
// SETUP REQUIRED (uma vez por workspace ou conta UniverCert):
// 1. Apple Developer account ($99/ano)
// 2. Pass Type ID + signing certificate (.p12)
// 3. Configurar env vars: APPLE_WALLET_PASS_TYPE_ID, APPLE_WALLET_TEAM_ID,
//    APPLE_WALLET_CERT_BASE64, APPLE_WALLET_CERT_PASSWORD, APPLE_WALLET_WWDR_BASE64
// 4. Implementar signing real (PKCS#7 detached signature do manifest.json)
//
// Esse endpoint stub retorna 501 com instrucoes claras enquanto signing nao esta wireado.
// Quando setup pronto, descomentar bloco principal abaixo.

import { eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { credentials, recipients, workspaces, shareEvents } from '@/db/schema';
import { ID } from '@/lib/ulid';

export const runtime = 'edge';

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  // @ts-expect-error - runtime env binding
  const env = (req as any).cf ? (await import('@cloudflare/next-on-pages')).getRequestContext().env : {};

  const passTypeId = env.APPLE_WALLET_PASS_TYPE_ID;
  const teamId = env.APPLE_WALLET_TEAM_ID;
  if (!passTypeId || !teamId) {
    return Response.json(
      {
        ok: false,
        error: 'apple_wallet_not_configured',
        message: 'Configure APPLE_WALLET_PASS_TYPE_ID + APPLE_WALLET_TEAM_ID + cert .p12 nas env vars do Cloudflare Pages.',
        setup_url: 'https://developer.apple.com/wallet/',
        wave: 'S26 — implementacao pkpass signing pendente',
      },
      { status: 501 },
    );
  }

  // FUTURE: signing PKCS#7 + zip do .pkpass
  // const pass = buildPassJson(cred, ws, rcp);
  // const manifest = await sha1Manifest(pass, files);
  // const signature = await signManifest(manifest, env.APPLE_WALLET_CERT_BASE64, env.APPLE_WALLET_CERT_PASSWORD);
  // const pkpass = await zipPkpass(pass, manifest, signature, files);
  // log share event:
  const db = getDb();
  const [cred] = await db.select().from(credentials).where(eq(credentials.id, id)).limit(1);
  if (cred) {
    await db.insert(shareEvents).values({
      id: ID.shareEvent(),
      credentialId: cred.id,
      workspaceId: cred.workspaceId,
      channel: 'wallet_apple',
    }).catch(() => {});
  }

  return Response.json({ ok: false, error: 'pkpass_signing_not_wired_yet' }, { status: 501 });
}
