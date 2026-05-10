// UniverCert · Email dispatcher (S18)
// Pipeline: triggerEvent -> busca workflows ativos -> renderiza template -> envia via Resend -> loga em email_events.

import { eq, and } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { workflows, emailEvents, credentials, recipients, workspaces } from '@/db/schema';
import { interpolate, type WorkflowVars } from '@/lib/workflow-template';
import { sendEmail } from '@/lib/resend';
import { ID } from '@/lib/ulid';

type TriggerEvent = 'credential.issued' | 'credential.revoked' | 'request.created' | 'request.submitted' | 'request.needs_revision' | 'nps.d7';

const APP_BASE = 'https://univercert.net';

/**
 * Cria as variaveis a partir de credential + workspace.
 * Reutilizavel pra outros triggers que tenham credential.
 */
async function buildVarsFromCredential(credentialId: string): Promise<WorkflowVars | null> {
  const db = getDb();
  const [row] = await db
    .select({
      cred: credentials,
      recipient: recipients,
      workspace: workspaces,
    })
    .from(credentials)
    .leftJoin(recipients, eq(recipients.id, credentials.recipientId))
    .leftJoin(workspaces, eq(workspaces.id, credentials.workspaceId))
    .where(eq(credentials.id, credentialId))
    .limit(1);

  if (!row?.cred) return null;
  const c = row.cred;
  const r = row.recipient;
  const ws = row.workspace;

  const fullName = (r?.name ?? '').trim();
  const firstName = fullName.split(/\s+/)[0] ?? '';
  const issuedDate = c.issuedAt
    ? new Date(c.issuedAt * 1000).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
    : '';

  const baseHost = ws?.customDomain ? `https://${ws.customDomain}` : APP_BASE;

  return {
    recipientName: fullName,
    recipientFirstName: firstName,
    recipientEmail: r?.email ?? '',
    recipientPhone: r?.phoneWhatsapp ?? '',
    courseName: c.courseName ?? '',
    courseHours: c.courseHours ?? null,
    workspaceName: ws?.name ?? 'UniverCert',
    verifyUrl: `${baseHost}/v/${c.id}`,
    pdfUrl: `${baseHost}/api/v1/credentials/${c.id}/pdf`,
    credentialId: c.id,
    issuedAt: issuedDate,
  };
}

/**
 * Renderiza template body markdown-ish em HTML simples (parágrafos + bold + links).
 * Pra MVP — depois trocamos por mjml ou react-email.
 */
function bodyToHtml(body: string, vars: WorkflowVars): string {
  let html = interpolate(body, vars)
    .split('\n\n')
    .map((p) => `<p style="margin:0 0 16px 0;line-height:1.55;color:#1f2937;font-size:15px;">${p
      .replace(/\n/g, '<br/>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/(https?:\/\/\S+)/g, '<a href="$1" style="color:#1B2D5E;text-decoration:underline;">$1</a>')}</p>`)
    .join('');

  // Wrapper minimalista (UniverCert brand)
  return `<!doctype html>
<html><head><meta charset="utf-8"><title></title></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:Inter,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:32px 16px;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;border:1px solid #e5e7eb;max-width:560px;width:100%;">
<tr><td style="padding:28px 32px 12px 32px;border-bottom:1px solid #f3f4f6;">
<div style="font-weight:700;font-size:18px;letter-spacing:-0.02em;">
<span style="color:#1B2D5E;">univer</span><span style="color:#D4A937;">CERT</span>
</div>
</td></tr>
<tr><td style="padding:28px 32px;">${html}</td></tr>
<tr><td style="padding:0 32px 28px 32px;border-top:1px solid #f3f4f6;padding-top:18px;">
<p style="margin:0;font-size:11px;color:#9ca3af;line-height:1.5;">
Enviado por <strong>${vars.workspaceName ?? 'UniverCert'}</strong> via UniverCert · Plataforma brasileira de certificados digitais
</p>
</td></tr>
</table>
</td></tr>
</table>
</body></html>`;
}

/**
 * Dispara workflows ativos pra um evento + workspace.
 * Cada workflow eh logado em email_events, mesmo que falhe.
 */
export async function dispatchWorkflowsFor(args: {
  workspaceId: string;
  triggerEvent: TriggerEvent;
  credentialId?: string;
  channel?: 'email' | 'whatsapp';        // default: email (whatsapp ainda nao implementado)
}): Promise<{ dispatched: number; failed: number; errors: string[] }> {
  const db = getDb();
  const channel = args.channel ?? 'email';

  const wfs = await db
    .select()
    .from(workflows)
    .where(
      and(
        eq(workflows.workspaceId, args.workspaceId),
        eq(workflows.triggerEvent, args.triggerEvent),
        eq(workflows.channel, channel),
        eq(workflows.isActive, 1),
      ),
    );

  if (wfs.length === 0) return { dispatched: 0, failed: 0, errors: [] };

  // Pra credential events, monta vars
  let vars: WorkflowVars = {};
  if (args.credentialId) {
    const built = await buildVarsFromCredential(args.credentialId);
    if (built) vars = built;
  }

  let dispatched = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const wf of wfs) {
    if (channel !== 'email') continue;       // skip whatsapp por enquanto

    const recipientEmail = vars.recipientEmail;
    if (!recipientEmail) {
      failed++;
      errors.push(`workflow ${wf.id}: sem recipientEmail`);
      await db.insert(emailEvents).values({
        id: ID.emailEvent(),
        workspaceId: args.workspaceId,
        recipientEmail: '<unknown>',
        subject: wf.subject ?? '',
        bodyPreview: wf.bodyTemplate.slice(0, 200),
        status: 'failed',
        errorMessage: 'sem recipientEmail',
        workflowId: wf.id,
        credentialId: args.credentialId,
        triggeredByEvent: args.triggerEvent,
      });
      continue;
    }

    const subject = interpolate(wf.subject ?? '', vars);
    const html = bodyToHtml(wf.bodyTemplate, vars);

    const result = await sendEmail({
      to: recipientEmail,
      subject,
      html,
      tags: [
        { name: 'workflow_id', value: wf.id },
        { name: 'event', value: args.triggerEvent },
      ],
    });

    if (result.ok) {
      dispatched++;
      await db.insert(emailEvents).values({
        id: ID.emailEvent(),
        workspaceId: args.workspaceId,
        recipientEmail,
        subject,
        bodyPreview: html.slice(0, 200),
        status: 'sent',
        providerMessageId: result.id,
        workflowId: wf.id,
        credentialId: args.credentialId,
        triggeredByEvent: args.triggerEvent,
        sentAt: Math.floor(Date.now() / 1000),
      });
    } else {
      failed++;
      errors.push(`workflow ${wf.id}: ${result.error}`);
      await db.insert(emailEvents).values({
        id: ID.emailEvent(),
        workspaceId: args.workspaceId,
        recipientEmail,
        subject,
        bodyPreview: html.slice(0, 200),
        status: 'failed',
        errorMessage: result.error.slice(0, 500),
        workflowId: wf.id,
        credentialId: args.credentialId,
        triggeredByEvent: args.triggerEvent,
      });
    }
  }

  return { dispatched, failed, errors };
}

/**
 * Envia email de teste (usado pelo workflow editor).
 * Loga em email_events com triggered_by='test'.
 */
export async function sendTestEmail(args: {
  workspaceId: string;
  workflowId?: string;
  toEmail: string;
  subject: string;
  body: string;
  vars?: WorkflowVars;
}): Promise<{ ok: boolean; id?: string; error?: string }> {
  const db = getDb();
  const sampleVars: WorkflowVars = {
    recipientName: 'Maria Aparecida da Silva',
    recipientFirstName: 'Maria',
    recipientEmail: args.toEmail,
    courseName: 'Curso de teste',
    courseHours: 40,
    workspaceName: 'UniverCert',
    verifyUrl: 'https://univercert.net/v/cred_TEST',
    pdfUrl: 'https://univercert.net/api/v1/credentials/cred_TEST/pdf',
    credentialId: 'cred_TEST',
    issuedAt: new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }),
    ...(args.vars ?? {}),
  };

  const subject = `[TESTE] ${interpolate(args.subject, sampleVars)}`;
  const html = bodyToHtml(args.body, sampleVars);

  const result = await sendEmail({ to: args.toEmail, subject, html });

  await db.insert(emailEvents).values({
    id: ID.emailEvent(),
    workspaceId: args.workspaceId,
    recipientEmail: args.toEmail,
    subject,
    bodyPreview: html.slice(0, 200),
    status: result.ok ? 'sent' : 'failed',
    providerMessageId: result.ok ? result.id : null,
    errorMessage: result.ok ? null : result.error.slice(0, 500),
    workflowId: args.workflowId,
    triggeredByEvent: 'manual.test',
    sentAt: result.ok ? Math.floor(Date.now() / 1000) : null,
  });

  return result.ok ? { ok: true, id: result.id } : { ok: false, error: result.error };
}
