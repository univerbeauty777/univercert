'use server';

import { revalidatePath } from 'next/cache';
import { issueCredentialFromRequest, rejectRequest as rejectRequestFn } from '@/lib/credentials';
import { notifyRecipient } from '@/lib/notify';

export async function approveRequestAction(requestId: string) {
  try {
    const { credential, alreadyEmitted } = await issueCredentialFromRequest(requestId, null);
    // Notify in background (não bloqueia)
    if (!alreadyEmitted) {
      notifyRecipient(credential.id).catch((e) => console.error('notify failed:', e));
    }
    revalidatePath('/queue');
    revalidatePath('/dashboard');
    revalidatePath('/credentials');
    return { ok: true as const, credentialId: credential.id, alreadyEmitted };
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

export async function bulkApproveAction(requestIds: string[]) {
  let approved = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const id of requestIds) {
    try {
      const { credential } = await issueCredentialFromRequest(id, null);
      notifyRecipient(credential.id).catch(() => {});
      approved++;
    } catch (e) {
      failed++;
      errors.push(`${id}: ${(e as Error).message}`);
    }
  }
  revalidatePath('/queue');
  revalidatePath('/dashboard');
  revalidatePath('/credentials');
  return { ok: true as const, approved, failed, errors };
}
