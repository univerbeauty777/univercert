// UniverCert · landing page (placeholder · landing real está em /outputs/univercert-landing.html)

export const runtime = 'edge';

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-16 bg-gradient-to-br from-primary-soft to-white">
      <div className="max-w-2xl text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-primary/20 rounded-full text-xs font-bold text-primary uppercase tracking-wider mb-6">
          🇧🇷 A plataforma brasileira de certificados
        </div>
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6 leading-tight">
          Emita certificados que seus alunos{' '}
          <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            querem compartilhar.
          </span>
        </h1>
        <p className="text-lg text-gray-600 mb-8 max-w-xl mx-auto">
          Certificados digitais profissionais, verificáveis e enviáveis por <strong>WhatsApp</strong>.
          Integrado com Hotmart, Memberkit, Fluent Community.
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <a href="/sign-in" className="btn-primary">
            Começar grátis →
          </a>
          <a href="/uh/solicitar" className="btn-secondary">
            Solicitar meu certificado
          </a>
        </div>
        <p className="text-xs text-gray-400 mt-8">
          Provisionado em Cloudflare · D1 + R2 + Workers · LGPD-ready
        </p>
      </div>
    </main>
  );
}
