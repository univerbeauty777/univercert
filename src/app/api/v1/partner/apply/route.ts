// UniverCert · POST /api/v1/partner/apply (S45)

import { getDb } from '@/db/client';
import { partnerApplications } from '@/db/schema';
import { ID } from '@/lib/ulid';

export const runtime = 'edge';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({})) as {
    userEmail?: string; fullName?: string; audienceSize?: number;
    niche?: string; channels?: string[]; motivation?: string;
  };

  if (!body.userEmail || !body.fullName) {
    return Response.json({ ok: false, error: 'userEmail + fullName obrigatorios' }, { status: 400 });
  }
  if (!/^[^@]+@[^@]+\.[^@]+$/.test(body.userEmail)) {
    return Response.json({ ok: false, error: 'email invalido' }, { status: 400 });
  }

  const db = getDb();
  const id = ID.partnerApp();
  await db.insert(partnerApplications).values({
    id,
    userEmail: body.userEmail.toLowerCase().trim(),
    fullName: body.fullName.trim().slice(0, 80),
    audienceSize: body.audienceSize ?? null,
    niche: body.niche?.slice(0, 60) ?? null,
    channelsJson: body.channels?.length ? JSON.stringify(body.channels) : null,
    motivation: body.motivation?.slice(0, 1000) ?? null,
    status: 'pending',
  });

  return Response.json({
    ok: true,
    id,
    message: 'Aplicação recebida! Resposta em até 5 dias úteis no email informado.',
  });
}
