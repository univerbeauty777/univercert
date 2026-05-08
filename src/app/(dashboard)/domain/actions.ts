'use server';

import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { getDb } from '@/db/client';
import { workspaces } from '@/db/schema';
import { addCustomHostname, deleteCustomHostname } from '@/lib/cloudflare-saas';

export async function addDomainAction(args: { workspaceId: string; hostname: string }) {
  try {
    const hostname = args.hostname.toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');
    if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(hostname)) {
      return { ok: false as const, error: 'hostname_invalido' };
    }

    // Tenta adicionar no Cloudflare
    let cfResult: any = null;
    try {
      cfResult = await addCustomHostname(hostname);
    } catch (e) {
      console.error('CF add hostname failed:', e);
      // Fallback: salvar mesmo sem Cloudflare se token não configurado
    }

    // Atualiza workspace
    const db = getDb();
    await db
      .update(workspaces)
      .set({ customDomain: hostname, updatedAt: Math.floor(Date.now() / 1000) })
      .where(eq(workspaces.id, args.workspaceId));

    revalidatePath('/domain');
    return { ok: true as const, hostname, cfHostnameId: cfResult?.id };
  } catch (e) {
    return { ok: false as const, error: (e as Error).message };
  }
}

export async function removeDomainAction(args: { workspaceId: string }) {
  const db = getDb();
  await db
    .update(workspaces)
    .set({ customDomain: null, updatedAt: Math.floor(Date.now() / 1000) })
    .where(eq(workspaces.id, args.workspaceId));
  revalidatePath('/domain');
  return { ok: true };
}
