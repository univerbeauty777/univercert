// UniverCert · API v1 (Hono · roda em edge)

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { handle } from 'hono/vercel';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { certificateRequests, recipients, workspaces } from '@/db/schema';
import { ID } from '@/lib/ulid';
import { isValidCPF, cleanCPF } from '@/lib/cpf';

export const runtime = 'edge';

const app = new Hono().basePath('/api/v1');

app.use('*', cors());

app.get('/', (c) =>
  c.json({
    name: 'UniverCert API',
    version: '0.1.0',
    docs: 'https://developer.univercert.com.br',
  }),
);

// POST /api/v1/requests — fila de solicitação (form Fluent)
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
  if (!parsed.success) return c.json({ error: 'validation', issues: parsed.error.issues }, 400);
  const data = parsed.data;
  const db = getDb();

  const [ws] = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.slug, data.workspace_slug))
    .limit(1);
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
      status: 'pending',
    })
    .returning();

  return c.json({ ok: true, request_id: request.id, status: request.status }, 201);
});

app.get('/credentials/:id/pdf', async (c) => {
  return c.json({ error: 'not_implemented_yet', sprint: 2 }, 501);
});

export const GET = handle(app);
export const POST = handle(app);
export const PUT = handle(app);
export const DELETE = handle(app);
