// UniverCert · form público de solicitação de certificado UniverHair
// Fluxo: aluno conclui curso na Fluent → vem pra cá → preenche → entra na fila

export const runtime = 'edge';

export default function SolicitarPage({
  searchParams,
}: {
  searchParams: { curso?: string; turma?: string };
}) {
  const cursoPreenchido = searchParams.curso ?? '';
  const turmaPreenchida = searchParams.turma ?? '';

  return (
    <main className="min-h-screen bg-gradient-to-br from-primary-soft to-white py-12 px-4">
      <div className="max-w-xl mx-auto">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold">
            🏆
          </div>
          <span className="text-xl font-extrabold">
            Univer<span className="text-primary">Cert</span>
          </span>
        </div>

        <div className="card">
          <div className="mb-6">
            <h1 className="text-2xl font-extrabold mb-2">Solicitar meu certificado</h1>
            <p className="text-sm text-gray-600">
              Você concluiu o curso{' '}
              {cursoPreenchido && <strong>"{cursoPreenchido}"</strong>}
              {!cursoPreenchido && <span className="text-gray-400">(selecione abaixo)</span>}.
              Preencha os dados e nossa equipe valida em até 48h.
            </p>
          </div>

          <form action="/api/v1/requests" method="POST" className="space-y-4">
            <input type="hidden" name="source" value="form" />
            <input type="hidden" name="workspace_slug" value="univerhair" />
            {turmaPreenchida && <input type="hidden" name="turma" value={turmaPreenchida} />}

            <div>
              <label className="label" htmlFor="curso">
                Curso concluído
              </label>
              <input
                className="input"
                type="text"
                id="curso"
                name="curso"
                defaultValue={cursoPreenchido}
                placeholder="ex: Coloração Avançada"
                required
              />
            </div>

            <div>
              <label className="label" htmlFor="nome">
                Nome completo (como vai aparecer no certificado)
              </label>
              <input className="input" type="text" id="nome" name="nome" required />
            </div>

            <div>
              <label className="label" htmlFor="cpf">
                CPF
              </label>
              <input
                className="input"
                type="text"
                id="cpf"
                name="cpf"
                placeholder="000.000.000-00"
                inputMode="numeric"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label" htmlFor="email">
                  Email
                </label>
                <input className="input" type="email" id="email" name="email" required />
              </div>
              <div>
                <label className="label" htmlFor="whatsapp">
                  WhatsApp
                </label>
                <input
                  className="input"
                  type="tel"
                  id="whatsapp"
                  name="whatsapp"
                  placeholder="(11) 99999-9999"
                  required
                />
              </div>
            </div>

            <div>
              <label className="label" htmlFor="data_conclusao">
                Data de conclusão
              </label>
              <input
                className="input"
                type="date"
                id="data_conclusao"
                name="data_conclusao"
                required
              />
            </div>

            <label className="flex items-start gap-2 cursor-pointer text-sm text-gray-600">
              <input
                type="checkbox"
                name="lgpd_consent"
                required
                className="mt-1 accent-primary"
              />
              <span>
                Aceito que a UniverHair use meus dados para emitir e validar este certificado, conforme a{' '}
                <a href="/privacidade" className="text-primary underline">
                  política de privacidade LGPD
                </a>
                .
              </span>
            </label>

            <button type="submit" className="btn-primary w-full justify-center">
              Solicitar certificado →
            </button>
          </form>
        </div>

        <p className="text-xs text-center text-gray-400 mt-6">
          Validação em até 48h · você receberá email + WhatsApp quando estiver pronto
        </p>
      </div>
    </main>
  );
}
