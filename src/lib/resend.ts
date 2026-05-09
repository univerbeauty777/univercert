// UniverCert · Resend client (edge-compatible, sem SDK Node)
// Doc: https://resend.com/docs/api-reference/emails/send-email

import { getRequestContext } from '@cloudflare/next-on-pages';

const RESEND_API = 'https://api.resend.com/emails';

// Fallback do Resend pra quem ainda nao verificou dominio proprio (so sandbox).
// Quando dominio univercert.com.br for verificado, troca pra noreply@univercert.com.br.
const FALLBACK_FROM = 'UniverCert <onboarding@resend.dev>';

export type SendEmailInput = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;            // override do default
  replyTo?: string;
  tags?: { name: string; value: string }[];
  headers?: Record<string, string>;
};

export type SendEmailResult =
  | { ok: true; id: string }
  | { ok: false; error: string; statusCode?: number };

function getCfg() {
  const { env } = getRequestContext();
  const apiKey = (env as any).RESEND_API_KEY as string | undefined;
  const from =
    (env as any).RESEND_FROM ||
    (env as any).EMAIL_FROM ||
    FALLBACK_FROM;
  return { apiKey, from };
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const { apiKey, from } = getCfg();
  if (!apiKey) {
    return { ok: false, error: 'RESEND_API_KEY missing in env' };
  }

  const body: Record<string, unknown> = {
    from: input.from ?? from,
    to: Array.isArray(input.to) ? input.to : [input.to],
    subject: input.subject,
    html: input.html,
  };
  if (input.text) body.text = input.text;
  if (input.replyTo) body.reply_to = input.replyTo;
  if (input.tags && input.tags.length > 0) body.tags = input.tags;
  if (input.headers) body.headers = input.headers;

  try {
    const resp = await fetch(RESEND_API, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      const errBody = await resp.text();
      return {
        ok: false,
        statusCode: resp.status,
        error: errBody.slice(0, 500),
      };
    }

    const data = (await resp.json()) as { id: string };
    return { ok: true, id: data.id };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
