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

// 2. USERS — schema Better Auth compatible
// Sprint 12 fix: 'image' (não imageUrl) é o nome esperado pelo Better Auth.
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name'),
  image: text('image'), // Better Auth standard
  imageUrl: text('image_url'), // legacy, mantido pra compat
  passwordHash: text('password_hash'),
  emailVerified: integer('email_verified', { mode: 'boolean' }).notNull().default(false),
  lastLoginAt: integer('last_login_at', { mode: 'timestamp' }),
  // Sprint 19 fix: mode 'timestamp' p/ Better Auth poder passar Date direto
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
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
    courseId: text('course_id'),                                              // S22 — opcional FK pra courses
    status: text('status').notNull().default('pending'),                      // S22 — relax enum: 'pending' | 'approved' | 'rejected' | 'emitted' | 'needs_revision'
    reviewerId: text('reviewer_id').references(() => users.id),
    reviewedAt: integer('reviewed_at'),
    rejectionReason: text('rejection_reason'),
    extrasJson: text('extras_json'),                                          // S22 — respostas do form
    revisionsJson: text('revisions_json'),                                    // S22 — historico [{by, at, comment, fields}]
    requestToken: text('request_token'),                                      // S22 — magic link reenvio
    submitterEmail: text('submitter_email'),                                  // S22 — email confirmado
    submitterName: text('submitter_name'),
    createdAt: integer('created_at').notNull().default(sql`(unixepoch())`),
  },
  (t) => ({
    queueIdx: index('idx_requests_workspace_status').on(t.workspaceId, t.status, t.createdAt),
    courseIdx: index('idx_requests_course').on(t.courseId, t.status),
    tokenIdx: index('idx_requests_token').on(t.requestToken),
    emailIdx: index('idx_requests_email').on(t.submitterEmail),
  }),
);

// 21. COURSES (S22 — entidade formal de curso por workspace)
export const courses = sqliteTable(
  'courses',
  {
    id: text('id').primaryKey(),
    workspaceId: text('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
    slug: text('slug').notNull(),
    name: text('name').notNull(),
    description: text('description'),
    hours: integer('hours'),
    defaultTemplateId: text('default_template_id').references(() => templates.id, { onDelete: 'set null' }),
    requirementsJson: text('requirements_json'),
    vertical: text('vertical'),
    isPublic: integer('is_public').notNull().default(1),
    isActive: integer('is_active').notNull().default(1),
    autoApprove: integer('auto_approve').notNull().default(0),
    createdAt: integer('created_at').notNull().default(sql`(unixepoch())`),
    updatedAt: integer('updated_at').notNull().default(sql`(unixepoch())`),
  },
  (t) => ({
    wsSlugIdx: uniqueIndex('idx_courses_ws_slug').on(t.workspaceId, t.slug),
    wsActiveIdx: index('idx_courses_ws_active').on(t.workspaceId, t.isActive),
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
    // Sprint 19 fix: mode 'timestamp' p/ aceitar Date do Better Auth
    expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
    ip: text('ip'), // legacy
    ipAddress: text('ip_address'), // Better Auth standard (migration 0008)
    userAgent: text('user_agent'),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
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
    // Sprint 19 fix: mode 'timestamp' p/ Better Auth Date passthrough
    accessTokenExpiresAt: integer('access_token_expires_at', { mode: 'timestamp' }),
    refreshTokenExpiresAt: integer('refresh_token_expires_at', { mode: 'timestamp' }),
    scope: text('scope'),
    password: text('password'),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  },
  (t) => ({
    userIdx: index('idx_accounts_user').on(t.userId),
    providerAccountIdx: uniqueIndex('idx_accounts_provider_account').on(t.providerId, t.accountId),
  }),
);

// 18b. INVITES (Sprint 15 · convite de usuário a workspace)
export const invites = sqliteTable(
  'invites',
  {
    id: text('id').primaryKey(),
    workspaceId: text('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
    email: text('email').notNull(),
    role: text('role', { enum: ['admin', 'editor', 'aprovador', 'viewer'] }).notNull(),
    token: text('token').notNull().unique(),
    invitedByUserId: text('invited_by_user_id').references(() => users.id, { onDelete: 'set null' }),
    expiresAt: integer('expires_at').notNull(),
    acceptedAt: integer('accepted_at'),
    acceptedByUserId: text('accepted_by_user_id').references(() => users.id, { onDelete: 'set null' }),
    revokedAt: integer('revoked_at'),
    createdAt: integer('created_at').notNull().default(sql`(unixepoch())`),
  },
  (t) => ({
    workspaceIdx: index('idx_invites_workspace').on(t.workspaceId, t.acceptedAt),
    emailIdx: index('idx_invites_email').on(t.email, t.acceptedAt),
    tokenIdx: index('idx_invites_token').on(t.token),
  }),
);

// 18. WORKFLOWS (Sprint 17 · custom email/WhatsApp templates)
export const workflows = sqliteTable(
  'workflows',
  {
    id: text('id').primaryKey(),
    workspaceId: text('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    channel: text('channel', { enum: ['email', 'whatsapp'] }).notNull(),
    triggerEvent: text('trigger_event').notNull(),       // 'credential.issued' | 'credential.revoked' | 'request.created' | 'request.submitted' | 'request.needs_revision' | 'nps.d7'
    subject: text('subject'),
    bodyTemplate: text('body_template').notNull(),
    isActive: integer('is_active').notNull().default(1),
    delaySeconds: integer('delay_seconds').notNull().default(0),
    abSubjectB: text('ab_subject_b'),
    metadataJson: text('metadata_json'),
    createdAt: integer('created_at').notNull().default(sql`(unixepoch())`),
    updatedAt: integer('updated_at').notNull().default(sql`(unixepoch())`),
  },
  (t) => ({
    workspaceTriggerIdx: index('idx_workflows_workspace').on(t.workspaceId, t.triggerEvent, t.isActive),
    workspaceChannelIdx: index('idx_workflows_workspace_channel').on(t.workspaceId, t.channel),
  }),
);

// 17. VERIFICATIONS (Better Auth · email confirm, password reset)
export const verifications = sqliteTable(
  'verifications',
  {
    id: text('id').primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    // Sprint 19 fix: mode 'timestamp' p/ Better Auth Date passthrough
    expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  },
  (t) => ({
    identifierIdx: index('idx_verifications_identifier').on(t.identifier),
  }),
);

// 19. EMAIL_EVENTS (S18 — log de envios via Resend)
export const emailEvents = sqliteTable(
  'email_events',
  {
    id: text('id').primaryKey(),
    workspaceId: text('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
    recipientEmail: text('recipient_email').notNull(),
    subject: text('subject'),
    bodyPreview: text('body_preview'),
    status: text('status', { enum: ['queued', 'sent', 'failed', 'bounced', 'opened', 'clicked'] }).notNull(),
    provider: text('provider').default('resend'),
    providerMessageId: text('provider_message_id'),
    errorMessage: text('error_message'),
    workflowId: text('workflow_id').references(() => workflows.id, { onDelete: 'set null' }),
    credentialId: text('credential_id').references(() => credentials.id, { onDelete: 'set null' }),
    triggeredByEvent: text('triggered_by_event'),
    sentAt: integer('sent_at'),
    openedAt: integer('opened_at'),
    clickedAt: integer('clicked_at'),
    createdAt: integer('created_at').notNull().default(sql`(unixepoch())`),
  },
  (t) => ({
    workspaceIdx: index('idx_email_events_workspace').on(t.workspaceId, t.createdAt),
    statusIdx: index('idx_email_events_status').on(t.status),
    providerMsgIdx: index('idx_email_events_provider_msg').on(t.providerMessageId),
  }),
);

// 20. ERROR_EVENTS (S18 — captureError())
export const errorEvents = sqliteTable(
  'error_events',
  {
    id: text('id').primaryKey(),
    path: text('path').notNull(),
    method: text('method'),
    statusCode: integer('status_code'),
    errorMessage: text('error_message'),
    errorStack: text('error_stack'),
    userAgent: text('user_agent'),
    ipAddress: text('ip_address'),
    userId: text('user_id'),
    workspaceId: text('workspace_id'),
    metadataJson: text('metadata_json'),
    occurredAt: integer('occurred_at').notNull().default(sql`(unixepoch())`),
  },
  (t) => ({
    recentIdx: index('idx_error_events_recent').on(t.occurredAt),
    pathIdx: index('idx_error_events_path').on(t.path),
  }),
);

// 22. ASSETS (S22c — biblioteca de uploads R2)
export const assets = sqliteTable(
  'assets',
  {
    id: text('id').primaryKey(),
    workspaceId: text('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
    r2Key: text('r2_key').notNull().unique(),
    kind: text('kind').notNull(),
    contentType: text('content_type'),
    sizeBytes: integer('size_bytes'),
    originalName: text('original_name'),
    templateId: text('template_id'),
    uploadedBy: text('uploaded_by'),
    createdAt: integer('created_at').notNull().default(sql`(unixepoch())`),
  },
  (t) => ({
    wsIdx: index('idx_assets_workspace').on(t.workspaceId, t.kind, t.createdAt),
    keyIdx: index('idx_assets_r2_key').on(t.r2Key),
  }),
);

// 23. SHARE EVENTS (S26 — recipient WOW tracking)
export const shareEvents = sqliteTable(
  'share_events',
  {
    id: text('id').primaryKey(),
    credentialId: text('credential_id').notNull().references(() => credentials.id, { onDelete: 'cascade' }),
    workspaceId: text('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
    channel: text('channel').notNull(),
    ipHash: text('ip_hash'),
    userAgent: text('user_agent'),
    referer: text('referer'),
    occurredAt: integer('occurred_at').notNull().default(sql`(unixepoch())`),
  },
  (t) => ({
    credIdx: index('idx_share_events_cred').on(t.credentialId, t.occurredAt),
    wsIdx: index('idx_share_events_ws').on(t.workspaceId, t.occurredAt),
    chIdx: index('idx_share_events_channel').on(t.workspaceId, t.channel, t.occurredAt),
  }),
);

// 24. WORKSPACE BRAND (S31 — issuer profile pages)
export const workspaceBrand = sqliteTable('workspace_brand', {
  workspaceId: text('workspace_id').primaryKey().references(() => workspaces.id, { onDelete: 'cascade' }),
  displayName: text('display_name'),
  tagline: text('tagline'),
  description: text('description'),
  logoUrl: text('logo_url'),
  coverUrl: text('cover_url'),
  brandColor: text('brand_color'),
  websiteUrl: text('website_url'),
  socialInstagram: text('social_instagram'),
  socialYoutube: text('social_youtube'),
  socialLinkedin: text('social_linkedin'),
  emailPublic: text('email_public'),
  showCertCount: integer('show_cert_count').notNull().default(1),
  showRecentCerts: integer('show_recent_certs').notNull().default(1),
  showCourses: integer('show_courses').notNull().default(1),
  testimonialsJson: text('testimonials_json'),
  updatedAt: integer('updated_at').notNull().default(sql`(unixepoch())`),
  createdAt: integer('created_at').notNull().default(sql`(unixepoch())`),
});

// 26. AI JOBS (S28 — Claude API calls tracking)
export const aiJobs = sqliteTable(
  'ai_jobs',
  {
    id: text('id').primaryKey(),
    workspaceId: text('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
    userId: text('user_id'),
    jobType: text('job_type').notNull(),
    model: text('model').notNull(),
    status: text('status').notNull().default('pending'),
    inputSummary: text('input_summary'),
    inputTokens: integer('input_tokens'),
    outputTokens: integer('output_tokens'),
    costBrlCents: integer('cost_brl_cents'),
    resultJson: text('result_json'),
    errorMessage: text('error_message'),
    durationMs: integer('duration_ms'),
    createdAt: integer('created_at').notNull().default(sql`(unixepoch())`),
    completedAt: integer('completed_at'),
  },
  (t) => ({
    wsIdx: index('idx_ai_jobs_ws').on(t.workspaceId, t.createdAt),
    typeIdx: index('idx_ai_jobs_type').on(t.workspaceId, t.jobType, t.createdAt),
    statusIdx: index('idx_ai_jobs_status').on(t.status, t.createdAt),
  }),
);

// 25. ISSUER KEYS (S29 — Open Badges 3.0 / W3C VC signing)
export const issuerKeys = sqliteTable('issuer_keys', {
  workspaceId: text('workspace_id').primaryKey().references(() => workspaces.id, { onDelete: 'cascade' }),
  did: text('did').notNull(),
  publicKeyJwk: text('public_key_jwk'),
  algorithm: text('algorithm').notNull().default('EdDSA'),
  createdAt: integer('created_at').notNull().default(sql`(unixepoch())`),
});

// Type exports
export type Workspace = typeof workspaces.$inferSelect;
export type ShareEvent = typeof shareEvents.$inferSelect;
export type WorkspaceBrand = typeof workspaceBrand.$inferSelect;
export type IssuerKey = typeof issuerKeys.$inferSelect;
export type AiJob = typeof aiJobs.$inferSelect;
export type EmailEvent = typeof emailEvents.$inferSelect;
export type ErrorEvent = typeof errorEvents.$inferSelect;
export type User = typeof users.$inferSelect;
export type WorkspaceMember = typeof workspaceMembers.$inferSelect;
export type Template = typeof templates.$inferSelect;
export type Recipient = typeof recipients.$inferSelect;
export type CertificateRequest = typeof certificateRequests.$inferSelect;
export type Credential = typeof credentials.$inferSelect;
export type Integration = typeof integrations.$inferSelect;
export type Account = typeof accounts.$inferSelect;
export type Verification = typeof verifications.$inferSelect;
