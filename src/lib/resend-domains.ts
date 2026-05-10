// UniverCert · Resend domains API wrapper (S61)
// https://resend.com/docs/api-reference/domains/create-domain

import { getRequestContext } from '@cloudflare/next-on-pages';

function key(): string {
  const { env } = getRequestContext();
  const k = (env as any).RESEND_API_KEY;
  if (!k) throw new Error('RESEND_API_KEY nao configurada');
  return k;
}

async function resendFetch<T = any>(path: string, init: RequestInit = {}): Promise<T> {
  const r = await fetch(`https://api.resend.com${path}`, {
    ...init,
    headers: {
      'authorization': `Bearer ${key()}`,
      'content-type': 'application/json',
      ...init.headers,
    },
  });
  if (!r.ok) {
    const errText = await r.text();
    throw new Error(`Resend ${r.status}: ${errText.slice(0, 300)}`);
  }
  return await r.json() as T;
}

export type ResendDomain = {
  id: string;
  name: string;
  status: 'pending' | 'verified' | 'failure' | 'temporary_failure' | 'not_started';
  region: string;
  created_at: string;
  records: Array<{ record: string; name: string; type: string; ttl: string; status: string; value: string; priority?: number }>;
};

export async function createResendDomain(domain: string, region: string = 'us-east-1'): Promise<ResendDomain> {
  return resendFetch<ResendDomain>('/domains', {
    method: 'POST',
    body: JSON.stringify({ name: domain, region }),
  });
}

export async function getResendDomain(id: string): Promise<ResendDomain> {
  return resendFetch<ResendDomain>(`/domains/${id}`);
}

export async function verifyResendDomain(id: string): Promise<ResendDomain> {
  return resendFetch<ResendDomain>(`/domains/${id}/verify`, { method: 'POST' });
}

export async function deleteResendDomain(id: string): Promise<void> {
  await resendFetch(`/domains/${id}`, { method: 'DELETE' });
}
