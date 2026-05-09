'use server';

import { eq, and } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { courses, workspaces, certificateRequests, recipients, credentials } from '@/db/schema';
import { ID } from '@/lib/ulid';
import { validateExtras, type RequirementsSchema, type ExtrasResponse } from '@/lib/course-requirements';
import { dispatchWorkflowsFor } from '@/lib/email-dispatcher';
import { computeCertHash } from '@/lib/credentials';

export async function getRequestByToken(token: string) {
  const db = getDb();
  const [r] = await db
    .select()
    .from(certificateRequests)
    .where(eq(certificateRequests.requestToken, token))
    .limit(1);
  if (!r) return null;
  return {
    id: r.id,
    status: r.status,
    submitterName: r.submitterName,
    submitterEmail: r.submitterEmail,
    courseName: r.courseName,
    extras: r.extrasJson ? safeJson(r.extrasJson) : {},
    rejectionReason: r.rejectionReason,
  };
}

function safeJson(s: string) { try { return JSON.parse(s); } catch { return {}; } }

export async function submitRevisionAction(args: {
  token: string;
  extras: ExtrasResponse;
}) {
  const db = getDb();
  const [r] = await db
    .select()
    .from(certificateRequests)
    .where(eq(certificateRequests.requestToken, args.token))
    .limit(1);
  if (!r) return { ok: false as const, error: 'token invalido' };
  if (r.status !== 'needs_revision' && r.status !== 'rejected') {
    return { ok: false as const, error: 'request nao está aguardando revisão' };
  }

  // Valida extras vs course schema
  if (r.courseId) {
    const [course] = await db.select().from(courses).where(eq(courses.id, r.courseId)).limit(1);
    if (course?.requirementsJson) {
      try {
        const schema = JSON.parse(course.requirementsJson) as RequirementsSchema;
        const errs = validateExtras(schema, args.extras);
        if (errs.length > 0) return { ok: false as const, error: errs.map((e) => e.message).join(' · ') };
      } catch {}
    }
  }

  // Anota revisão no historico
  let history: any[] = [];
  if (r.revisionsJson) {
    try { history = JSON.parse(r.revisionsJson); } catch {}
  }
  history.push({
    at: Math.floor(Date.now() / 1000),
    action: 'revision_submitted',
    previousExtras: r.extrasJson ? JSON.parse(r.extrasJson) : null,
  });

  await db
    .update(certificateRequests)
    .set({
      status: 'pending',                                  // volta pra fila
      extrasJson: JSON.stringify(args.extras),
      revisionsJson: JSON.stringify(history.slice(-10)),
      rejectionReason: null,
      reviewerId: null,
      reviewedAt: null,
    })
    .where(eq(certificateRequests.id, r.id));

  // Notifica time da escola que revisão chegou
  try {
    await dispatchWorkflowsFor({
      workspaceId: r.workspaceId,
      triggerEvent: 'request.submitted',
      channel: 'email',
    });
  } catch {}

  return { ok: true as const };
}

type SubmitInput = {
  workspaceSlug: string;
  courseSlug: string;
  submitterName: string;
  submitterEmail: string;
  cpf?: string;
  phone?: string;
  extras: ExtrasResponse;
};

export async function submitRequestAction(input: SubmitInput) {
  const db = getDb();

  if (!input.submitterName?.trim()) return { ok: false as const, error: 'Nome obrigatório' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.submitterEmail)) return { ok: false as const, error: 'Email inválido' };

  const [ws] = await db.select().from(workspaces).where(eq(workspaces.slug, input.workspaceSlug)).limit(1);
  if (!ws) return { ok: false as const, error: 'workspace não encontrado' };

  const [course] = await db
    .select()
    .from(courses)
    .where(and(eq(courses.workspaceId, ws.id), eq(courses.slug, input.courseSlug)))
    .limit(1);
  if (!course) return { ok: false as const, error: 'curso não encontrado' };
  if (course.isActive !== 1) return { ok: false as const, error: 'curso inativo' };
  if (course.isPublic !== 1) return { ok: false as const, error: 'form privado · use o link interno' };

  // Valida extras vs schema
  let schema: RequirementsSchema | null = null;
  if (course.requirementsJson) {
    try { schema = JSON.parse(course.requirementsJson) as RequirementsSchema; } catch {}
  }
  if (schema) {
    const errs = validateExtras(schema, input.extras);
    if (errs.length > 0) return { ok: false as const, error: errs.map((e) => e.message).join(' · '), validationErrors: errs };
  }

  // Upsert recipient (por email no workspace)
  const emailLower = input.submitterEmail.trim().toLowerCase();
  const [existing] = await db
    .select()
    .from(recipients)
    .where(and(eq(recipients.workspaceId, ws.id), eq(recipients.email, emailLower)))
    .limit(1);
  let recipientId = existing?.id;
  if (!recipientId) {
    const [created] = await db
      .insert(recipients)
      .values({
        id: ID.recipient(),
        workspaceId: ws.id,
        name: input.submitterName.trim(),
        email: emailLower,
        cpf: input.cpf ?? null,
        phoneWhatsapp: input.phone ?? null,
      })
      .returning();
    recipientId = created.id;
  }

  // Token pra magic link revisao
  const token = ID.session().replace('sess_', 'rt_');

  // Cria request
  const reqId = ID.request();
  const isAuto = course.autoApprove === 1 && (!schema || schema.fields.length === 0);

  await db.insert(certificateRequests).values({
    id: reqId,
    workspaceId: ws.id,
    recipientId,
    templateId: course.defaultTemplateId,
    courseId: course.id,
    courseName: course.name,
    courseHours: course.hours ?? null,
    source: 'form',
    sourceDataJson: JSON.stringify({ via: 'public_form', course_slug: course.slug }),
    extrasJson: JSON.stringify(input.extras),
    status: isAuto ? 'approved' : 'pending',
    submitterEmail: emailLower,
    submitterName: input.submitterName.trim(),
    requestToken: token,
  });

  // Se auto-approve E sem requisitos: emite cert direto
  let credentialId: string | undefined;
  if (isAuto) {
    try {
      const issuedAt = Math.floor(Date.now() / 1000);
      const credId = ID.credential();
      const hash = await computeCertHash({
        workspaceId: ws.id,
        recipientId,
        recipientName: input.submitterName.trim(),
        cpf: input.cpf ?? null,
        courseName: course.name,
        courseHours: course.hours ?? null,
        issuedAt,
      });
      const [cred] = await db
        .insert(credentials)
        .values({
          id: credId,
          workspaceId: ws.id,
          requestId: reqId,
          templateId: course.defaultTemplateId,
          recipientId,
          hashSha256: hash,
          courseName: course.name,
          courseHours: course.hours ?? null,
          issuedAt,
          metadataJson: JSON.stringify({ via: 'public_form', auto_approved: true, course_id: course.id }),
        })
        .returning();
      credentialId = cred.id;
      await dispatchWorkflowsFor({
        workspaceId: ws.id,
        triggerEvent: 'credential.issued',
        credentialId: cred.id,
        channel: 'email',
      });
    } catch (e) {
      console.error('[solicitar] auto-issue failed', (e as Error).message);
    }
  } else {
    // Notifica time da escola que tem nova request (workflow trigger novo)
    try {
      await dispatchWorkflowsFor({
        workspaceId: ws.id,
        triggerEvent: 'request.created',
        channel: 'email',
      });
    } catch {}
  }

  return {
    ok: true as const,
    requestId: reqId,
    credentialId,
    autoIssued: isAuto,
    token,
  };
}
