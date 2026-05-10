// UniverCert · POST /api/v1/share/track (S26)
// Registra share event de um cert (LGPD: IP hashed, UA truncado).

import { eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { credentials, shareEvents } from '@/db/schema';
import { ID } from '@/lib/ulid';
import { hashIp } from '@/lib/share-urls';
import { getClientIp } from '@/lib/rate-limit';

export const runtime = 'edge';

const VALID_CHANNELS = new Set([
  'linkedin', 'linkedin_share', 'whatsapp', 'instagram', 'twitter',
  'facebook', 'email', 'wallet_apple', 'wallet_google', 'direct', 'native_share',
]);

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({})) as { credentialId?: string; channel?: string };
    if (!body.credentialId || !body.channel) {
      return Response.json({ ok: false, error: 'credentialId + channel obrigatorios' }, { status: 400 });
    }
    if (!VALID_CHANNELS.has(body.channel)) {
      return Response.json({ ok: false, error: `canal invalido. validos: ${[...VALID_CHANNELS].join(', ')}` }, { status: 400 });
    }

    const db = getDb();
    const [cred] = await db.select().from(credentials).where(eq(credentials.id, body.credentialId)).limit(1);
    if (!cred) return Response.json({ ok: false, error: 'cert nao encontrado' }, { status: 404 });

    const ip = getClientIp(req);
    const ipHash = ip ? await hashIp(ip) : null;
    const ua = req.headers.get('user-agent')?.slice(0, 200) ?? null;
    const referer = req.headers.get('referer')?.slice(0, 200) ?? null;

    await db.insert(shareEvents).values({
      id: ID.shareEvent(),
      credentialId: cred.id,
      workspaceId: cred.workspaceId,
      channel: body.channel,
      ipHash,
      userAgent: ua,
      referer,
    });

    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}
