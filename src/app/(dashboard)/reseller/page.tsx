// UniverCert · Reseller program

export const runtime = 'edge';

export default function ResellerPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-8 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 animate-slide-up">
          <div className="inline-block text-xs font-bold text-primary uppercase tracking-widest mb-2">
            🇧🇷 UniverCert Partners
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            Revenda UniverCert white-label
          </h1>
          <p className="text-gray-600 mt-3 max-w-2xl">
            Ofereça a plataforma com sua marca para suas escolas-cliente. Você cobra o que quiser,
            paga preço de atacado, e mantém comissão recorrente vitalícia.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Stat label="Comissão recorrente" value="30%" subtitle="vitalícia em cada cliente" />
          <Stat label="Desconto atacado" value="50% off" subtitle="sobre o tier base" />
          <Stat label="Onboarding white-label" value="< 10min" subtitle="cert.escola.com.br" />
        </div>

        <div className="card mb-6">
          <h2 className="text-xl font-extrabold mb-4">Como funciona</h2>
          <ol className="space-y-3 text-sm text-gray-700">
            <Step n={1}>
              Você se torna parceiro UniverCert (gratuito · sem mensalidade)
            </Step>
            <Step n={2}>
              Indica clientes pelo seu link único (ex: <code>univercert.net/r/voceabc</code>)
            </Step>
            <Step n={3}>
              Cliente assina via seu link → você ganha <strong>30% recorrente</strong> sobre tudo
              que ele paga, pra sempre
            </Step>
            <Step n={4}>
              Pagamentos automáticos no dia 5 do mês via Pix ou conta bancária
            </Step>
            <Step n={5}>
              Dashboard exclusivo com seus clientes, MRR, retenção, etc.
            </Step>
          </ol>
        </div>

        <div className="card mb-6">
          <h2 className="text-xl font-extrabold mb-3">Pra quem é</h2>
          <ul className="grid md:grid-cols-2 gap-2 text-sm text-gray-700">
            <li className="flex gap-2"><span className="text-success">✓</span> Agências de marketing digital pra cursos</li>
            <li className="flex gap-2"><span className="text-success">✓</span> Consultores de plataformas educacionais</li>
            <li className="flex gap-2"><span className="text-success">✓</span> Designers que vendem branding pra escolas</li>
            <li className="flex gap-2"><span className="text-success">✓</span> Influenciadores de educação</li>
            <li className="flex gap-2"><span className="text-success">✓</span> Grupos de escolas associadas</li>
            <li className="flex gap-2"><span className="text-success">✓</span> Resellers SaaS BR</li>
          </ul>
        </div>

        <div className="card bg-gradient-to-br from-primary-soft to-accent/5 border-primary/30 text-center py-12">
          <h2 className="text-2xl font-extrabold mb-3">Quero ser parceiro</h2>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Programa em pré-lançamento. Os primeiros 10 parceiros pegam <strong>40% de comissão</strong> ao invés de 30%.
          </p>
          <a
            href="mailto:diegoxp12@me.com?subject=UniverCert%20Partners%20%E2%80%94%20Quero%20ser%20parceiro"
            className="btn-primary text-base px-7 py-3.5 inline-flex"
          >
            Enviar email
          </a>
        </div>
      </div>
    </main>
  );
}

function Stat({ label, value, subtitle }: { label: string; value: string; subtitle: string }) {
  return (
    <div className="card hover:border-primary/40 transition">
      <div className="text-xs uppercase tracking-wider text-gray-400 font-bold">{label}</div>
      <div className="text-3xl font-extrabold mt-1 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
        {value}
      </div>
      <div className="text-xs text-gray-500 mt-1">{subtitle}</div>
    </div>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex gap-3 items-start">
      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center">
        {n}
      </div>
      <div className="pt-0.5">{children}</div>
    </li>
  );
}
