'use server';

import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { getDb } from '@/db/client';
import { certificateRequests, courses, workspaces } from '@/db/schema';
import { issueCredentialFromRequest, rejectRequest as rejectRequestFn } from '@/lib/credentials';
import { notifyRecipient } from '@/lib/notify';
import { sendEmail } from '@/lib/resend';
import { dispatchWorkflowsFor } from '@/lib/email-dispatcher';
import { dispatchWebhook } from '@/lib/webhook-dispatcher';
import { ID } from '@/lib/ulid';

export async function requestRevisionAction(requestId: string, comment: string) {
  try {
    const db = getDb();
    const [row] = await db
      .select({ req: certificateRequests, course: courses, ws: workspaces })
      .from(certificateRequests)
      .leftJoin(courses, eq(courses.id, certificateRequests.courseId))
      .leftJoin(workspaces, eq(workspaces.id, certificateRequests.workspaceId))
      .where(eq(certificateRequests.id, requestId))
      .limit(1);
    if (!row?.req) return { ok: false as const, error: 'request nao encontrada' };

    // Anota historico
    let history: any[] = [];
    if (row.req.revisionsJson) {
      try { history = JSON.parse(row.req.revisionsJson); } catch {}
    }
    history.push({
      at: Math.floor(Date.now() / 1000),
      action: 'revision_requested',
      comment: comment.trim().slice(0, 1000),
      previousExtras: row.req.extrasJson ? JSON.parse(row.req.extrasJson) : null,
    });

    await db
      .update(certificateRequests)
      .set({
        status: 'needs_revision',
        rejectionReason: comment.trim().slice(0, 500),
        revisionsJson: JSON.stringify(history.slice(-10)),
      })
      .where(eq(certificateRequests.id, requestId));

    // Email pro aluno com magic link
    const email = row.req.submitterEmail;
    if (email && row.course && row.ws && row.req.requestToken) {
      const url = `https://univercert.net/solicitar/${row.ws.slug}/${row.course.slug}?revise=${row.req.requestToken}`;
      const html = `
<!doctype html><html><body style="margin:0;padding:0;background:#f9fafb;font-family:Inter,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;background:#f9fafb;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;border:1px solid #e5e7eb;max-width:560px;width:100%;">
<tr><td style="padding:28px 32px 12px;border-bottom:1px solid #f3f4f6;">
<div style="font-weight:700;font-size:18px;letter-spacing:-0.02em;">
<span style="color:#1B2D5E;">univer</span><span style="color:#D4A937;">CERT</span>
</div>
</td></tr>
<tr><td style="padding:28px 32px;">
<h1 style="margin:0 0 12px;font-size:20px;font-weight:600;color:#111827;">Solicitação precisa de revisão</h1>
<p style="margin:0 0 12px;color:#1f2937;line-height:1.55;font-size:15px;">Olá ${escapeHtml((row.req.submitterName ?? 'aluno').split(' ')[0])}!</p>
<p style="margin:0 0 16px;color:#1f2937;line-height:1.55;font-size:15px;">Sua solicitação do certificado <strong>${escapeHtml(row.course.name)}</strong> está quase lá — só precisa de pequenos ajustes:</p>
<div style="margin:16px 0;padding:14px 16px;background:#fff7ed;border-left:4px solid #ea580c;border-radius:0 6px 6px 0;font-size:14px;color:#9a3412;line-height:1.5;">${escapeHtml(comment)}</div>
<p style="margin:0 0 18px;color:#374151;font-size:14px;">Clique no botão abaixo pra reenviar com as correções:</p>
<a href="${url}" style="display:inline-block;padding:11px 22px;background:#1B2D5E;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">Corrigir e reenviar →</a>
</td></tr>
<tr><td style="padding:18px 32px 28px;border-top:1px solid #f3f4f6;">
<p style="margin:0;font-size:11px;color:#9ca3af;line-height:1.5;">Enviado por ${escapeHtml(row.ws.name)} via UniverCert</p>
</td></tr>
</table>
</td></tr></table></body></html>`;

      try {
        await sendEmail({
          to: email,
          subject: `Sua solicitação precisa de uma correção · ${row.course.name}`,
          html,
        });
      } catch (e) {
        console.error('[requestRevisionAction] email failed', (e as Error).message);
      }
    }

    revalidatePath('/queue');
    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: (e as Error)?.message ?? 'erro' };
  }
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[c] ?? c));
}

export async function approveRequestAction(requestId: string) {
  try {
    const { credential, alreadyEmitted } = await issueCredentialFromRequest(requestId, null);
    // Notify in background (não bloqueia)
    if (!alreadyEmitted) {
      notifyRecipient(credential.id).catch((e) => console.error('notify failed:', e));
      // S40b: dispatch webhook event
      dispatchWebhook(credential.workspaceId, {
        event: 'cert.issued',
        id: ID.shareEvent(), // reuso ULID gen
        occurred_at: Math.floor(Date.now() / 1000),
        workspace_id: credential.workspaceId,
        data: {
          credential_id: credential.id,
          course_name: credential.courseName,
          recipient_id: credential.recipientId,
          status: credential.status,
          issued_at: credential.issuedAt,
        },
      }).catch((e) => console.error('webhook dispatch failed:', e));
    }
    revalidatePath('/queue');
    revalidatePath('/dashboard');
    revalidatePath('/credentials');
    return { ok: true as const, credentialId: credential.id, alreadyEmitted };
  } catch (e) {
    return { ok: false as const, error: (e as Error).message };
  }
}

export async function rejectRequestAction(requestId: string, formData: FormData) {
  const reason = (formData.get('reason') as string | null) ?? 'Sem motivo informado';
  try {
    await rejectRequestFn(requestId, reason, null);
    revalidatePath('/queue');
    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: (e as Error).message };
  }
}

export async function bulkApproveAction(requestIds: string[]) {
  let approved = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const id of requestIds) {
    try {
      const { credential } = await issueCredentialFromRequest(id, null);
      notifyRecipient(credential.id).catch(() => {});
      approved++;
    } catch (e) {
      failed++;
      errors.push(`${id}: ${(e as Error).message}`);
    }
  }
  revalidatePath('/queue');
  revalidatePath('/dashboard');
  revalidatePath('/credentials');
  return { ok: true as const, approved, failed, errors };
}
