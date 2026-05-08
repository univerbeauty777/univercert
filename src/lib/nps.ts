// UniverCert · NPS automation D+7 via WhatsApp
// Roda como cron Cloudflare Workers (configurado em wrangler.toml)

import { eq, and, sql } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { credentials, recipients } from '@/db/schema';
import { getRequestContext } from '@cloudflare/next-on-pages';

/**
 * Lista credentials emitidos exatamente entre 7d e 8d atrás (window de 1 dia)
 * para evitar dispara duplicado.
 */
export async function findCredentialsForNpsD7() {
  const db = getDb();
  const now = Math.floor(Date.now() / 1000);
  const d7Start = now - 8 * 24 * 3600;
  const d7End = now - 7 * 24 * 3600;

  const list = await db
    .select({ credential: credentials, recipient: recipients })
    .from(credentials)
    .leftJoin(recipients, eq(credentials.recipientId, recipients.id))
    .where(
      and(
        sql`${credentials.issuedAt} >= ${d7Start}`,
        sql`${credentials.issuedAt} < ${d7End}`,
      ),
    )
    .limit(500);

  return list;
}

/**
 * Envia NPS via WhatsApp pra recipients.
 */
export async function sendNpsBatch() {
  const list = await findCredentialsForNpsD7();
  const { env } = getRequestContext();
  // @ts-expect-error
  const token = env.META_WHATSAPP_TOKEN as string | undefined;
  // @ts-expect-error
  const phoneId = env.META_WHATSAPP_PHONE_ID as string | undefined;

  if (!token || !phoneId) {
    console.log(`[nps] STUB: ${list.length} NPS would be sent (no Meta credentials)`);
    return { sent: 0, total: list.length, reason: 'no_credentials' };
  }

  let sent = 0;
  for (const { recipient, credential } of list) {
    if (!recipient?.phoneWhatsapp) continue;
    try {
      const phone = recipient.phoneWhatsapp.replace(/\D/g, '');
      const resp = await fetch(`https://graph.facebook.com/v20.0/${phoneId}/messages`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: phone,
          type: 'text',
          text: {
            body: `Olá, ${recipient.name}! 👋\n\nFaz uma semana que você concluiu "${credential.courseName}". Numa escala de 0 a 10, o quanto você indicaria nosso curso para um amigo?\n\nResponde só com o número 🙏`,
          },
        }),
      });
      if (resp.ok) sent++;
    } catch (e) {
      console.error('nps send failed for', recipient?.email, e);
    }
  }

  return { sent, total: list.length };
}
