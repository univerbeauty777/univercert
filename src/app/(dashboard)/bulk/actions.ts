'use server';

// UniverCert · Bulk emit Server Actions

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { recipients, certificateRequests, credentials } from '@/db/schema';
import { ID } from '@/lib/ulid';
import { isValidCPF, cleanCPF } from '@/lib/cpf';
import { computeCertHash } from '@/lib/credentials';
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

export async function bulkEmitAction(rows: BulkRow[]): Promise<BulkResult> {
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
        hashSha256: hash,
        courseName: row.curso,
        courseHours: row.horas,
        issuedAt: now,
      });

      result.emitted++;
      result.credentialIds.push(credId);
    } catch (e) {
      result.failed++;
      result.errors.push({ row: i, error: (e as Error).message });
    }
  }

  revalidatePath('/dashboard');
  revalidatePath('/queue');
  return result;
}
