'use server';

// UniverCert · Workflows server actions

import { eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { workflows, workspaces, auditLogs } from '@/db/schema';
import { ID } from '@/lib/ulid';
import { validateTemplate } from '@/lib/workflow-template';

type Args = {
  id: string;
  name: string;
  channel: 'email' | 'whatsapp';
  triggerEvent: 'credential.issued' | 'credential.revoked' | 'request.created' | 'nps.d7';
  subject: string;
  bodyTemplate: string;
  isActive: boolean;
  delaySeconds: number;
  abSubjectB: string;
};

export async function saveWorkflowAction(
  a: Args,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  if (!a.name?.trim()) return { ok: false, error: 'Nome obrigatório' };
  if (a.name.length > 80) return { ok: false, error: 'Nome muito longo' };
  if (!a.bodyTemplate?.trim()) return { ok: false, error: 'Mensagem obrigatória' };
  if (a.bodyTemplate.length > 10_000) return { ok: false, error: 'Mensagem muito longa' };
  if (a.subject && a.subject.length > 200) return { ok: false, error: 'Subject muito longo' };

  // Valida variáveis
  const v1 = validateTemplate(a.subject);
  const v2 = validateTemplate(a.bodyTemplate);
  const v3 = validateTemplate(a.abSubjectB);
  if (!v1.ok) return { ok: false, error: `Subject usa variável inválida: ${v1.unknownVars.join(', ')}` };
  if (!v2.ok) return { ok: false, error: `Body usa variável inválida: ${v2.unknownVars.join(', ')}` };
  if (!v3.ok) return { ok: false, error: `Subject B usa variável inválida: ${v3.unknownVars.join(', ')}` };

  const db = getDb();
  const slug = 'univerhair';
  try {
    const [ws] = await db.select().from(workspaces).where(eq(workspaces.slug, slug)).limit(1);
    if (!ws) return { ok: false, error: 'Workspace não encontrado' };
    const now = Math.floor(Date.now() / 1000);

    const id = a.id || ID.template().replace('tpl_', 'wfl_');

    if (a.id) {
      // Update
      const [existing] = await db.select().from(workflows).where(eq(workflows.id, a.id)).limit(1);
      if (!existing || existing.workspaceId !== ws.id) return { ok: false, error: 'Workflow não encontrado' };
      await db
        .update(workflows)
        .set({
          name: a.name.trim(),
          channel: a.channel,
          triggerEvent: a.triggerEvent,
          subject: a.subject || null,
          bodyTemplate: a.bodyTemplate,
          isActive: a.isActive ? 1 : 0,
          delaySeconds: a.delaySeconds,
          abSubjectB: a.abSubjectB || null,
          updatedAt: now,
        })
        .where(eq(workflows.id, a.id));
    } else {
      await db.insert(workflows).values({
        id,
        workspaceId: ws.id,
        name: a.name.trim(),
        channel: a.channel,
        triggerEvent: a.triggerEvent,
        subject: a.subject || null,
        bodyTemplate: a.bodyTemplate,
        isActive: a.isActive ? 1 : 0,
        delaySeconds: a.delaySeconds,
        abSubjectB: a.abSubjectB || null,
      });
    }

    // Audit
    try {
      await db.insert(auditLogs).values({
        id: ID.auditLog(),
        workspaceId: ws.id,
        action: a.id ? 'workflow.update' : 'workflow.create',
        entityType: 'workflow',
        entityId: id,
        metadataJson: JSON.stringify({ channel: a.channel, triggerEvent: a.triggerEvent }),
      });
    } catch {}

    return { ok: true, id };
  } catch (e) {
    console.error('saveWorkflow', e);
    return { ok: false, error: (e as Error).message };
  }
}

export async function deleteWorkflowAction(id: string): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!id) return { ok: false, error: 'ID obrigatório' };
  const db = getDb();
  try {
    const [ws] = await db.select().from(workspaces).where(eq(workspaces.slug, 'univerhair')).limit(1);
    if (!ws) return { ok: false, error: 'Workspace não encontrado' };
    const [existing] = await db.select().from(workflows).where(eq(workflows.id, id)).limit(1);
    if (!existing || existing.workspaceId !== ws.id) return { ok: false, error: 'Workflow não encontrado' };
    await db.delete(workflows).where(eq(workflows.id, id));
    try {
      await db.insert(auditLogs).values({
        id: ID.auditLog(),
        workspaceId: ws.id,
        action: 'workflow.delete',
        entityType: 'workflow',
        entityId: id,
      });
    } catch {}
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
