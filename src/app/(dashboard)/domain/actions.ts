'use server';

// UniverCert · Domain server actions · Sprint 19

import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { getDb } from '@/db/client';
import { workspaces, auditLogs } from '@/db/schema';
import { ID } from '@/lib/ulid';
import { addCustomHostname, deleteCustomHostname, findCustomHostnameByName } from '@/lib/cloudflare-saas';
import { requireRole, RbacError } from '@/lib/rbac';

const HOSTNAME_RE = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$/i;
const RESERVED_BASES = ['univercert.net', 'univercert.pages.dev', 'localhost'];

export async function addDomainAction(args: { workspaceId: string; hostname: string }) {
  const hostname = args.hostname.toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '').trim();
  if (!HOSTNAME_RE.test(hostname)) return { ok: false as const, error: 'Hostname inválido' };
  if (RESERVED_BASES.some((r) => hostname === r || hostname.endsWith('.' + r))) {
    return { ok: false as const, error: 'Domínio reservado · use seu próprio domínio' };
  }
  if (hostname.length > 200) return { ok: false as const, error: 'Hostname muito longo' };

  try {
    const sess = await requireRole('admin');
    const db = getDb();

    // Verifica se já existe outro workspace com esse domain
    const [conflict] = await db.select().from(workspaces).where(eq(workspaces.customDomain, hostname)).limit(1);
    if (conflict && conflict.id !== sess.workspace.id) {
      return { ok: false as const, error: 'Esse domínio já está em uso por outro workspace' };
    }

    // Tenta adicionar no Cloudflare
    let cfResult: any = null;
    try {
      cfResult = await addCustomHostname(hostname);
    } catch (e) {
      console.error('CF add hostname failed:', e);
      // Se for "already exists", continua. Outros erros, fail
      const msg = (e as Error).message;
      if (!msg.includes('already exists') && !msg.includes('1409')) {
        return { ok: false as const, error: `Cloudflare: ${msg}` };
      }
    }

    // Atualiza workspace
    await db
      .update(workspaces)
      .set({ customDomain: hostname, updatedAt: Math.floor(Date.now() / 1000) })
      .where(eq(workspaces.id, sess.workspace.id));

    try {
      await db.insert(auditLogs).values({
        id: ID.auditLog(),
        workspaceId: sess.workspace.id,
        userId: sess.user.id,
        action: 'domain.add',
        entityType: 'workspace',
        entityId: sess.workspace.id,
        metadataJson: JSON.stringify({ hostname, cfHostnameId: cfResult?.id }),
      });
    } catch {}

    revalidatePath('/domain');
    return { ok: true as const, hostname, cfHostnameId: cfResult?.id };
  } catch (e) {
    if (e instanceof RbacError) return { ok: false as const, error: 'Sem permissão (Admin)' };
    return { ok: false as const, error: (e as Error).message };
  }
}

export async function removeDomainAction(args: { workspaceId: string }) {
  try {
    const sess = await requireRole('admin');
    const db = getDb();
    const [ws] = await db.select().from(workspaces).where(eq(workspaces.id, sess.workspace.id)).limit(1);
    if (!ws?.customDomain) return { ok: false, error: 'Sem domínio configurado' };

    // Tenta remover do Cloudflare
    try {
      const cfHostname = await findCustomHostnameByName(ws.customDomain);
      if (cfHostname?.id) await deleteCustomHostname(cfHostname.id);
    } catch (e) {
      console.error('CF delete failed:', e);
    }

    await db
      .update(workspaces)
      .set({ customDomain: null, updatedAt: Math.floor(Date.now() / 1000) })
      .where(eq(workspaces.id, sess.workspace.id));

    try {
      await db.insert(auditLogs).values({
        id: ID.auditLog(),
        workspaceId: sess.workspace.id,
        userId: sess.user.id,
        action: 'domain.remove',
        entityType: 'workspace',
        entityId: sess.workspace.id,
        metadataJson: JSON.stringify({ hostname: ws.customDomain }),
      });
    } catch {}

    revalidatePath('/domain');
    return { ok: true };
  } catch (e) {
    if (e instanceof RbacError) return { ok: false, error: 'Sem permissão' };
    return { ok: false, error: (e as Error).message };
  }
}

export async function checkDomainStatusAction(args: { workspaceId: string; hostname: string }) {
  try {
    const cf = await findCustomHostnameByName(args.hostname);
    if (!cf) return { ok: true as const, status: { ssl: 'pending' as const, verification: 'pending' as const } };
    return {
      ok: true as const,
      status: {
        ssl: (cf.ssl?.status === 'active' ? 'active' : cf.ssl?.status === 'failed' ? 'failed' : 'pending') as 'pending' | 'active' | 'failed',
        verification: (cf.status === 'active' ? 'active' : cf.status?.includes('fail') || cf.status?.includes('blocked') ? 'failed' : 'pending') as 'pending' | 'active' | 'failed',
      },
    };
  } catch (e) {
    return { ok: false as const, error: (e as Error).message };
  }
}
