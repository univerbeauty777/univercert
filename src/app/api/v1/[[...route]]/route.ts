// UniverCert · API v1 (Hono · catch-all em /api/v1/*)

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { handle } from 'hono/vercel';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { certificateRequests, recipients, workspaces, credentials, brandKits } from '@/db/schema';
import { ID } from '@/lib/ulid';
import { isValidCPF, cleanCPF } from '@/lib/cpf';
import { issueCredentialFromRequest, rejectRequest, computeCertHash } from '@/lib/credentials';
import { renderCertificateHtml } from '@/lib/cert-template';
import { renderPdfFromHtml } from '@/lib/render-pdf';
import { notifyRecipient } from '@/lib/notify';
import { buildOpenBadge } from '@/lib/openbadge';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

export const runtime = 'edge';

const app = new Hono().basePath('/api/v1');

// CORS — apenas origens conhecidas (produção + preview + dev local)
const ALLOWED_ORIGINS = [
  'https://univercert.com.br',
  'https://univercert.pages.dev',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];
app.use(
  '*',
  cors({
    origin: (origin) => {
      if (!origin) return ALLOWED_ORIGINS[0]; // server-to-server requests
      if (ALLOWED_ORIGINS.includes(origin)) return origin;
      // Permitir subdomínios *.univercert.com.br (white-label)
      if (origin.endsWith('.univercert.com.br')) return origin;
      // Preview deployments do Cloudflare Pages
      if (origin.endsWith('.univercert.pages.dev')) return origin;
      return ALLOWED_ORIGINS[0]; // bloqueia (CORS irá rejeitar fetch)
    },
    credentials: true,
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    maxAge: 600,
  }),
);

// Global error handler
app.onError((err, c) => {
  const e = err as Error;
  console.error('[api error]', e?.message, e?.stack);
  // Em prod, NÃO expor stack pra clients externos
  const isDev = c.req.header('host')?.includes('localhost') ?? false;
  return c.json(
    {
      error: 'internal',
      message: e?.message ?? 'unknown',
      ...(isDev ? { stack: e?.stack?.split('\n').slice(0, 6).join(' | ') } : {}),
    },
    500,
  );
});

app.get('/', (c) =>
  c.json({
    name: 'UniverCert API',
    version: '0.10.1',
    docs: 'https://developer.univercert.com.br',
    sprints_completed: ['S0', 'S1', 'S1.5', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S9', 'S10'],
  }),
);

// Diagnóstico — retorna se workspace 'demo' está provisionado (pra debug Sprint 10)
app.get('/demo/diag', async (c) => {
  try {
    const db = getDb();
    const ws = await db.select().from(workspaces).where(eq(workspaces.slug, 'demo')).limit(1);
    return c.json({
      ok: true,
      workspace_demo_exists: ws.length > 0,
      workspace: ws[0] ?? null,
    });
  } catch (e) {
    return c.json({ ok: false, error: (e as Error).message, stack: (e as Error).stack }, 500);
  }
});

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
  // Rate limit: 5 solicitações por 60s por IP
  const ip = getClientIp(c.req.raw);
  const rl = await rateLimit({ key: `requests:${ip}`, max: 5, windowSec: 60 });
  if (!rl.ok) {
    return c.json({ error: 'rate_limited', retry_at: rl.resetAt }, 429);
  }

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
  const variant = (c.req.query('variant') === 'modern' ? 'modern' : 'classic') as 'classic' | 'modern';
  const db = getDb();
  const [row] = await db
    .select({ credential: credentials, recipient: recipients, workspace: workspaces, brand: brandKits })
    .from(credentials)
    .leftJoin(recipients, eq(credentials.recipientId, recipients.id))
    .leftJoin(workspaces, eq(credentials.workspaceId, workspaces.id))
    .leftJoin(brandKits, eq(brandKits.workspaceId, workspaces.id))
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
    hashSha256: row.credential.hashSha256,
    workspaceName: row.workspace?.name ?? 'UniverCert',
    verifyUrl: `https://univercert.com.br/v/${row.credential.id}`,
    primaryColor: row.brand?.primaryColor ?? undefined,
    accentColor: row.brand?.secondaryColor ?? undefined,
    variant,
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
// POST /api/v1/demo/issue — Sprint 10 · Demo pública sem auth
// ----------------------------------------
const demoSchema = z.object({
  nome: z.string().min(2).max(80),
  curso: z.string().min(2).max(120),
});

app.post('/demo/issue', async (c) => {
  // Rate limit agressivo: 3 demos por IP por hora
  const ip = getClientIp(c.req.raw);
  const rl = await rateLimit({ key: `demo:${ip}`, max: 3, windowSec: 3600 });
  if (!rl.ok) {
    return c.json(
      { error: 'rate_limited', message: 'Você já testou 3 vezes na última hora. Volte mais tarde ou crie sua conta gratuita.', retry_at: rl.resetAt },
      429,
    );
  }

  let raw: any;
  try {
    raw = await c.req.json();
  } catch {
    return c.json({ error: 'invalid_body' }, 400);
  }

  const parsed = demoSchema.safeParse(raw);
  if (!parsed.success) {
    return c.json({ error: 'validation', issues: parsed.error.issues }, 400);
  }
  const data = parsed.data;
  const db = getDb();

  // Workspace 'demo' deve estar provisionado pela migration 0004
  const [ws] = await db.select().from(workspaces).where(eq(workspaces.slug, 'demo')).limit(1);
  if (!ws) return c.json({ error: 'demo_workspace_not_provisioned' }, 500);

  // Cria recipient demo (sem CPF, sem email, sem WA)
  const [recipient] = await db
    .insert(recipients)
    .values({
      id: ID.recipient(),
      workspaceId: ws.id,
      name: data.nome.trim(),
      cpf: null,
      email: null,
      phoneWhatsapp: null,
      metadataJson: JSON.stringify({ demo: true, ip }),
    })
    .returning();

  // Pula o request — emite credential direto
  const issuedAt = Math.floor(Date.now() / 1000);
  const credId = ID.credential();
  const hash = await computeCertHash({
    workspaceId: ws.id,
    recipientId: recipient.id,
    recipientName: recipient.name,
    cpf: null,
    courseName: data.curso.trim(),
    courseHours: null,
    issuedAt,
  });

  const [cred] = await db
    .insert(credentials)
    .values({
      id: credId,
      workspaceId: ws.id,
      recipientId: recipient.id,
      hashSha256: hash,
      courseName: data.curso.trim(),
      courseHours: null,
      issuedAt,
      // expira em 90 dias — UX melhor que sumir, mas evita lixo eterno
      expiresAt: issuedAt + 90 * 24 * 3600,
      metadataJson: JSON.stringify({ demo: true }),
    })
    .returning();

  return c.json(
    {
      ok: true,
      credential_id: cred.id,
      verify_url: `/v/${cred.id}`,
      demo_result_url: `/demo/${cred.id}`,
      issued_at: issuedAt,
    },
    201,
  );
});

// ----------------------------------------
// GET /api/v1/templates/:variant/preview
// Preview de cada variante com dados fictícios (pra galeria)
// ----------------------------------------
app.get('/templates/:variant/preview', async (c) => {
  const variant = c.req.param('variant') as 'classic' | 'modern' | 'gold' | 'minimal' | 'executive' | 'creative';
  const valid = ['classic', 'modern', 'gold', 'minimal', 'executive', 'creative'];
  if (!valid.includes(variant)) return c.json({ error: 'invalid_variant' }, 400);

  const primary = c.req.query('primary');
  const accent = c.req.query('accent');

  const html = renderCertificateHtml({
    recipientName: 'Maria Aparecida da Silva',
    cpf: '12345678900',
    courseName: 'Alisamento Profissional · Liso Blindado',
    courseHours: 40,
    issuedAt: Math.floor(Date.now() / 1000),
    credentialId: 'cred_PREVIEW_EXAMPLE_ID_2026',
    hashSha256: 'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
    workspaceName: c.req.query('workspace') ?? 'UniverCert',
    verifyUrl: 'https://univercert.com.br/v/preview',
    variant,
    primaryColor: primary && /^#[0-9A-Fa-f]{6}$/.test(primary) ? primary : undefined,
    accentColor: accent && /^#[0-9A-Fa-f]{6}$/.test(accent) ? accent : undefined,
  });

  return new Response(html, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'public, max-age=300',
      'x-frame-options': 'SAMEORIGIN',
    },
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
