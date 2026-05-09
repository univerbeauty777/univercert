'use server';

import { eq, and, desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { getDb } from '@/db/client';
import { courses } from '@/db/schema';
import { ID } from '@/lib/ulid';
import { requireRole, RbacError } from '@/lib/rbac';
import type { RequirementsSchema } from '@/lib/course-requirements';

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export async function listCoursesAction() {
  const sess = await requireRole('viewer');
  const db = getDb();
  const list = await db
    .select()
    .from(courses)
    .where(eq(courses.workspaceId, sess.workspace.id))
    .orderBy(desc(courses.updatedAt));
  return { ok: true as const, courses: list };
}

export async function getCourseAction(id: string) {
  const sess = await requireRole('viewer');
  const db = getDb();
  const [c] = await db
    .select()
    .from(courses)
    .where(and(eq(courses.id, id), eq(courses.workspaceId, sess.workspace.id)))
    .limit(1);
  if (!c) return { ok: false as const, error: 'curso nao encontrado' };
  return { ok: true as const, course: c };
}

type CourseInput = {
  name: string;
  slug?: string;
  description?: string;
  hours?: number;
  defaultTemplateId?: string;
  requirementsJson?: RequirementsSchema | null;
  vertical?: string;
  isPublic?: boolean;
  isActive?: boolean;
  autoApprove?: boolean;
};

export async function upsertCourseAction(args: CourseInput & { id?: string }) {
  try {
    const sess = await requireRole('editor');
    const db = getDb();
    const slug = (args.slug && slugify(args.slug)) || slugify(args.name);
    if (!slug) return { ok: false as const, error: 'slug obrigatorio' };

    const reqsStr = args.requirementsJson ? JSON.stringify(args.requirementsJson) : null;
    if (reqsStr && reqsStr.length > 50_000) {
      return { ok: false as const, error: 'requirements muito grande (>50KB)' };
    }

    if (args.id) {
      const [existing] = await db
        .select()
        .from(courses)
        .where(and(eq(courses.id, args.id), eq(courses.workspaceId, sess.workspace.id)))
        .limit(1);
      if (!existing) return { ok: false as const, error: 'curso nao encontrado' };

      await db
        .update(courses)
        .set({
          name: args.name,
          slug,
          description: args.description ?? null,
          hours: args.hours ?? null,
          defaultTemplateId: args.defaultTemplateId ?? null,
          requirementsJson: reqsStr,
          vertical: args.vertical ?? null,
          isPublic: args.isPublic === false ? 0 : 1,
          isActive: args.isActive === false ? 0 : 1,
          autoApprove: args.autoApprove ? 1 : 0,
          updatedAt: Math.floor(Date.now() / 1000),
        })
        .where(eq(courses.id, args.id));
      revalidatePath('/courses');
      revalidatePath(`/courses/${args.id}`);
      return { ok: true as const, courseId: args.id, slug };
    }

    // Insert novo
    const id = ID.template().replace('tpl_', 'crs_');
    await db.insert(courses).values({
      id,
      workspaceId: sess.workspace.id,
      slug,
      name: args.name,
      description: args.description ?? null,
      hours: args.hours ?? null,
      defaultTemplateId: args.defaultTemplateId ?? null,
      requirementsJson: reqsStr,
      vertical: args.vertical ?? null,
      isPublic: args.isPublic === false ? 0 : 1,
      isActive: args.isActive === false ? 0 : 1,
      autoApprove: args.autoApprove ? 1 : 0,
    });
    revalidatePath('/courses');
    return { ok: true as const, courseId: id, slug };
  } catch (e) {
    if (e instanceof RbacError) return { ok: false as const, error: 'sem permissao (editor+)' };
    return { ok: false as const, error: (e as Error).message };
  }
}

export async function deleteCourseAction(id: string) {
  try {
    const sess = await requireRole('admin');
    const db = getDb();
    await db.delete(courses).where(and(eq(courses.id, id), eq(courses.workspaceId, sess.workspace.id)));
    revalidatePath('/courses');
    return { ok: true as const };
  } catch (e) {
    if (e instanceof RbacError) return { ok: false as const, error: 'sem permissao (admin)' };
    return { ok: false as const, error: (e as Error).message };
  }
}
