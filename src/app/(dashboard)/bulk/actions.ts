'use server';

// UniverCert · Bulk emit Server Actions

import { revalidatePath } from 'next/cache';
import { eq, and, or } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { recipients, certificateRequests, credentials, templates } from '@/db/schema';
import { ID } from '@/lib/ulid';
import { isValidCPF, cleanCPF } from '@/lib/cpf';
import { computeCertHash } from '@/lib/credentials';
import { notifyRecipient } from '@/lib/notify';
import { requireRole, RbacError } from '@/lib/rbac';

export type BulkRow = {
  nome: string;
  cpf?: string;
  email: string;
  whatsapp?: string;
  curso: string;
  horas?: number;
};

export type BulkResult = {
  ok: boolean;
  emitted: number;
  failed: number;
  errors: Array<{ row: number; error: string }>;
  credentialIds: string[];
};

export async function bulkEmitAction(rows: BulkRow[], opts?: { templateId?: string }): Promise<BulkResult> {
  const result: BulkResult = { ok: true, emitted: 0, failed: 0, errors: [], credentialIds: [] };

  let sess;
  try {
    sess = await requireRole('editor');
  } catch (e) {
    if (e instanceof RbacError) {
      result.ok = false;
      result.errors.push({ row: -1, error: e.code });
      return result;
    }
    throw e;
  }
  const workspaceId = sess.workspace.id;
  const db = getDb();
  const now = Math.floor(Date.now() / 1000);

  // Template padrão do lote (escolhido na UI). Aceita id ou nome; valida no workspace.
  // Variantes built-in (ex: 'classic') não viram templateId — o render usa a variant default.
  let chosenTemplateId: string | null = null;
  if (opts?.templateId) {
    const [tpl] = await db
      .select({ id: templates.id })
      .from(templates)
      .where(and(eq(templates.workspaceId, workspaceId), or(eq(templates.id, opts.templateId), eq(templates.name, opts.templateId))))
      .limit(1);
    if (tpl) chosenTemplateId = tpl.id;
  }

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    try {
      if (!row.email || !row.nome || !row.curso) {
        throw new Error('campos_obrigatorios_ausentes');
      }
      const cpf = row.cpf ? cleanCPF(row.cpf) : null;
      if (cpf && !isValidCPF(cpf)) {
        throw new Error('cpf_invalido');
      }

      const existing = await db
        .select()
        .from(recipients)
        .where(eq(recipients.email, row.email))
        .limit(1);

      let recipientId: string;
      if (existing[0] && existing[0].workspaceId === workspaceId) {
        recipientId = existing[0].id;
      } else {
        const [created] = await db
          .insert(recipients)
          .values({
            id: ID.recipient(),
            workspaceId,
            cpf,
            name: row.nome,
            email: row.email,
            phoneWhatsapp: row.whatsapp,
          })
          .returning();
        recipientId = created.id;
      }

      const reqId = ID.request();
      await db.insert(certificateRequests).values({
        id: reqId,
        workspaceId,
        recipientId,
        source: 'csv',
        courseName: row.curso,
        courseHours: row.horas,
        status: 'emitted',
        reviewedAt: now,
      });

      const credId = ID.credential();
      const hash = await computeCertHash({
        workspaceId,
        recipientId,
        recipientName: row.nome,
        cpf,
        courseName: row.curso,
        courseHours: row.horas ?? null,
        issuedAt: now,
      });

      await db.insert(credentials).values({
        id: credId,
        workspaceId,
        requestId: reqId,
        recipientId,
        templateId: chosenTemplateId,
        hashSha256: hash,
        courseName: row.curso,
        courseHours: row.horas,
        issuedAt: now,
      });

      result.emitted++;
      result.credentialIds.push(credId);

      // Dispara email pro aluno (workflow custom OU email default). Best-effort.
      try {
        await notifyRecipient(credId);
      } catch (e) {
        console.error('[bulk] notify falhou p/ cred', credId, (e as Error)?.message);
      }
    } catch (e) {
      result.failed++;
      result.errors.push({ row: i, error: (e as Error).message });
    }
  }

  revalidatePath('/dashboard');
  revalidatePath('/queue');
  return result;
}
