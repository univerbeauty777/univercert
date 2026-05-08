// UniverCert · página de confirmação após enviar form de solicitação

export const runtime = 'edge';

type Params = {
  searchParams: Promise<{ id?: string }>;
};

export default async function ObrigadoPage({ searchParams }: Params) {
  const { id } = await searchParams;

  return (
    <main className="min-h-screen bg-gradient-to-br from-primary-soft to-white py-16 px-4 flex items-center justify-center">
      <div className="max-w-lg text-center">
        <div className="text-6xl mb-6">✓</div>
        <h1 className="text-3xl font-extrabold mb-3">Solicitação recebida!</h1>
        <p className="text-gray-600 mb-6">
          Nossa equipe vai validar sua solicitação em até 48h. Você receberá um email e WhatsApp com o
          link do certificado quando estiver pronto.
        </p>
        {id && (
          <p className="text-xs font-mono text-gray-400 mb-6">
            Protocolo: {id}
          </p>
        )}
        <a href="/" className="btn-primary">
          Voltar à página inicial
        </a>
      </div>
    </main>
  );
}
