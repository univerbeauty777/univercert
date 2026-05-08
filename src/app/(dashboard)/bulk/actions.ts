'use server';

// UniverCert · Bulk emit Server Actions

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { workspaces, recipients, certificateRequests, credentials } from '@/db/schema';
import { ID } from '@/lib/ulid';
import { isValidCPF, cleanCPF } from '@/lib/cpf';
import { computeCertHash } from '@/lib/credentials';

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
  const db = getDb();
  const workspaceId = 'ws_univerhair';
  const now = Math.floor(Date.now() / 1000);

  const result: BulkResult = { ok: true, emitted: 0, failed: 0, errors: [], credentialIds: [] };

  // Resolve workspace
  const [ws] = await db.select().from(workspaces).where(eq(workspaces.id, workspaceId)).limit(1);
  if (!ws) {
    result.ok = false;
    result.errors.push({ row: -1, error: 'workspace_not_found' });
    return result;
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

      // Upsert recipient
      const existing = await db
        .select()
        .from(recipients)
        .where(eq(recipients.email, row.email))
        .limit(1);

      let recipientId: string;
      if (existing[0] && existing[0].workspaceId === ws.id) {
        recipientId = existing[0].id;
      } else {
        const [created] = await db
          .insert(recipients)
          .values({
            id: ID.recipient(),
            workspaceId: ws.id,
            cpf,
            name: row.nome,
            email: row.email,
            phoneWhatsapp: row.whatsapp,
          })
          .returning();
        recipientId = created.id;
      }

      // Cria request approved
      const reqId = ID.request();
      await db.insert(certificateRequests).values({
        id: reqId,
        workspaceId: ws.id,
        recipientId,
        source: 'csv',
        courseName: row.curso,
        courseHours: row.horas,
        status: 'emitted',
        reviewedAt: now,
      });

      // Cria credential
      const credId = ID.credential();
      const hash = await computeCertHash({
        workspaceId: ws.id,
        recipientId,
        recipientName: row.nome,
        cpf,
        courseName: row.curso,
        courseHours: row.horas ?? null,
        issuedAt: now,
      });

      await db.insert(credentials).values({
        id: credId,
        workspaceId: ws.id,
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
