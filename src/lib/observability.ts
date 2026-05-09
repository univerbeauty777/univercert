// UniverCert · Observability (S18)
// captureError() pra logar 5xx no D1 + getMetrics() pra dashboard interno.

import { eq, and, sql, gte, desc, count } from 'drizzle-orm';
import { getDb } from '@/db/client';
import {
  errorEvents,
  emailEvents,
  credentials,
  certificateRequests,
  users,
  workspaces,
  verifyLogs,
} from '@/db/schema';
import { ID } from '@/lib/ulid';

export type CaptureErrorInput = {
  path: string;
  method?: string;
  statusCode?: number;
  error: Error | string;
  userId?: string | null;
  workspaceId?: string | null;
  userAgent?: string | null;
  ipAddress?: string | null;
  metadata?: Record<string, unknown>;
};

/**
 * Loga erro no D1. Nunca throws (defensivo — captureError nao pode quebrar tudo).
 * Pode ser chamado de qualquer route handler num try/catch.
 */
export async function captureError(input: CaptureErrorInput): Promise<void> {
  try {
    const db = getDb();
    const errMsg = typeof input.error === 'string' ? input.error : input.error.message;
    const errStack = typeof input.error === 'string' ? undefined : input.error.stack;

    await db.insert(errorEvents).values({
      id: ID.errorEvent(),
      path: input.path,
      method: input.method ?? null,
      statusCode: input.statusCode ?? null,
      errorMessage: (errMsg ?? '').slice(0, 1000),
      errorStack: errStack?.slice(0, 4000) ?? null,
      userAgent: input.userAgent?.slice(0, 500) ?? null,
      ipAddress: input.ipAddress ?? null,
      userId: input.userId ?? null,
      workspaceId: input.workspaceId ?? null,
      metadataJson: input.metadata ? JSON.stringify(input.metadata).slice(0, 2000) : null,
    });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('[observability] captureError failed', (e as Error)?.message);
  }
}

/**
 * Wrapper convenience pra rotas: captura + retorna 500.
 */
export async function captureAndRespond(
  request: Request,
  error: unknown,
  statusCode = 500,
): Promise<Response> {
  const url = new URL(request.url);
  await captureError({
    path: url.pathname,
    method: request.method,
    statusCode,
    error: error as Error,
    userAgent: request.headers.get('user-agent'),
    ipAddress:
      request.headers.get('cf-connecting-ip') ??
      request.headers.get('x-forwarded-for') ??
      undefined,
  });
  return Response.json(
    { error: 'internal_server_error', message: 'Algo deu errado. Tente novamente.' },
    { status: statusCode },
  );
}

export type HealthMetrics = {
  signupsLast7d: number;
  signupsLast24h: number;
  certsLast7d: number;
  certsLast24h: number;
  pendingNow: number;
  workspacesTotal: number;
  errors24h: number;
  errorsTopPaths: { path: string; count: number }[];
  emailsSent24h: number;
  emailsFailed24h: number;
  emailDeliveryRate: number;        // 0..1
  recentErrors: Array<{
    id: string;
    path: string;
    statusCode: number | null;
    errorMessage: string | null;
    occurredAt: number;
  }>;
  recentEmails: Array<{
    id: string;
    recipientEmail: string;
    subject: string | null;
    status: string;
    sentAt: number | null;
    createdAt: number;
  }>;
  verifyViews24h: number;
};

const now = () => Math.floor(Date.now() / 1000);
const SECONDS_24H = 24 * 3600;
const SECONDS_7D = 7 * SECONDS_24H;

export async function getMetrics(): Promise<HealthMetrics> {
  const db = getDb();
  const t = now();
  const t24h = t - SECONDS_24H;
  const t7d = t - SECONDS_7D;

  const [
    [signups7d],
    [signups24h],
    [certs7d],
    [certs24h],
    [pending],
    [workspacesCount],
    [errors24h],
    [emailsSent],
    [emailsFailed],
    [verifyViews],
    topPaths,
    recentErrors,
    recentEmails,
  ] = await Promise.all([
    db.select({ value: count() }).from(users).where(sql`unixepoch(${users.createdAt}) >= ${t7d}`),
    db.select({ value: count() }).from(users).where(sql`unixepoch(${users.createdAt}) >= ${t24h}`),
    db.select({ value: count() }).from(credentials).where(gte(credentials.issuedAt, t7d)),
    db.select({ value: count() }).from(credentials).where(gte(credentials.issuedAt, t24h)),
    db.select({ value: count() }).from(certificateRequests).where(eq(certificateRequests.status, 'pending')),
    db.select({ value: count() }).from(workspaces),
    db.select({ value: count() }).from(errorEvents).where(gte(errorEvents.occurredAt, t24h)),
    db.select({ value: count() }).from(emailEvents).where(and(eq(emailEvents.status, 'sent'), gte(emailEvents.createdAt, t24h))),
    db.select({ value: count() }).from(emailEvents).where(and(eq(emailEvents.status, 'failed'), gte(emailEvents.createdAt, t24h))),
    db.select({ value: count() }).from(verifyLogs).where(gte(verifyLogs.viewedAt, t24h)),
    db
      .select({ path: errorEvents.path, c: count() })
      .from(errorEvents)
      .where(gte(errorEvents.occurredAt, t24h))
      .groupBy(errorEvents.path)
      .orderBy(desc(sql`count(*)`))
      .limit(5),
    db
      .select()
      .from(errorEvents)
      .orderBy(desc(errorEvents.occurredAt))
      .limit(15),
    db
      .select()
      .from(emailEvents)
      .orderBy(desc(emailEvents.createdAt))
      .limit(15),
  ]);

  const sentN = emailsSent?.value ?? 0;
  const failedN = emailsFailed?.value ?? 0;
  const totalEmails = sentN + failedN;
  const deliveryRate = totalEmails > 0 ? sentN / totalEmails : 1;

  return {
    signupsLast7d: signups7d?.value ?? 0,
    signupsLast24h: signups24h?.value ?? 0,
    certsLast7d: certs7d?.value ?? 0,
    certsLast24h: certs24h?.value ?? 0,
    pendingNow: pending?.value ?? 0,
    workspacesTotal: workspacesCount?.value ?? 0,
    errors24h: errors24h?.value ?? 0,
    errorsTopPaths: topPaths.map((p) => ({ path: p.path, count: Number(p.c) })),
    emailsSent24h: sentN,
    emailsFailed24h: failedN,
    emailDeliveryRate: deliveryRate,
    verifyViews24h: verifyViews?.value ?? 0,
    recentErrors: recentErrors.map((e) => ({
      id: e.id,
      path: e.path,
      statusCode: e.statusCode ?? null,
      errorMessage: e.errorMessage ?? null,
      occurredAt: e.occurredAt,
    })),
    recentEmails: recentEmails.map((e) => ({
      id: e.id,
      recipientEmail: e.recipientEmail,
      subject: e.subject ?? null,
      status: e.status,
      sentAt: e.sentAt ?? null,
      createdAt: e.createdAt,
    })),
  };
}
