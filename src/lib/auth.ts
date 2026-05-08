// UniverCert · auth (placeholder Sprint 0)
// Sprint 1: integrar Better Auth (better-auth + drizzle adapter) com D1.
// Por enquanto stub para o build passar.

export type SessionUser = {
  id: string;
  email: string;
  name?: string;
  workspaceId: string;
  role: 'admin' | 'editor' | 'aprovador' | 'viewer';
};

/**
 * Stub: retorna null no Sprint 0.
 * Sprint 1: ler cookie de sessão, consultar D1 sessions table, retornar user.
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  return null;
}

/**
 * Stub: throw no Sprint 0.
 * Sprint 1: redirecionar pra /sign-in se não logado.
 */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error('UNAUTHENTICATED');
  return user;
}
