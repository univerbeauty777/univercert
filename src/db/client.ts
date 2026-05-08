// UniverCert · D1 client + helpers
// Em produção (Cloudflare Pages) o D1 vem via env binding.
// Em dev local, @cloudflare/next-on-pages injeta via getRequestContext.

import { drizzle } from 'drizzle-orm/d1';
import { getRequestContext } from '@cloudflare/next-on-pages';
import * as schema from './schema';

export type DB = ReturnType<typeof drizzle<typeof schema>>;

/**
 * Get DB client tied to the current Cloudflare request context.
 * USE THIS in API routes, server components, server actions.
 */
export function getDb(): DB {
  const { env } = getRequestContext();
  // @ts-expect-error - DB binding is configured in wrangler.toml
  return drizzle(env.DB, { schema });
}

/**
 * Get R2 bucket binding for assets/PDFs.
 */
export function getAssetsBucket(): R2Bucket {
  const { env } = getRequestContext();
  // @ts-expect-error - ASSETS binding is configured in wrangler.toml
  return env.ASSETS as R2Bucket;
}

/**
 * Get KV namespace for cache.
 */
export function getCache(): KVNamespace {
  const { env } = getRequestContext();
  // @ts-expect-error - CACHE binding is configured in wrangler.toml
  return env.CACHE as KVNamespace;
}

export { schema };
