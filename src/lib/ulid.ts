// UniverCert · ID generator (edge-safe)// Usa ULID (Universally Unique Lexicographically Sortable Identifier).
// 26 caracteres, ordenável por tempo, URL-safe, melhor que UUID v4 para DBs.

function makeUlid(): string { return globalThis.crypto.randomUUID().replaceAll('-', '').toUpperCase(); }/**
 * Generate a prefixed ULID.
 * @example id('cred') => 'cred_01HK3...'
 */
export function id(prefix: string): string {
  return `${prefix}_${makeUlid()}`;
}

// Prefixos padronizados por entidade
export const ID = {
  workspace: () => id('ws'),
  user: () => id('usr'),
  workspaceMember: () => id('wm'),
  brandKit: () => id('bk'),
  template: () => id('tpl'),
  recipient: () => id('rcp'),
  request: () => id('req'),
  credential: () => id('cred'),
  verifyLog: () => id('vl'),
  integration: () => id('int'),
  webhookIn: () => id('whi'),
  webhookOut: () => id('who'),
  auditLog: () => id('aud'),
  session: () => id('sess'),
};
