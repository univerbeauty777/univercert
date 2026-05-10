// UniverCert · GET /api/v1/queue/stream (S30 SSE realtime)
// Server-Sent Events: poll do D1 a cada 5s + push diff pro client.
// Cloudflare Workers tem limite de ~30s por request — client reconnect via EventSource auto.

import { eq, and, desc, gt } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { certificateRequests } from '@/db/schema';
import { requireRole, RbacError } from '@/lib/rbac';

export const runtime = 'edge';

export async function GET(req: Request) {
  let sess;
  try {
    sess = await requireRole('viewer');
  } catch (e) {
    if (e instanceof RbacError) return new Response('unauthorized', { status: 401 });
    throw e;
  }
  const wsId = sess.workspace.id;

  const url = new URL(req.url);
  const sinceParam = parseInt(url.searchParams.get('since') ?? '0', 10) || 0;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let lastTs = sinceParam || Math.floor(Date.now() / 1000);
      const send = (event: string, data: any) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      // hello
      send('hello', { ts: Math.floor(Date.now() / 1000), workspaceId: wsId });

      const tick = async () => {
        try {
          const db = getDb();
          // Pega novos requests + status changes
          const rows = await db
            .select({
              id: certificateRequests.id,
              courseName: certificateRequests.courseName,
              status: certificateRequests.status,
              createdAt: certificateRequests.createdAt,
              updatedAt: certificateRequests.updatedAt,
            })
            .from(certificateRequests)
            .where(and(eq(certificateRequests.workspaceId, wsId), gt(certificateRequests.updatedAt, lastTs)))
            .orderBy(desc(certificateRequests.updatedAt))
            .limit(50);

          if (rows.length > 0) {
            lastTs = Math.max(...rows.map((r) => r.updatedAt ?? lastTs));
            send('requests', { rows, lastTs });
          } else {
            send('ping', { ts: Math.floor(Date.now() / 1000) });
          }
        } catch (e) {
          send('error', { error: (e as Error).message });
        }
      };

      // 5 ticks de 5s = 25s, dentro do limite Workers ~30s
      let count = 0;
      const max = 5;
      const interval = 5000;

      const loop = async () => {
        while (count < max) {
          await new Promise((res) => setTimeout(res, interval));
          count++;
          await tick();
        }
        send('reconnect', { reason: 'cf_workers_timeout', delay_ms: 1000 });
        controller.close();
      };
      loop();
    },
  });

  return new Response(stream, {
    headers: {
      'content-type': 'text/event-stream',
      'cache-control': 'no-cache, no-transform',
      'connection': 'keep-alive',
      'x-accel-buffering': 'no',
    },
  });
}
