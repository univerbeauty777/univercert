// UniverCert · RBAC types & constants (client-safe, no next/headers)
// Pode ser importado tanto em server quanto client components.

export type Role = 'admin' | 'editor' | 'aprovador' | 'viewer';

// Hierarquia: admin > editor > aprovador > viewer
export const ROLE_LEVEL: Record<Role, number> = {
  admin: 4,
  editor: 3,
  aprovador: 2,
  viewer: 1,
};

export const ROLE_LABELS: Record<Role, string> = {
  admin: 'Admin',
  editor: 'Editor',
  aprovador: 'Aprovador',
  viewer: 'Viewer',
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  admin: 'Acesso total · convida usuários · billing · domínio · pode revogar certs',
  editor: 'Cria/edita templates · workflows · bulk emit · não mexe em billing',
  aprovador: 'Aprova/rejeita requests · emite cert · não cria templates',
  viewer: 'Só leitura · vê dashboard, fila, certs, alunos',
};

export function hasPermission(userRole: Role, requiredRole: Role): boolean {
  return ROLE_LEVEL[userRole] >= ROLE_LEVEL[requiredRole];
}
