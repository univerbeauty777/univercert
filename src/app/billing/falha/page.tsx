export const runtime = 'edge';

export default function FalhaPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-danger/10 to-white px-4">
      <div className="card max-w-lg w-full text-center">
        <div className="text-6xl mb-4">❌</div>
        <h1 className="text-2xl font-extrabold mb-2">Pagamento não aprovado</h1>
        <p className="text-gray-600 mb-6">
          Não foi possível processar seu pagamento. Por favor, tente novamente ou entre em contato.
        </p>
        <a href="/billing" className="btn-primary inline-block">
          Tentar novamente
        </a>
      </div>
    </main>
  );
}
