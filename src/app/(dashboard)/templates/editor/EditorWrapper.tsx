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
        try {
          const r = await saveTemplateV2Action({ templateId, name, layout });
          if (!r) {
            return { ok: false, error: 'resposta vazia do servidor (action retornou undefined)' };
          }
          if (r.ok && !templateId) {
            router.push(`/templates/editor?id=${r.templateId}`);
          }
          return r;
        } catch (e) {
          // eslint-disable-next-line no-console
          console.error('[editor] save crash:', e);
          return { ok: false, error: (e as Error)?.message ?? 'erro desconhecido' };
        }
      }}
    />
  );
}
