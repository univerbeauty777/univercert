// UniverCert · /integrations/fluent · Wizard 4 steps

import PageHeader from '@/components/PageHeader';
import FluentWizardClient from './FluentWizardClient';
import { getFluentConfig } from './actions';
import { eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { workspaces } from '@/db/schema';
import { CERT_VARIANTS } from '@/lib/cert-template';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export default async function FluentIntegrationPage() {
  const db = getDb();
  const [ws] = await db.select().from(workspaces).where(eq(workspaces.slug, 'univerhair')).limit(1);

  const cfgResult = await getFluentConfig();
  const config = cfgResult.ok ? cfgResult.config : undefined;
  const secret = cfgResult.ok ? cfgResult.secret : null;

  return (
    <main className="page">
      <PageHeader
        title="FluentCommunity × UniverCert"
        subtitle="Plugin WordPress que emite certificado automaticamente quando aluno conclui curso no FluentCommunity."
        badge={<span className="badge badge-brand">UniverHair</span>}
      />

      <FluentWizardClient
        workspaceSlug={ws?.slug ?? 'univerhair'}
        workspaceName={ws?.name ?? 'UniverCert'}
        initialSecret={secret ?? null}
        initialConfig={config ?? { auto_approve: true, send_email: true, default_template: 'classic', course_template_map: {} }}
        templateOptions={CERT_VARIANTS.map((v) => ({ id: v.id, name: v.name }))}
      />
    </main>
  );
}
