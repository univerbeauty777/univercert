export const runtime = 'edge';

type Params = {
  searchParams: Promise<{ ref?: string; payment_id?: string; status?: string }>;
};

export default async function SucessoPage({ searchParams }: Params) {
  const sp = await searchParams;
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-success/10 to-white px-4">
      <div className="card max-w-lg w-full text-center">
        <div className="text-6xl mb-4">✅</div>
        <h1 className="text-2xl font-extrabold mb-2">Pagamento aprovado!</h1>
        <p className="text-gray-600 mb-6">
          Seu plano foi atualizado. Você pode emitir certificados imediatamente.
        </p>
        {sp.ref && (
          <p className="text-xs text-gray-400 font-mono mb-6">Protocolo: {sp.ref}</p>
        )}
        <a href="/dashboard" className="btn-primary inline-block">
          Ir para o dashboard →
        </a>
      </div>
    </main>
  );
}
