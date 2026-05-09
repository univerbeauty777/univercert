// UniverCert · fila de aprovação avançada (Sprint 8)

import { eq, and, desc, sql } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { certificateRequests, recipients } from '@/db/schema';
import QueueClient from './QueueClient';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

type Params = {
  searchParams: Promise<{ status?: string; q?: string; source?: string }>;
};

export default async function QueuePage({ searchParams }: Params) {
  const sp = await searchParams;
  const status = (sp.status as 'pending' | 'approved' | 'rejected' | 'emitted' | 'all') ?? 'pending';
  const search = sp.q ?? '';
  const sourceFilter = sp.source ?? 'all';

  const db = getDb();
  const workspaceId = 'ws_univerhair';

  const conditions = [eq(certificateRequests.workspaceId, workspaceId)];
  if (status !== 'all') conditions.push(eq(certificateRequests.status, status));
  if (sourceFilter !== 'all') {
    conditions.push(eq(certificateRequests.source, sourceFilter as any));
  }

  const list = await db
    .select({
      request: certificateRequests,
      recipient: recipients,
    })
    .from(certificateRequests)
    .leftJoin(recipients, eq(certificateRequests.recipientId, recipients.id))
    .where(and(...conditions))
    .orderBy(desc(certificateRequests.createdAt))
    .limit(200);

  // Filter por search no client
  const filtered = search
    ? list.filter(
        ({ request, recipient }) =>
          recipient?.name?.toLowerCase().includes(search.toLowerCase()) ||
          recipient?.email?.toLowerCase().includes(search.toLowerCase()) ||
          request.courseName?.toLowerCase().includes(search.toLowerCase()),
      )
    : list;

  // Counts por status
  const counts = await db
    .select({ status: certificateRequests.status, count: sql<number>`count(*)` })
    .from(certificateRequests)
    .where(eq(certificateRequests.workspaceId, workspaceId))
    .groupBy(certificateRequests.status);

  const countByStatus: Record<string, number> = {};
  counts.forEach((c) => (countByStatus[c.status] = c.count));

  return (
    <QueueClient
      requests={filtered.map(({ request, recipient }) => ({
        id: request.id,
        courseName: request.courseName,
        courseHours: request.courseHours,
        source: request.source,
        status: request.status,
        rejectionReason: request.rejectionReason,
        createdAt: request.createdAt,
        recipientName: recipient?.name ?? request.submitterName ?? null,
        recipientEmail: recipient?.email ?? request.submitterEmail ?? null,
        recipientCpf: recipient?.cpf ?? null,
        extrasJson: request.extrasJson,
        revisionsJson: request.revisionsJson,
        courseId: request.courseId,
      }))}
      currentStatus={status}
      currentSource={sourceFilter}
      currentSearch={search}
      counts={countByStatus}
    />
  );
}
