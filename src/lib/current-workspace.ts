// UniverCert · Cookie de workspace ativo (S23)
// Cada user pode pertencer a varios workspaces. Cookie 'uc_current_ws' marca qual.

import { cookies } from 'next/headers';

const COOKIE_NAME = 'uc_current_ws';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;       // 1 ano

export async function getCurrentWorkspaceCookie(): Promise<string | null> {
  try {
    const c = await cookies();
    return c.get(COOKIE_NAME)?.value ?? null;
  } catch {
    return null;
  }
}

export async function setCurrentWorkspaceCookie(workspaceId: string): Promise<void> {
  const c = await cookies();
  c.set(COOKIE_NAME, workspaceId, {
    httpOnly: false,                       // client tambem precisa pra UI updates
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: COOKIE_MAX_AGE,
  });
}

export async function clearCurrentWorkspaceCookie(): Promise<void> {
  const c = await cookies();
  c.delete(COOKIE_NAME);
}
