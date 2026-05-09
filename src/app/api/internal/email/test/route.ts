// UniverCert · POST /api/internal/email/test
// Botao "Send test" do WorkflowEditor — envia email com sample vars pra um destinatario.

import { sendTestEmail } from '@/lib/email-dispatcher';
import { requireRole, RbacError } from '@/lib/rbac';
import { captureAndRespond } from '@/lib/observability';

export const runtime = 'edge';

export async function POST(request: Request) {
  try {
    const sess = await requireRole('editor');
    const body = (await request.json()) as {
      to?: string;
      subject?: string;
      body?: string;
      workflowId?: string;
    };
    if (!body.to || !body.subject || !body.body) {
      return Response.json({ ok: false, error: 'to/subject/body obrigatorios' }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.to)) {
      return Response.json({ ok: false, error: 'email invalido' }, { status: 400 });
    }

    const result = await sendTestEmail({
      workspaceId: sess.workspace.id,
      workflowId: body.workflowId,
      toEmail: body.to,
      subject: body.subject,
      body: body.body,
    });

    if (!result.ok) {
      return Response.json({ ok: false, error: result.error }, { status: 502 });
    }
    return Response.json({ ok: true, providerMessageId: result.id });
  } catch (e) {
    if (e instanceof RbacError) {
      return Response.json({ ok: false, error: 'sem permissao (editor+)' }, { status: 403 });
    }
    return captureAndRespond(request, e);
  }
}
