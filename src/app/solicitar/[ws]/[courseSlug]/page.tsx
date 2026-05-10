// UniverCert · /solicitar/[ws]/[courseSlug] (publico, S22)

import { eq, and } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { workspaces, courses } from '@/db/schema';
import RequestFormClient from './RequestFormClient';
import { getRequestByToken } from './actions';
import type { RequirementsSchema } from '@/lib/course-requirements';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export default async function SolicitarPage({
  params,
  searchParams,
}: {
  params: Promise<{ ws: string; courseSlug: string }>;
  searchParams: Promise<{ revise?: string }>;
}) {
  const { ws: wsSlug, courseSlug } = await params;
  const sp = await searchParams;
  const reviseToken = sp.revise;
  const db = getDb();

  const [ws] = await db.select().from(workspaces).where(eq(workspaces.slug, wsSlug)).limit(1);
  if (!ws) {
    return <NotFound title="Workspace não encontrado" />;
  }

  const [course] = await db
    .select()
    .from(courses)
    .where(and(eq(courses.workspaceId, ws.id), eq(courses.slug, courseSlug)))
    .limit(1);

  if (!course) return <NotFound title="Curso não encontrado" />;
  if (course.isActive !== 1) return <NotFound title="Curso desativado" />;
  if (course.isPublic !== 1) return <NotFound title="Form privado · use o link interno" />;

  let schema: RequirementsSchema = { version: 1, fields: [] };
  if (course.requirementsJson) {
    try { schema = JSON.parse(course.requirementsJson); } catch {}
  }

  // Modo revisão: pré-popula com dados da solicitação anterior
  let reviseInitial: { name: string; email: string; extras: Record<string, any>; reason: string | null } | null = null;
  if (reviseToken) {
    const req = await getRequestByToken(reviseToken);
    if (req) {
      reviseInitial = {
        name: req.submitterName ?? '',
        email: req.submitterEmail ?? '',
        extras: req.extras ?? {},
        reason: req.rejectionReason,
      };
    }
  }

  return (
    <main style={{ background: '#f9fafb', minHeight: '100vh', padding: '40px 16px' }}>
      <div style={{ maxWidth: 640, margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif' }}>
        <header style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 14, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 16 }}>
            <span style={{ color: '#1B2D5E' }}>univer</span>
            <span style={{ color: '#D4A937' }}>CERT</span>
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', color: '#111827', margin: 0 }}>
            {course.name}
          </h1>
          <p style={{ color: '#6b7280', marginTop: 8, fontSize: 15 }}>
            {ws.name} · {course.hours ? `${course.hours}h` : 'sem carga horária'}
          </p>
          {course.description && (
            <p style={{ color: '#374151', marginTop: 12, fontSize: 14, lineHeight: 1.6 }}>{course.description}</p>
          )}
        </header>

        {reviseInitial && (
          <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderLeft: '4px solid #ea580c', borderRadius: 8, padding: 16, marginBottom: 20 }}>
            <h2 style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 600, color: '#9a3412' }}>↺ Pedido de revisão</h2>
            <p style={{ margin: 0, fontSize: 13, color: '#7c2d12', lineHeight: 1.5 }}>
              {reviseInitial.reason ?? 'A escola pediu correções na sua solicitação. Ajuste os campos abaixo e reenvie.'}
            </p>
          </div>
        )}

        <RequestFormClient
          workspaceSlug={ws.slug}
          workspaceName={ws.name}
          courseSlug={course.slug}
          courseName={course.name}
          schema={schema}
          reviseToken={reviseInitial ? reviseToken : undefined}
          initialName={reviseInitial?.name ?? ''}
          initialEmail={reviseInitial?.email ?? ''}
          initialExtras={reviseInitial?.extras ?? {}}
        />

        <footer style={{ textAlign: 'center', marginTop: 32, fontSize: 12, color: '#9ca3af' }}>
          Powered by <a href="https://univercert.net" style={{ color: '#1B2D5E', textDecoration: 'none', fontWeight: 600 }}>UniverCert</a>
        </footer>
      </div>
    </main>
  );
}

function NotFound({ title }: { title: string }) {
  return (
    <main style={{ background: '#f9fafb', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div style={{ textAlign: 'center', maxWidth: 400, padding: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', margin: 0 }}>{title}</h1>
        <p style={{ color: '#6b7280', marginTop: 8 }}>Verifique a URL ou contate a escola.</p>
      </div>
    </main>
  );
}

export const metadata = {
  title: 'Solicitar certificado · UniverCert',
  robots: { index: false, follow: false },
};
