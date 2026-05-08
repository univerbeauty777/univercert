export const runtime = 'edge';

export default function PendentePage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-warning/10 to-white px-4">
      <div className="card max-w-lg w-full text-center">
        <div className="text-6xl mb-4">⏳</div>
        <h1 className="text-2xl font-extrabold mb-2">Pagamento pendente</h1>
        <p className="text-gray-600 mb-6">
          Estamos aguardando a confirmação do seu pagamento. Boletos podem levar até 3 dias úteis. Pix
          confirma em segundos. Cartão geralmente é instantâneo.
          <br /><br />
          Você receberá um email assim que aprovado.
        </p>
        <a href="/billing" className="btn-secondary inline-block">
          Voltar para Billing
        </a>
      </div>
    </main>
  );
}
