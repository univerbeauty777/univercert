// UniverCert · /solicitar/[ws]/[courseSlug] (publico, S22)

import { eq, and } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { workspaces, courses } from '@/db/schema';
import RequestFormClient from './RequestFormClient';
import type { RequirementsSchema } from '@/lib/course-requirements';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export default async function SolicitarPage({
  params,
}: {
  params: Promise<{ ws: string; courseSlug: string }>;
}) {
  const { ws: wsSlug, courseSlug } = await params;
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

        <RequestFormClient
          workspaceSlug={ws.slug}
          workspaceName={ws.name}
          courseSlug={course.slug}
          courseName={course.name}
          schema={schema}
        />

        <footer style={{ textAlign: 'center', marginTop: 32, fontSize: 12, color: '#9ca3af' }}>
          Powered by <a href="https://univercert.com.br" style={{ color: '#1B2D5E', textDecoration: 'none', fontWeight: 600 }}>UniverCert</a>
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
