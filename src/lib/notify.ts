// UniverCert · Notificações de credential emitida
// Sprint 2: Resend (email) + Meta WhatsApp Cloud API.
// Atualmente: stubs que logam quando RESEND_API_KEY ou META_WHATSAPP_TOKEN não setados.

import { eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { credentials, recipients } from '@/db/schema';
import { getRequestContext } from '@cloudflare/next-on-pages';

type SendResult = {
  email: { sent: boolean; provider: string; reason?: string };
  whatsapp: { sent: boolean; provider: string; reason?: string };
};

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
  if (!recipient) throw new Error('RECIPIENT_NOT_FOUND');

  const verifyUrl = `https://univercert.com.br/v/${credential.id}`;
  const pdfUrl = `https://univercert.com.br/api/v1/credentials/${credential.id}/pdf`;

  const result: SendResult = {
    email: { sent: false, provider: 'resend' },
    whatsapp: { sent: false, provider: 'meta-cloud' },
  };

  // EMAIL via Resend
  if (recipient.email) {
    result.email = await sendEmail({
      to: recipient.email,
      recipientName: recipient.name,
      courseName: credential.courseName,
      verifyUrl,
      pdfUrl,
    });
  } else {
    result.email = { sent: false, provider: 'resend', reason: 'no_email' };
  }

  // WHATSAPP via Meta Cloud API
  if (recipient.phoneWhatsapp) {
    result.whatsapp = await sendWhatsapp({
      to: recipient.phoneWhatsapp,
      recipientName: recipient.name,
      courseName: credential.courseName,
      verifyUrl,
    });
  } else {
    result.whatsapp = { sent: false, provider: 'meta-cloud', reason: 'no_phone' };
  }

  return result;
}

async function sendEmail(args: {
  to: string;
  recipientName: string;
  courseName: string;
  verifyUrl: string;
  pdfUrl: string;
}) {
  const { env } = getRequestContext();
  // @ts-expect-error
  const apiKey = env.RESEND_API_KEY as string | undefined;
  if (!apiKey) {
    console.log('[notify:email] STUB (sem RESEND_API_KEY) →', args.to, args.courseName);
    return { sent: false, provider: 'resend', reason: 'no_api_key' };
  }

  const resp = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      from: 'UniverCert <no-reply@univercert.com.br>',
      to: [args.to],
      subject: `🎓 Seu certificado de "${args.courseName}" está pronto!`,
      html: `
        <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:24px;">
          <h1 style="color:#6366F1;font-size:1.6rem;">Olá, ${escapeHtml(args.recipientName)}!</h1>
          <p>Seu certificado do curso <strong>${escapeHtml(args.courseName)}</strong> foi emitido. Você pode:</p>
          <ul>
            <li>📄 <a href="${args.pdfUrl}">Baixar o PDF</a></li>
            <li>🔗 <a href="${args.verifyUrl}">Verificar autenticidade</a></li>
          </ul>
          <p style="color:#666;font-size:0.9rem;">UniverCert · plataforma brasileira de certificados.</p>
        </div>
      `,
    }),
  });

  if (!resp.ok) {
    return { sent: false, provider: 'resend', reason: `http_${resp.status}` };
  }
  return { sent: true, provider: 'resend' };
}

async function sendWhatsapp(args: {
  to: string;
  recipientName: string;
  courseName: string;
  verifyUrl: string;
}) {
  const { env } = getRequestContext();
  // @ts-expect-error
  const token = env.META_WHATSAPP_TOKEN as string | undefined;
  // @ts-expect-error
  const phoneId = env.META_WHATSAPP_PHONE_ID as string | undefined;

  if (!token || !phoneId) {
    console.log('[notify:wa] STUB (sem META_WHATSAPP) →', args.to, args.courseName);
    return { sent: false, provider: 'meta-cloud', reason: 'no_credentials' };
  }

  const phone = args.to.replace(/\D/g, '');

  const resp = await fetch(`https://graph.facebook.com/v20.0/${phoneId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: phone,
      type: 'text',
      text: {
        body: `🎓 Olá, ${args.recipientName}! Seu certificado do curso "${args.courseName}" está pronto. Verifique em: ${args.verifyUrl}`,
      },
    }),
  });

  if (!resp.ok) {
    return { sent: false, provider: 'meta-cloud', reason: `http_${resp.status}` };
  }
  return { sent: true, provider: 'meta-cloud' };
}

function escapeHtml(str: string): string {
  return str.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[c] ?? c,
  );
}
