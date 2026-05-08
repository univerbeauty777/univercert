// UniverCert · Form Typeform-style fullscreen multi-step

import TypeformClient from './TypeformClient';

export const runtime = 'edge';

type Params = {
  searchParams: Promise<{ curso?: string; turma?: string }>;
};

export default async function SolicitarPage({ searchParams }: Params) {
  const { curso, turma } = await searchParams;
  return (
    <TypeformClient
      cursoPreenchido={curso ?? ''}
      turmaPreenchida={turma ?? ''}
      workspaceSlug="univerhair"
    />
  );
}
