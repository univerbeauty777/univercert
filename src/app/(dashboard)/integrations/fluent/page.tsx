// UniverCert · /integrations/fluent · Wizard 4 steps

import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import PageHeader from '@/components/PageHeader';
import FluentWizardClient from './FluentWizardClient';
import { getFluentConfig } from './actions';
import { getCurrentSession, hasPermission } from '@/lib/rbac';
import { getDb } from '@/db/client';
import { templates } from '@/db/schema';
import { CERT_VARIANTS } from '@/lib/cert-template';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export default async function FluentIntegrationPage() {
  const sess = await getCurrentSession();
  if (!sess) redirect('/sign-in');
  if (!hasPermission(sess.member.role, 'editor')) redirect('/dashboard');

  const ws = sess.workspace;

  const cfgResult = await getFluentConfig();
  const config = cfgResult.ok ? cfgResult.config : undefined;
  const secret = cfgResult.ok ? cfgResult.secret : null;

  // Templates customizados salvos deste workspace — pra poder mapear curso → template próprio.
  const db = getDb();
  const customTpls = await db
    .select({ id: templates.id, name: templates.name })
    .from(templates)
    .where(eq(templates.workspaceId, ws.id));

  const templateOptions = [
    ...customTpls.map((t) => ({ id: t.id, name: `★ ${t.name}` })),
    ...CERT_VARIANTS.map((v) => ({ id: v.id, name: v.name })),
  ];

  return (
    <main className="page">
      <PageHeader
        title="FluentCommunity × UniverCert"
        subtitle="Plugin WordPress que emite certificado automaticamente quando aluno conclui curso no FluentCommunity."
        badge={<span className="badge badge-brand">{ws.name}</span>}
      />

      <FluentWizardClient
        workspaceSlug={ws.slug}
        workspaceName={ws.name}
        initialSecret={secret ?? null}
        initialConfig={config ?? { auto_approve: true, send_email: true, default_template: 'classic', course_template_map: {} }}
        templateOptions={templateOptions}
      />
    </main>
  );
}
