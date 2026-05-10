// UniverCert · /api/v1/workspace/brand (S62b)

import { eq, sql } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { workspaceBrand } from '@/db/schema';
import { requireRole, RbacError } from '@/lib/rbac';

export const runtime = 'edge';

export async function GET() {
  let sess;
  try { sess = await requireRole('viewer'); }
  catch (e) {
    if (e instanceof RbacError) return Response.json({ ok: false, error: e.code }, { status: 401 });
    throw e;
  }
  const db = getDb();
  const [row] = await db.select().from(workspaceBrand).where(eq(workspaceBrand.workspaceId, sess.workspace.id)).limit(1);
  return Response.json({
    ok: true,
    brand: row ?? {
      workspaceId: sess.workspace.id,
      displayName: sess.workspace.name,
      tagline: null, description: null, logoUrl: null, coverUrl: null, brandColor: '#1B2D5E',
      websiteUrl: null, socialInstagram: null, socialYoutube: null, socialLinkedin: null,
      emailPublic: null, showCertCount: 1, showRecentCerts: 1, showCourses: 1, testimonialsJson: null,
    },
  });
}

export async function PATCH(req: Request) {
  let sess;
  try { sess = await requireRole('admin'); }
  catch (e) {
    if (e instanceof RbacError) return Response.json({ ok: false, error: e.code }, { status: 401 });
    throw e;
  }

  const body = await req.json().catch(() => ({})) as Record<string, any>;
  const wsId = sess.workspace.id;
  const db = getDb();

  const update: any = { updatedAt: Math.floor(Date.now() / 1000) };
  const allowedStr = ['displayName', 'tagline', 'description', 'logoUrl', 'coverUrl', 'brandColor',
    'websiteUrl', 'socialInstagram', 'socialYoutube', 'socialLinkedin', 'emailPublic', 'testimonialsJson'];
  const allowedBool = ['showCertCount', 'showRecentCerts', 'showCourses'];

  for (const k of allowedStr) if (k in body) update[k] = body[k] == null ? null : String(body[k]).slice(0, 2000);
  for (const k of allowedBool) if (k in body) update[k] = body[k] ? 1 : 0;

  // Upsert
  const [existing] = await db.select().from(workspaceBrand).where(eq(workspaceBrand.workspaceId, wsId)).limit(1);
  if (existing) {
    await db.update(workspaceBrand).set(update).where(eq(workspaceBrand.workspaceId, wsId));
  } else {
    await db.insert(workspaceBrand).values({ workspaceId: wsId, ...update } as any);
  }

  return Response.json({ ok: true });
}
