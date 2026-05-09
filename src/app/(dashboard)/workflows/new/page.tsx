// UniverCert · Workflow new · Sprint 17

import WorkflowEditor from '../WorkflowEditor';
import { DEFAULT_TEMPLATES } from '@/lib/workflow-template';

export const runtime = 'edge';

type SearchParams = Promise<{ event?: string; channel?: string }>;

export default async function NewWorkflowPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const event = (sp.event as any) ?? 'credential.issued';
  const channel = (sp.channel as any) ?? 'email';
  const key = `${channel}:${event}`;
  const def = DEFAULT_TEMPLATES[key] ?? { body: '' };

  return (
    <WorkflowEditor
      mode="new"
      initial={{
        id: '',
        name: '',
        channel,
        triggerEvent: event,
        subject: def.subject ?? '',
        bodyTemplate: def.body,
        isActive: true,
        delaySeconds: 0,
        abSubjectB: '',
      }}
    />
  );
}
