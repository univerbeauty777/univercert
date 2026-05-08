'use server';

// UniverCert · Server Actions da fila de aprovação (Sprint 1)
// TODO: pegar reviewerId da session quando Better Auth estiver wired (Sprint 1.5)

import { revalidatePath } from 'next/cache';
import { issueCredentialFromRequest, rejectRequest as rejectRequestFn } from '@/lib/credentials';

export async function approveRequestAction(requestId: string) {
  try {
    const { credential, alreadyEmitted } = await issueCredentialFromRequest(requestId, null);
    revalidatePath('/queue');
    revalidatePath('/dashboard');
    return {
      ok: true as const,
      credentialId: credential.id,
      alreadyEmitted,
    };
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
