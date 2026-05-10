// UniverCert · Notify orchestrator (refatorado S18)
// Dispara workflows custom configurados pelo workspace via dispatchWorkflowsFor.
// Fallback: se workspace nao tem workflow ativo pra credential.issued, manda email
// default (template padrao) pra nao deixar aluno sem comunicacao.

import { eq, and } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { credentials, recipients, workflows } from '@/db/schema';
import { dispatchWorkflowsFor } from '@/lib/email-dispatcher';
import { sendEmail } from '@/lib/resend';
import { emailEvents } from '@/db/schema';
import { ID } from '@/lib/ulid';

type SendResult = {
  email: { sent: boolean; reason?: string; via?: 'workflow' | 'default' };
  whatsapp: { sent: boolean; reason?: string };
};

/**
 * Notifica destinatário sobre credential emitida.
 * - Se ha workflows custom ativos pro evento, dispara eles (via dispatcher).
 * - Se nao, manda 1 email default minimalista (pra workspace que ainda nao configurou).
 */
export async function notifyRecipient(credentialId: string): Promise<SendResult> {
  const db = getDb();
  const [row] = await db
    .select({ credential: credentials, recipient: recipients })
    .from(credentials)
    .leftJoin(recipients, eq(credentials.recipientId, recipients.id))
    .where(eq(credentials.id, credentialId))
    .limit(1);

  if (!row || !row.credential) throw new Error('CREDENTIAL_NOT_FOUND');
  const { credential, recipient } = row;

  const result: SendResult = {
    email: { sent: false },
    whatsapp: { sent: false },
  };

  const recipientEmail = recipient?.email;

  // 1. Tenta dispatcher de workflows
  const dispatchResult = await dispatchWorkflowsFor({
    workspaceId: credential.workspaceId,
    triggerEvent: 'credential.issued',
    credentialId,
    channel: 'email',
  });

  if (dispatchResult.dispatched > 0) {
    result.email = { sent: true, via: 'workflow' };
  } else if (recipientEmail) {
    // 2. Fallback: manda email default
    const sent = await sendDefaultEmail({
      to: recipientEmail,
      recipientName: recipient?.name ?? 'Aluno',
      courseName: credential.courseName ?? 'seu curso',
      verifyUrl: `https://univercert.net/v/${credential.id}`,
      pdfUrl: `https://univercert.net/api/v1/credentials/${credential.id}/pdf`,
      workspaceId: credential.workspaceId,
      credentialId: credential.id,
    });
    result.email = sent;
  } else {
    result.email = { sent: false, reason: 'no_email' };
  }

  // 3. WhatsApp ainda usa Meta Cloud direto (workflows whatsapp em sprint futuro)
  // Mantemos no-op se sem credenciais — mas log no dispatcher se houver workflow whatsapp.

  return result;
}

async function sendDefaultEmail(args: {
  to: string;
  recipientName: string;
  courseName: string;
  verifyUrl: string;
  pdfUrl: string;
  workspaceId: string;
  credentialId: string;
}): Promise<{ sent: boolean; via: 'default'; reason?: string }> {
  const db = getDb();

  const subject = `Seu certificado de ${args.courseName} está pronto, ${args.recipientName.split(' ')[0]}!`;
  const html = `<!doctype html>
<html><body style="margin:0;padding:0;background:#f9fafb;font-family:Inter,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;background:#f9fafb;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;border:1px solid #e5e7eb;max-width:560px;width:100%;">
<tr><td style="padding:28px 32px 12px;border-bottom:1px solid #f3f4f6;">
<div style="font-weight:700;font-size:18px;letter-spacing:-0.02em;">
<span style="color:#1B2D5E;">univer</span><span style="color:#D4A937;">CERT</span>
</div>
</td></tr>
<tr><td style="padding:28px 32px;">
<h1 style="margin:0 0 14px;font-size:20px;font-weight:600;color:#111827;">Olá, ${escapeHtml(args.recipientName.split(' ')[0])}!</h1>
<p style="margin:0 0 16px;color:#1f2937;line-height:1.55;font-size:15px;">
Seu certificado do curso <strong>${escapeHtml(args.courseName)}</strong> foi emitido.
</p>
<table cellpadding="0" cellspacing="0" style="margin:18px 0;">
<tr><td style="padding-right:8px;">
<a href="${args.pdfUrl}" style="display:inline-block;padding:10px 18px;background:#1B2D5E;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">Baixar PDF</a>
</td><td>
<a href="${args.verifyUrl}" style="display:inline-block;padding:10px 18px;background:#fff;color:#1B2D5E;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;border:1px solid #e5e7eb;">Verificar autenticidade</a>
</td></tr>
</table>
</td></tr>
<tr><td style="padding:18px 32px 28px;border-top:1px solid #f3f4f6;">
<p style="margin:0;font-size:11px;color:#9ca3af;line-height:1.5;">Enviado via UniverCert · plataforma brasileira de certificados digitais</p>
</td></tr>
</table>
</td></tr>
</table>
</body></html>`;

  const send = await sendEmail({ to: args.to, subject, html });

  await db.insert(emailEvents).values({
    id: ID.emailEvent(),
    workspaceId: args.workspaceId,
    recipientEmail: args.to,
    subject,
    bodyPreview: html.slice(0, 200),
    status: send.ok ? 'sent' : 'failed',
    providerMessageId: send.ok ? send.id : null,
    errorMessage: send.ok ? null : send.error.slice(0, 500),
    credentialId: args.credentialId,
    triggeredByEvent: 'credential.issued.fallback',
    sentAt: send.ok ? Math.floor(Date.now() / 1000) : null,
  });

  if (send.ok) return { sent: true, via: 'default' };
  return { sent: false, via: 'default', reason: send.error };
}

function escapeHtml(str: string): string {
  return str.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[c] ?? c,
  );
}
