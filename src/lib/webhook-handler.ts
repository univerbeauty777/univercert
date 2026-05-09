// UniverCert · pipeline genérico de webhook → request
// Cada provider extrai o payload no seu formato e chama processWebhook().
// Sprint 20: lê integration.configJson pra auto_approve + course→template mapping.

import { eq, and } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { workspaces, integrations, recipients, certificateRequests, webhooksIn, credentials } from '@/db/schema';
import { ID } from './ulid';
import { computeCertHash } from '@/lib/credentials';
import { dispatchWorkflowsFor } from '@/lib/email-dispatcher';

type IntegrationConfig = {
  auto_approve?: boolean;
  send_email?: boolean;
  default_template?: string;
  course_template_map?: Record<string, string>;  // courseName ou courseSlug → templateId/variant
};

function parseIntegrationConfig(raw: string | null | undefined): IntegrationConfig {
  if (!raw) return {};
  try { return JSON.parse(raw) as IntegrationConfig; } catch { return {}; }
}

export type WebhookProvider = 'hotmart' | 'memberkit' | 'fluent' | 'kiwify' | 'eduzz' | 'hubla' | 'greenn';

export type NormalizedWebhookPayload = {
  workspaceSlug: string;
  courseName: string;
  courseHours?: number;
  student: {
    name: string;
    email: string;
    cpf?: string;
    phone?: string;
  };
  externalRef?: string;
};

export type WebhookHandlerResult =
  | { ok: true; requestId: string; recipientId: string; credentialId?: string; autoApproved?: boolean }
  | { ok: false; status: number; error: string };

/**
 * Pipeline padrão: log raw → upsert recipient → cria request pending.
 * Idempotente: se mesmo email+course estiver pending, não duplica.
 */
export async function processWebhook(
  provider: WebhookProvider,
  rawBody: string,
  normalized: NormalizedWebhookPayload,
): Promise<WebhookHandlerResult> {
  const db = getDb();

  const [ws] = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.slug, normalized.workspaceSlug))
    .limit(1);
  if (!ws) return { ok: false, status: 404, error: 'workspace_not_found' };

  // Log webhook bruto
  const webhookId = ID.webhookIn();
  try {
    await db.insert(webhooksIn).values({
      id: webhookId,
      workspaceId: ws.id,
      provider,
      rawPayloadJson: rawBody,
      status: 'received',
    });
  } catch {
    /* ignore */
  }

  // Upsert recipient por email+workspace
  const existing = await db
    .select()
    .from(recipients)
    .where(and(eq(recipients.workspaceId, ws.id), eq(recipients.email, normalized.student.email)))
    .limit(1);

  let recipientId = existing[0]?.id;
  if (!recipientId) {
    const [created] = await db
      .insert(recipients)
      .values({
        id: ID.recipient(),
        workspaceId: ws.id,
        name: normalized.student.name,
        email: normalized.student.email,
        cpf: normalized.student.cpf,
        phoneWhatsapp: normalized.student.phone,
      })
      .returning();
    recipientId = created.id;
  }

  // Le config da integration (auto_approve, course mapping)
  const [integ] = await db
    .select()
    .from(integrations)
    .where(and(eq(integrations.workspaceId, ws.id), eq(integrations.provider, provider)))
    .limit(1);
  const cfg = parseIntegrationConfig(integ?.configJson);
  const autoApprove = cfg.auto_approve === true;

  // Cria request (pending OU approved se auto_approve)
  const [req] = await db
    .insert(certificateRequests)
    .values({
      id: ID.request(),
      workspaceId: ws.id,
      recipientId,
      source: 'webhook',
      sourceDataJson: JSON.stringify({
        provider,
        webhook_id: webhookId,
        external_ref: normalized.externalRef,
        auto_approved: autoApprove,
      }),
      courseName: normalized.courseName,
      courseHours: normalized.courseHours,
      status: autoApprove ? 'approved' : 'pending',
    })
    .returning();

  // Se auto_approve: cria credential direto + dispara workflow email
  let credentialId: string | undefined;
  if (autoApprove) {
    try {
      const issuedAt = Math.floor(Date.now() / 1000);
      const credId = ID.credential();
      const hash = await computeCertHash({
        workspaceId: ws.id,
        recipientId,
        recipientName: normalized.student.name,
        cpf: normalized.student.cpf ?? null,
        courseName: normalized.courseName,
        courseHours: normalized.courseHours ?? null,
        issuedAt,
      });

      // Course → template mapping (matches por nome exato; fallback default_template)
      const mappedTemplate =
        cfg.course_template_map?.[normalized.courseName] ??
        cfg.default_template ??
        null;

      const [cred] = await db
        .insert(credentials)
        .values({
          id: credId,
          workspaceId: ws.id,
          requestId: req.id,
          recipientId,
          hashSha256: hash,
          courseName: normalized.courseName,
          courseHours: normalized.courseHours ?? null,
          issuedAt,
          metadataJson: JSON.stringify({
            source: provider,
            auto_approved: true,
            template_variant: mappedTemplate,
            external_ref: normalized.externalRef,
          }),
        })
        .returning();
      credentialId = cred.id;

      // Dispara workflows configurados (email engine S18)
      const sendEmailFlag = cfg.send_email !== false;       // default true
      if (sendEmailFlag) {
        try {
          await dispatchWorkflowsFor({
            workspaceId: ws.id,
            triggerEvent: 'credential.issued',
            credentialId: cred.id,
            channel: 'email',
          });
        } catch (e) {
          console.error('[webhook] dispatch failed:', (e as Error).message);
        }
      }
    } catch (e) {
      console.error('[webhook] auto-approve issue failed:', (e as Error).message);
      // Mesmo se a issue falhar, continuamos — o request fica como approved e dá pra retry manual
    }
  }

  // Marca webhook como processado
  await db
    .update(webhooksIn)
    .set({ status: 'processed', processedAt: Math.floor(Date.now() / 1000) })
    .where(eq(webhooksIn.id, webhookId));

  return { ok: true, requestId: req.id, recipientId, credentialId, autoApproved: autoApprove };
}

/**
 * Resolve workspace slug por integration ativa do provider.
 * Permite que o admin cole a URL `/api/webhooks/X?ws=slug` ou config no integrations table.
 */
export async function resolveWorkspaceFromQuery(query: URLSearchParams): Promise<string | null> {
  return query.get('ws') || query.get('workspace') || query.get('workspace_slug');
}

/**
 * Busca o secret HMAC da integration ativa.
 * Se não houver integration cadastrada, retorna null (validação skipa em DEV; rejeita em PROD).
 */
export async function getWebhookSecret(
  workspaceSlug: string,
  provider: WebhookProvider,
): Promise<string | null> {
  const db = getDb();
  const [ws] = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.slug, workspaceSlug))
    .limit(1);
  if (!ws) return null;

  const [integ] = await db
    .select()
    .from(integrations)
    .where(and(eq(integrations.workspaceId, ws.id), eq(integrations.provider, provider)))
    .limit(1);

  return integ?.webhookSecret ?? null;
}
