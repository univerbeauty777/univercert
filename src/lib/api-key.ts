// UniverCert · API key helpers (S39)
// Format: 'uc_live_<32 random chars>'  /  'uc_test_<32>'
// Storage: SHA-256 hash + prefix (primeiros 12 chars pra UI)

import { eq, and, isNull, gt, sql, or } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { apiKeys } from '@/db/schema';
import { ID } from '@/lib/ulid';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

export type ApiKeyScope = 'read' | 'write' | 'admin';
export const SCOPE_HIERARCHY: Record<ApiKeyScope, number> = { read: 1, write: 2, admin: 3 };

export function generateApiKey(env: 'live' | 'test' = 'live'): string {
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  let s = '';
  for (let i = 0; i < arr.length; i++) s += ALPHABET[arr[i] % ALPHABET.length];
  return `uc_${env}_${s}`;
}

export async function hashKey(key: string): Promise<string> {
  const enc = new TextEncoder();
  const buf = await crypto.subtle.digest('SHA-256', enc.encode(key));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Cria nova api key — retorna a key plain text APENAS uma vez */
export async function createApiKey(args: {
  workspaceId: string;
  userId?: string;
  name: string;
  scope: ApiKeyScope;
  env?: 'live' | 'test';
  expiresAt?: number;
}): Promise<{ id: string; key: string; prefix: string }> {
  const env = args.env ?? 'live';
  const key = generateApiKey(env);
  const prefix = key.slice(0, 12); // 'uc_live_AAAA'
  const hash = await hashKey(key);
  const id = ID.apiKey();

  const db = getDb();
  await db.insert(apiKeys).values({
    id,
    workspaceId: args.workspaceId,
    createdByUserId: args.userId,
    name: args.name,
    prefix,
    hash,
    scope: args.scope,
    expiresAt: args.expiresAt,
  });

  return { id, key, prefix };
}

/** Verifica bearer token. Retorna api key + workspace_id se valida. */
export async function verifyApiKey(key: string): Promise<{ id: string; workspaceId: string; scope: ApiKeyScope } | null> {
  if (!key.startsWith('uc_live_') && !key.startsWith('uc_test_')) return null;
  const hash = await hashKey(key);
  const db = getDb();
  const now = Math.floor(Date.now() / 1000);

  const [row] = await db.select().from(apiKeys)
    .where(and(
      eq(apiKeys.hash, hash),
      isNull(apiKeys.revokedAt),
      or(isNull(apiKeys.expiresAt), gt(apiKeys.expiresAt, now)),
    ))
    .limit(1);

  if (!row) return null;

  // Bump usage counter (atomic) — fire and forget
  db.update(apiKeys).set({
    lastUsedAt: now,
    requestCount: sql`${apiKeys.requestCount} + 1`,
  }).where(eq(apiKeys.id, row.id)).catch(() => {});

  return { id: row.id, workspaceId: row.workspaceId, scope: row.scope as ApiKeyScope };
}

/** Verifica se scope da key cobre o requerido */
export function hasScopePermission(keyScope: ApiKeyScope, required: ApiKeyScope): boolean {
  return SCOPE_HIERARCHY[keyScope] >= SCOPE_HIERARCHY[required];
}

/** Extrai bearer token de Authorization header */
export function extractBearer(req: Request): string | null {
  const auth = req.headers.get('authorization') ?? '';
  if (!auth.startsWith('Bearer ')) return null;
  return auth.slice(7).trim() || null;
}

export async function revokeApiKey(id: string, workspaceId: string, reason?: string): Promise<boolean> {
  const db = getDb();
  await db.update(apiKeys).set({
    revokedAt: Math.floor(Date.now() / 1000),
    revokedReason: reason ?? 'manual',
  }).where(and(eq(apiKeys.id, id), eq(apiKeys.workspaceId, workspaceId)));
  return true;
}
