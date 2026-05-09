'use client';

import { useRouter } from 'next/navigation';
import TemplateEditorV2 from './TemplateEditorV2';
import { saveTemplateV2Action } from './actions';
import type { LayoutV2 } from '@/lib/layout-v2';

export default function EditorWrapper({
  templateId,
  templateName,
  initialLayout,
}: {
  templateId?: string;
  templateName?: string;
  initialLayout?: LayoutV2;
}) {
  const router = useRouter();
  return (
    <TemplateEditorV2
      templateId={templateId}
      templateName={templateName}
      initialLayout={initialLayout}
      onSave={async (layout, name) => {
        const r = await saveTemplateV2Action({ templateId, name, layout });
        if (r.ok && !templateId) {
          router.push(`/templates/editor?id=${r.templateId}`);
        }
        return r;
      }}
    />
  );
}
