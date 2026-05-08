// UniverCert · Drizzle schema · espelha D1 univercert-mvp

import { sqliteTable, text, integer, uniqueIndex, index } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// 1. WORKSPACES
export const workspaces = sqliteTable('workspaces', {
  id: text('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  plan: text('plan').notNull().default('free'),
  status: text('status').notNull().default('active'),
  customDomain: text('custom_domain'),
  createdAt: integer('created_at').notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at').notNull().default(sql`(unixepoch())`),
});

// 2. USERS
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name'),
  imageUrl: text('image_url'),
  passwordHash: text('password_hash'),
  emailVerified: integer('email_verified').notNull().default(0),
  lastLoginAt: integer('last_login_at'),
  createdAt: integer('created_at').notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at').notNull().default(sql`(unixepoch())`),
});

// 3. WORKSPACE MEMBERS
export const workspaceMembers = sqliteTable(
  'workspace_members',
  {
    id: text('id').primaryKey(),
    workspaceId: text('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    role: text('role', { enum: ['admin', 'editor', 'aprovador', 'viewer'] }).notNull(),
    invitedAt: integer('invited_at').notNull().default(sql`(unixepoch())`),
    acceptedAt: integer('accepted_at'),
  },
  (t) => ({
    workspaceUserUnique: uniqueIndex('workspace_user_unique').on(t.workspaceId, t.userId),
  }),
);

// 4. BRAND KITS
export const brandKits = sqliteTable('brand_kits', {
  id: text('id').primaryKey(),
  workspaceId: text('workspace_id').notNull().unique().references(() => workspaces.id, { onDelete: 'cascade' }),
  logoUrl: text('logo_url'),
  faviconUrl: text('favicon_url'),
  primaryColor: text('primary_color').default('#6366F1'),
  secondaryColor: text('secondary_color').default('#EC4899'),
  fontFamily: text('font_family').default('Inter'),
  emailSenderName: text('email_sender_name'),
  emailSenderDomain: text('email_sender_domain'),
  whatsappPhoneId: text('whatsapp_phone_id'),
  updatedAt: integer('updated_at').notNull().default(sql`(unixepoch())`),
});

// 5. TEMPLATES
export const templates = sqliteTable(
  'templates',
  {
    id: text('id').primaryKey(),
    workspaceId: text('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    vertical: text('vertical'),
    layoutJson: text('layout_json').notNull(),
    thumbnailUrl: text('thumbnail_url'),
    isPublished: integer('is_published').notNull().default(0),
    createdBy: text('created_by').references(() => users.id),
    createdAt: integer('created_at').notNull().default(sql`(unixepoch())`),
    updatedAt: integer('updated_at').notNull().default(sql`(unixepoch())`),
  },
  (t) => ({
    workspaceIdx: index('idx_templates_workspace').on(t.workspaceId, t.isPublished),
  }),
);

// 6. RECIPIENTS
export const recipients = sqliteTable(
  'recipients',
  {
    id: text('id').primaryKey(),
    workspaceId: text('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
    cpf: text('cpf'),
    name: text('name').notNull(),
    email: text('email'),
    phoneWhatsapp: text('phone_whatsapp'),
    lgpdConsentAt: integer('lgpd_consent_at'),
    metadataJson: text('metadata_json'),
    createdAt: integer('created_at').notNull().default(sql`(unixepoch())`),
  },
  (t) => ({
    cpfIdx: index('idx_recipients_workspace_cpf').on(t.workspaceId, t.cpf),
    emailIdx: index('idx_recipients_workspace_email').on(t.workspaceId, t.email),
  }),
);

// 7. CERTIFICATE REQUESTS
export const certificateRequests = sqliteTable(
  'certificate_requests',
  {
    id: text('id').primaryKey(),
    workspaceId: text('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
    recipientId: text('recipient_id').references(() => recipients.id, { onDelete: 'set null' }),
    templateId: text('template_id').references(() => templates.id, { onDelete: 'set null' }),
    source: text('source', { enum: ['form', 'webhook', 'manual', 'csv'] }).notNull(),
    sourceDataJson: text('source_data_json'),
    courseName: text('course_name'),
    courseHours: integer('course_hours'),
    status: text('status', { enum: ['pending', 'approved', 'rejected', 'emitted'] }).notNull().default('pending'),
    reviewerId: text('reviewer_id').references(() => users.id),
    reviewedAt: integer('reviewed_at'),
    rejectionReason: text('rejection_reason'),
    createdAt: integer('created_at').notNull().default(sql`(unixepoch())`),
  },
  (t) => ({
    queueIdx: index('idx_requests_workspace_status').on(t.workspaceId, t.status, t.createdAt),
  }),
);

// 8. CREDENTIALS
export const credentials = sqliteTable(
  'credentials',
  {
    id: text('id').primaryKey(),
    workspaceId: text('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
    requestId: text('request_id').references(() => certificateRequests.id, { onDelete: 'set null' }),
    templateId: text('template_id').references(() => templates.id, { onDelete: 'set null' }),
    recipientId: text('recipient_id').notNull().references(() => recipients.id, { onDelete: 'cascade' }),
    pdfR2Key: text('pdf_r2_key'),
    pngR2Key: text('png_r2_key'),
    hashSha256: text('hash_sha256').notNull(),
    courseName: text('course_name').notNull(),
    courseHours: integer('course_hours'),
    metadataJson: text('metadata_json'),
    issuedAt: integer('issued_at').notNull().default(sql`(unixepoch())`),
    expiresAt: integer('expires_at'),
    revokedAt: integer('revoked_at'),
    revokeReason: text('revoke_reason'),
  },
  (t) => ({
    workspaceRecipientIdx: index('idx_credentials_workspace_recipient').on(t.workspaceId, t.recipientId),
    hashIdx: index('idx_credentials_hash').on(t.hashSha256),
  }),
);

// 9. VERIFY LOGS
export const verifyLogs = sqliteTable(
  'verify_logs',
  {
    id: text('id').primaryKey(),
    credentialId: text('credential_id').notNull().references(() => credentials.id, { onDelete: 'cascade' }),
    viewedAt: integer('viewed_at').notNull().default(sql`(unixepoch())`),
    ipCountry: text('ip_country'),
    ipCity: text('ip_city'),
    userAgent: text('user_agent'),
    referer: text('referer'),
  },
  (t) => ({
    credentialIdx: index('idx_verify_credential').on(t.credentialId, t.viewedAt),
  }),
);

// 10. INTEGRATIONS
export const integrations = sqliteTable(
  'integrations',
  {
    id: text('id').primaryKey(),
    workspaceId: text('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
    provider: text('provider', {
      enum: ['hotmart', 'memberkit', 'fluent', 'kiwify', 'eduzz', 'hubla', 'greenn', 'wordpress', 'zapier', 'api'],
    }).notNull(),
    configJson: text('config_json').notNull(),
    webhookSecret: text('webhook_secret'),
    isActive: integer('is_active').notNull().default(1),
    createdAt: integer('created_at').notNull().default(sql`(unixepoch())`),
  },
  (t) => ({
    workspaceIdx: index('idx_integrations_workspace').on(t.workspaceId, t.provider),
  }),
);

// 11. WEBHOOKS IN
export const webhooksIn = sqliteTable(
  'webhooks_in',
  {
    id: text('id').primaryKey(),
    workspaceId: text('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
    integrationId: text('integration_id').references(() => integrations.id, { onDelete: 'set null' }),
    provider: text('provider').notNull(),
    rawPayloadJson: text('raw_payload_json').notNull(),
    status: text('status', { enum: ['received', 'processed', 'error'] }).notNull().default('received'),
    errorMessage: text('error_message'),
    processedAt: integer('processed_at'),
    createdAt: integer('created_at').notNull().default(sql`(unixepoch())`),
  },
  (t) => ({
    workspaceIdx: index('idx_webhooks_in_workspace').on(t.workspaceId, t.status, t.createdAt),
  }),
);

// 12. WEBHOOKS OUT
export const webhooksOut = sqliteTable(
  'webhooks_out',
  {
    id: text('id').primaryKey(),
    workspaceId: text('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
    eventType: text('event_type').notNull(),
    targetUrl: text('target_url').notNull(),
    payloadJson: text('payload_json').notNull(),
    status: text('status', { enum: ['pending', 'sent', 'failed'] }).notNull().default('pending'),
    responseStatus: integer('response_status'),
    attempts: integer('attempts').notNull().default(0),
    nextRetryAt: integer('next_retry_at'),
    createdAt: integer('created_at').notNull().default(sql`(unixepoch())`),
  },
  (t) => ({
    workspaceIdx: index('idx_webhooks_out_workspace').on(t.workspaceId, t.status),
  }),
);

// 13. AUDIT LOGS
export const auditLogs = sqliteTable(
  'audit_logs',
  {
    id: text('id').primaryKey(),
    workspaceId: text('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
    userId: text('user_id').references(() => users.id),
    action: text('action').notNull(),
    entityType: text('entity_type'),
    entityId: text('entity_id'),
    metadataJson: text('metadata_json'),
    ip: text('ip'),
    createdAt: integer('created_at').notNull().default(sql`(unixepoch())`),
  },
  (t) => ({
    workspaceIdx: index('idx_audit_workspace_created').on(t.workspaceId, t.createdAt),
  }),
);

// 14. BILLING METER
export const billingMeter = sqliteTable(
  'billing_meter',
  {
    id: text('id').primaryKey(),
    workspaceId: text('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
    periodStart: integer('period_start').notNull(),
    periodEnd: integer('period_end').notNull(),
    certificatesEmitted: integer('certificates_emitted').notNull().default(0),
    whatsappsSent: integer('whatsapps_sent').notNull().default(0),
    emailsSent: integer('emails_sent').notNull().default(0),
    storageBytes: integer('storage_bytes').notNull().default(0),
  },
  (t) => ({
    periodUnique: uniqueIndex('billing_period_unique').on(t.workspaceId, t.periodStart),
  }),
);

// 15. SESSIONS (Better Auth)
export const sessions = sqliteTable(
  'sessions',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    token: text('token').notNull().unique(),
    expiresAt: integer('expires_at').notNull(),
    ip: text('ip'),
    userAgent: text('user_agent'),
    createdAt: integer('created_at').notNull().default(sql`(unixepoch())`),
  },
  (t) => ({
    tokenIdx: index('idx_sessions_token').on(t.token),
    userIdx: index('idx_sessions_user').on(t.userId),
  }),
);

// 16. ACCOUNTS (Better Auth · OAuth + credentials)
export const accounts = sqliteTable(
  'accounts',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: integer('access_token_expires_at'),
    refreshTokenExpiresAt: integer('refresh_token_expires_at'),
    scope: text('scope'),
    password: text('password'),
    createdAt: integer('created_at').notNull().default(sql`(unixepoch())`),
    updatedAt: integer('updated_at').notNull().default(sql`(unixepoch())`),
  },
  (t) => ({
    userIdx: index('idx_accounts_user').on(t.userId),
    providerAccountIdx: uniqueIndex('idx_accounts_provider_account').on(t.providerId, t.accountId),
  }),
);

// 17. VERIFICATIONS (Better Auth · email confirm, password reset)
export const verifications = sqliteTable(
  'verifications',
  {
    id: text('id').primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: integer('expires_at').notNull(),
    createdAt: integer('created_at').notNull().default(sql`(unixepoch())`),
    updatedAt: integer('updated_at').notNull().default(sql`(unixepoch())`),
  },
  (t) => ({
    identifierIdx: index('idx_verifications_identifier').on(t.identifier),
  }),
);

// Type exports
export type Workspace = typeof workspaces.$inferSelect;
export type User = typeof users.$inferSelect;
export type WorkspaceMember = typeof workspaceMembers.$inferSelect;
export type Template = typeof templates.$inferSelect;
export type Recipient = typeof recipients.$inferSelect;
export type CertificateRequest = typeof certificateRequests.$inferSelect;
export type Credential = typeof credentials.$inferSelect;
export type Integration = typeof integrations.$inferSelect;
export type Account = typeof accounts.$inferSelect;
export type Verification = typeof verifications.$inferSelect;
