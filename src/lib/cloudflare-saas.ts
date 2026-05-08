// UniverCert · Cloudflare for SaaS (Custom Hostnames API)
// Permite que tenants apontem cert.suaescola.com.br pro nosso Pages project.
// Doc: https://developers.cloudflare.com/cloudflare-for-platforms/cloudflare-for-saas/

import { getRequestContext } from '@cloudflare/next-on-pages';

const CF_API = 'https://api.cloudflare.com/client/v4';

function getCfCredentials() {
  const { env } = getRequestContext();
  const accountId = (env as any).CLOUDFLARE_ACCOUNT_ID || '4a89b58af57b3ffb99858479a75b1e61';
  const apiToken = (env as any).CLOUDFLARE_API_TOKEN as string | undefined;
  const zoneId = (env as any).CLOUDFLARE_ZONE_ID as string | undefined;
  if (!apiToken) throw new Error('CLOUDFLARE_API_TOKEN missing');
  if (!zoneId) throw new Error('CLOUDFLARE_ZONE_ID missing (zone do univercert.com.br)');
  return { accountId, apiToken, zoneId };
}

export type CustomHostname = {
  id: string;
  hostname: string;
  status: 'active' | 'pending' | 'pending_validation' | 'pending_deployment' | 'pending_blocked' | 'pending_migration' | 'pending_issuance' | 'active_redeploying' | 'moved' | 'pending_deletion' | 'deleted' | 'pending_blocked' | 'test_pending' | 'test_active' | 'test_active_apex' | 'test_blocked' | 'test_failed';
  ssl: {
    status: string;
    method?: string;
    type?: string;
  };
  verification_errors?: string[];
  ownership_verification?: { type: string; name: string; value: string };
};

/**
 * Adiciona um custom hostname (ex: cert.escola.com.br) ao Cloudflare for SaaS.
 * Cliente precisa criar CNAME apontando pro nosso fallback origin.
 */
export async function addCustomHostname(hostname: string): Promise<CustomHostname> {
  const { apiToken, zoneId } = getCfCredentials();
  const resp = await fetch(`${CF_API}/zones/${zoneId}/custom_hostnames`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      hostname,
      ssl: {
        method: 'http',
        type: 'dv',
        settings: { http2: 'on', min_tls_version: '1.2' },
        bundle_method: 'ubiquitous',
        wildcard: false,
      },
    }),
  });

  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`cf_add_hostname_${resp.status}: ${txt}`);
  }
  const data = await resp.json() as any;
  return data.result;
}

export async function getCustomHostname(id: string): Promise<CustomHostname | null> {
  const { apiToken, zoneId } = getCfCredentials();
  const resp = await fetch(`${CF_API}/zones/${zoneId}/custom_hostnames/${id}`, {
    headers: { Authorization: `Bearer ${apiToken}` },
  });
  if (!resp.ok) return null;
  const data = await resp.json() as any;
  return data.result;
}

export async function deleteCustomHostname(id: string): Promise<boolean> {
  const { apiToken, zoneId } = getCfCredentials();
  const resp = await fetch(`${CF_API}/zones/${zoneId}/custom_hostnames/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${apiToken}` },
  });
  return resp.ok;
}
