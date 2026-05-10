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
  workflow: () => id('wf'),
  invite: () => id('inv'),
  emailEvent: () => id('em'),
  errorEvent: () => id('err'),
  asset: () => id('ast'),
  shareEvent: () => id('shr'),
  aiJob: () => id('aij'),
  subscription: () => id('sub'),
  invoice: () => id('inv2'),
  apiKey: () => id('apk'),
  marketplace: () => id('mkt'),
  affiliate: () => id('aff'),
  referral: () => id('ref2'),
  partnerApp: () => id('pap'),
  embedView: () => id('ev'),
  webhookEndpoint: () => id('whe'),
  webhookDelivery: () => id('whd'),
};
