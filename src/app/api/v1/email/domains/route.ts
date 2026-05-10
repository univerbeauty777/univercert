// UniverCert · /api/v1/email/domains (S61)

import { eq, desc } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { workspaceEmailDomains } from '@/db/schema';
import { ID } from '@/lib/ulid';
import { requireRole, RbacError } from '@/lib/rbac';
import { hasFeature } from '@/lib/plan-limits';
import { createResendDomain } from '@/lib/resend-domains';

export const runtime = 'edge';

export async function GET() {
  let sess;
  try { sess = await requireRole('admin'); }
  catch (e) {
    if (e instanceof RbacError) return Response.json({ ok: false, error: e.code }, { status: 401 });
    throw e;
  }
  const db = getDb();
  const rows = await db.select().from(workspaceEmailDomains)
    .where(eq(workspaceEmailDomains.workspaceId, sess.workspace.id))
    .orderBy(desc(workspaceEmailDomains.createdAt));
  return Response.json({
    ok: true,
    domains: rows.map((r) => ({
      ...r,
      records: r.recordsJson ? (() => { try { return JSON.parse(r.recordsJson!); } catch { return []; } })() : [],
    })),
  });
}

export async function POST(req: Request) {
  let sess;
  try { sess = await requireRole('admin'); }
  catch (e) {
    if (e instanceof RbacError) return Response.json({ ok: false, error: e.code }, { status: 401 });
    throw e;
  }

  if (!(await hasFeature(sess.workspace.id, 'customDomain'))) {
    return Response.json({
      ok: false, error: 'feature_not_in_plan',
      message: 'Email domain customizado disponivel a partir do plano Pro.',
      upgradeUrl: '/billing',
    }, { status: 402 });
  }

  const body = await req.json().catch(() => ({})) as { domain?: string; fromName?: string; fromEmail?: string };
  const domain = body.domain?.trim().toLowerCase();
  if (!domain || !/^[a-z0-9.-]+\.[a-z]{2,}$/.test(domain)) {
    return Response.json({ ok: false, error: 'domain invalido' }, { status: 400 });
  }

  try {
    const resendDomain = await createResendDomain(domain);
    const id = ID.emailDomain();
    const db = getDb();
    await db.insert(workspaceEmailDomains).values({
      id,
      workspaceId: sess.workspace.id,
      domain,
      fromEmail: body.fromEmail?.trim() ?? `no-reply@${domain}`,
      fromName: body.fromName?.trim() ?? sess.workspace.name,
      resendDomainId: resendDomain.id,
      status: 'pending',
      recordsJson: JSON.stringify(resendDomain.records),
    });

    return Response.json({
      ok: true,
      id,
      domain,
      records: resendDomain.records,
      instructions: 'Adicione esses registros DNS no painel do seu provedor (Cloudflare/Registro.br). Depois clique em Verificar.',
    });
  } catch (e) {
    return Response.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}
