// UniverCert · API v1 (Hono · catch-all em /api/v1/*)

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { handle } from 'hono/vercel';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { certificateRequests, recipients, workspaces, credentials } from '@/db/schema';
import { ID } from '@/lib/ulid';
import { isValidCPF, cleanCPF } from '@/lib/cpf';
import { issueCredentialFromRequest, rejectRequest } from '@/lib/credentials';
import { renderCertificateHtml } from '@/lib/cert-template';
import { renderPdfFromHtml } from '@/lib/render-pdf';
import { notifyRecipient } from '@/lib/notify';
import { buildOpenBadge } from '@/lib/openbadge';

export const runtime = 'edge';

const app = new Hono().basePath('/api/v1');

app.use('*', cors());

app.get('/', (c) =>
  c.json({
    name: 'UniverCert API',
    version: '0.5.0',
    docs: 'https://developer.univercert.com.br',
    sprints_completed: ['S0', 'S1', 'S1.5', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7'],
  }),
);

// ----------------------------------------
// POST /api/v1/requests
// ----------------------------------------
const requestSchema = z.object({
  workspace_slug: z.string().min(1),
  source: z.enum(['form', 'webhook', 'manual', 'csv']).default('form'),
  curso: z.string().min(1),
  nome: z.string().min(2),
  cpf: z.string().refine((v) => isValidCPF(v), 'CPF inválido'),
  email: z.string().email(),
  whatsapp: z.string().min(8),
  data_conclusao: z.string(),
  turma: z.string().optional(),
  carga_horaria: z.coerce.number().optional(),
  lgpd_consent: z.string().optional(),
});

app.post('/requests', async (c) => {
  let raw: any;
  const ct = c.req.header('content-type') ?? '';
  try {
    if (ct.includes('application/json')) {
      raw = await c.req.json();
    } else {
      const fd = await c.req.formData();
      raw = Object.fromEntries(fd.entries());
    }
  } catch {
    return c.json({ error: 'invalid_body' }, 400);
  }

  const parsed = requestSchema.safeParse(raw);
  if (!parsed.success) {
    return c.json({ error: 'validation', issues: parsed.error.issues }, 400);
  }
  const data = parsed.data;
  const db = getDb();

  const [ws] = await db.select().from(workspaces).where(eq(workspaces.slug, data.workspace_slug)).limit(1);
  if (!ws) return c.json({ error: 'workspace_not_found' }, 404);

  const cpf = cleanCPF(data.cpf);

  const [recipient] = await db
    .insert(recipients)
    .values({
      id: ID.recipient(),
      workspaceId: ws.id,
      cpf,
      name: data.nome,
      email: data.email,
      phoneWhatsapp: data.whatsapp,
      lgpdConsentAt: data.lgpd_consent ? Math.floor(Date.now() / 1000) : null,
    })
    .returning();

  const [request] = await db
    .insert(certificateRequests)
    .values({
      id: ID.request(),
      workspaceId: ws.id,
      recipientId: recipient.id,
      source: data.source,
      sourceDataJson: JSON.stringify({ turma: data.turma, data_conclusao: data.data_conclusao }),
      courseName: data.curso,
      courseHours: data.carga_horaria,
      status: 'pending',
    })
    .returning();

  if (ct.includes('application/json')) {
    return c.json({ ok: true, request_id: request.id, status: request.status }, 201);
  }
  return c.redirect(`/uh/obrigado?id=${request.id}`, 303);
});

// ----------------------------------------
// POST /api/v1/requests/:id/approve
// ----------------------------------------
app.post('/requests/:id/approve', async (c) => {
  const id = c.req.param('id');
  try {
    const result = await issueCredentialFromRequest(id, null);
    if (!result.alreadyEmitted) {
      c.executionCtx.waitUntil?.(notifyRecipient(result.credential.id).catch(() => {}));
    }
    return c.json({ ok: true, credential_id: result.credential.id, already_emitted: result.alreadyEmitted });
  } catch (e) {
    return c.json({ ok: false, error: (e as Error).message }, 400);
  }
});

app.post('/requests/:id/reject', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json().catch(() => ({}));
  const reason = body.reason ?? 'Sem motivo informado';
  try {
    await rejectRequest(id, reason, null);
    return c.json({ ok: true });
  } catch (e) {
    return c.json({ ok: false, error: (e as Error).message }, 400);
  }
});

// ----------------------------------------
// GET /api/v1/credentials/:id/pdf
// ----------------------------------------
app.get('/credentials/:id/pdf', async (c) => {
  const id = c.req.param('id');
  const db = getDb();
  const [row] = await db
    .select({ credential: credentials, recipient: recipients, workspace: workspaces })
    .from(credentials)
    .leftJoin(recipients, eq(credentials.recipientId, recipients.id))
    .leftJoin(workspaces, eq(credentials.workspaceId, workspaces.id))
    .where(eq(credentials.id, id))
    .limit(1);

  if (!row || !row.credential) return c.json({ error: 'not_found' }, 404);
  if (row.credential.revokedAt) return c.json({ error: 'revoked' }, 410);

  const html = renderCertificateHtml({
    recipientName: row.recipient?.name ?? '(sem nome)',
    cpf: row.recipient?.cpf ?? null,
    courseName: row.credential.courseName,
    courseHours: row.credential.courseHours,
    issuedAt: row.credential.issuedAt,
    credentialId: row.credential.id,
    workspaceName: row.workspace?.name ?? 'UniverCert',
    verifyUrl: `https://univercert.com.br/v/${row.credential.id}`,
  });

  try {
    const pdf = await renderPdfFromHtml(html);
    return new Response(pdf, {
      headers: {
        'content-type': 'application/pdf',
        'content-disposition': `inline; filename="certificado-${row.credential.id}.pdf"`,
        'cache-control': 'public, max-age=3600',
      },
    });
  } catch {
    return new Response(html, {
      headers: { 'content-type': 'text/html; charset=utf-8' },
    });
  }
});

// ----------------------------------------
// GET /api/v1/credentials/:id/openbadge.json — Open Badges 3.0 JSON-LD
// ----------------------------------------
app.get('/credentials/:id/openbadge.json', async (c) => {
  const id = c.req.param('id');
  const db = getDb();
  const [row] = await db
    .select({ credential: credentials, recipient: recipients, workspace: workspaces })
    .from(credentials)
    .leftJoin(recipients, eq(credentials.recipientId, recipients.id))
    .leftJoin(workspaces, eq(credentials.workspaceId, workspaces.id))
    .where(eq(credentials.id, id))
    .limit(1);

  if (!row || !row.credential) return c.json({ error: 'not_found' }, 404);

  const badge = buildOpenBadge({
    credentialId: row.credential.id,
    hashSha256: row.credential.hashSha256,
    recipientName: row.recipient?.name ?? '',
    recipientEmail: row.recipient?.email ?? null,
    cpf: row.recipient?.cpf ?? null,
    courseName: row.credential.courseName,
    courseHours: row.credential.courseHours,
    issuedAt: row.credential.issuedAt,
    expiresAt: row.credential.expiresAt,
    workspaceName: row.workspace?.name ?? 'UniverCert',
    workspaceUrl: 'https://univercert.com.br',
    verifyUrl: `https://univercert.com.br/v/${row.credential.id}`,
  });

  return c.json(badge, 200, {
    'content-type': 'application/ld+json',
    'cache-control': 'public, max-age=3600',
  });
});

// ----------------------------------------
// POST /api/v1/credentials/:id/notify
// ----------------------------------------
app.post('/credentials/:id/notify', async (c) => {
  const id = c.req.param('id');
  try {
    const result = await notifyRecipient(id);
    return c.json({ ok: true, sent: result });
  } catch (e) {
    return c.json({ ok: false, error: (e as Error).message }, 400);
  }
});

export const GET = handle(app);
export const POST = handle(app);
export const PUT = handle(app);
export const DELETE = handle(app);
export const PATCH = handle(app);
