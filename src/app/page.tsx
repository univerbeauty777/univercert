// UniverCert · landing comercial

export const runtime = 'edge';

export default function HomePage() {
  return (
    <main className="bg-white">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/85 backdrop-blur border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold shadow-md shadow-primary/30">
              🏆
            </div>
            <span className="font-extrabold text-lg">
              Univer<span className="text-primary">Cert</span>
            </span>
          </a>
          <nav className="hidden md:flex gap-7 text-sm font-medium text-gray-600">
            <a href="#features" className="hover:text-primary">Recursos</a>
            <a href="#integracoes" className="hover:text-primary">Integrações</a>
            <a href="#precos" className="hover:text-primary">Preços</a>
          </nav>
          <div className="flex gap-2 items-center">
            <a href="/sign-in" className="text-sm text-gray-700 hover:text-primary px-3">Entrar</a>
            <a href="/sign-up" className="btn-primary text-sm">Começar grátis</a>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="py-20 px-6 bg-gradient-to-br from-primary-soft via-white to-accent/5">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-primary/20 rounded-full text-xs font-bold text-primary uppercase tracking-wider mb-6 shadow-sm">
            🇧🇷 A plataforma brasileira de certificados
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.05] mb-6">
            Emita certificados que seus alunos{' '}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              querem compartilhar.
            </span>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
            Certificados digitais profissionais, verificáveis e enviáveis por <strong>WhatsApp</strong>.
            Integrado com Hotmart, Memberkit, Fluent Community e Kiwify. Cobre em <strong>Pix, Boleto e Cartão</strong>.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <a href="/sign-up" className="btn-primary text-base px-7 py-3.5">
              Começar grátis →
            </a>
            <a href="#como-funciona" className="btn-secondary text-base px-7 py-3.5">
              Ver demo
            </a>
          </div>
          <div className="flex gap-5 justify-center text-xs text-gray-500 mt-8">
            <span>✓ 50 certificados grátis/mês</span>
            <span>✓ Sem cartão de crédito</span>
            <span>✓ LGPD-ready</span>
          </div>
        </div>
      </section>

      {/* TRUSTED BAR */}
      <div className="bg-gray-50 border-y border-gray-100 py-9">
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-center text-xs uppercase tracking-widest text-gray-400 font-bold mb-5">
            Construído pra escolas brasileiras que usam
          </p>
          <div className="flex gap-10 justify-center flex-wrap items-center text-sm font-semibold text-gray-400">
            <span>Hotmart</span>
            <span>Memberkit</span>
            <span>Fluent Community</span>
            <span>Kiwify</span>
            <span>Eduzz</span>
            <span>Hubla</span>
            <span>WordPress</span>
          </div>
        </div>
      </div>

      {/* FEATURES */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-block text-xs font-bold text-primary uppercase tracking-widest mb-3">Tudo que você precisa</div>
            <h2 className="text-4xl font-extrabold tracking-tight">Recursos pensados para o jeito brasileiro de ensinar.</h2>
            <p className="text-gray-600 mt-3 max-w-xl mx-auto">
              Plataformas gringas cobram em dólar e ignoram WhatsApp. UniverCert nasceu BR.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {FEATURES.map((f) => (
              <div key={f.title} className="card hover:border-primary/40 hover:-translate-y-0.5 transition-all">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent text-white text-xl flex items-center justify-center mb-4 shadow-md shadow-primary/30">
                  {f.emoji}
                </div>
                <h3 className="font-bold text-lg mb-1">{f.title}</h3>
                <p className="text-sm text-gray-600">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* INTEGRATIONS */}
      <section id="integracoes" className="py-20 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="text-xs font-bold text-primary uppercase tracking-widest mb-3">Integrações nativas</div>
            <h2 className="text-4xl font-extrabold tracking-tight">Conecta direto com as plataformas que você usa.</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {INTEGRATIONS.map((i) => (
              <div key={i.name} className="card text-center">
                <div className="font-bold text-sm">{i.name}</div>
                <div className="text-xs text-success mt-1 font-semibold uppercase tracking-wider">{i.tag}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="como-funciona" className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="text-xs font-bold text-primary uppercase tracking-widest mb-3">Em 4 passos</div>
            <h2 className="text-4xl font-extrabold tracking-tight">Do término do curso ao certificado no Zap em minutos.</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {STEPS.map((s, i) => (
              <div key={i} className="text-center">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-primary to-accent text-white text-xl font-extrabold flex items-center justify-center mb-4 shadow-lg shadow-primary/30">
                  {i + 1}
                </div>
                <h3 className="font-bold mb-1">{s.title}</h3>
                <p className="text-sm text-gray-600">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="precos" className="py-20 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <div className="text-xs font-bold text-primary uppercase tracking-widest mb-3">Preços</div>
            <h2 className="text-4xl font-extrabold tracking-tight">Em real. Sem letra miúda.</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {TIERS.map((t) => (
              <div
                key={t.name}
                className={`card flex flex-col ${t.popular ? 'border-2 border-primary -translate-y-2 shadow-xl shadow-primary/15' : ''}`}
              >
                {t.popular && (
                  <div className="text-xs font-bold text-white uppercase tracking-wider bg-gradient-to-r from-primary to-accent text-center py-1 -mt-9 mb-4 rounded-full mx-auto px-4 shadow-md w-fit">
                    Mais popular
                  </div>
                )}
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t.name}</div>
                <div className="text-3xl font-extrabold mt-2">
                  {t.price}
                  <span className="text-sm text-gray-400 font-medium">{t.period}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1 mb-4">{t.tagline}</p>
                <ul className="text-sm space-y-2 flex-1">
                  {t.features.map((f) => (
                    <li key={f} className="flex gap-2 text-gray-700"><span className="text-success font-bold">✓</span> {f}</li>
                  ))}
                </ul>
                <a
                  href={t.cta_href}
                  className={`mt-5 text-center font-bold text-sm py-2.5 rounded-xl transition-all ${
                    t.popular
                      ? 'bg-gradient-to-r from-primary to-primary-dark text-white shadow-md shadow-primary/30 hover:-translate-y-0.5'
                      : 'bg-gray-900 text-white hover:bg-gray-800'
                  }`}
                >
                  {t.cta}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-gradient-to-br from-gray-900 to-gray-800 text-white text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
            Pronto para emitir seu primeiro certificado em{' '}
            <span className="bg-gradient-to-r from-white to-accent bg-clip-text text-transparent">5 minutos</span>?
          </h2>
          <p className="text-white/70 mb-7 max-w-lg mx-auto">
            50 certificados grátis por mês. Sem cartão de crédito. Sem trial limitado.
          </p>
          <a href="/sign-up" className="btn-primary text-base px-8 py-3.5">
            Começar grátis →
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white/60 py-10 text-center text-xs">
        <p>© 2026 UniverCert · construído com Cloudflare D1 + R2 + Workers · LGPD-ready · feito no Brasil</p>
      </footer>
    </main>
  );
}

const FEATURES = [
  { emoji: '🎨', title: 'Editor + 50 templates BR', desc: 'Templates prontos para cabelo, estética, barbearia e cursos livres.' },
  { emoji: '📱', title: 'Envio por WhatsApp', desc: 'Aluno recebe no Zap em segundos. 4x mais visualizações que email.' },
  { emoji: '⚡', title: 'Emissão automática', desc: 'Hotmart, Memberkit, Fluent → certificado emitido sozinho.' },
  { emoji: '📋', title: 'Fila de aprovação', desc: 'Solicitações entram em fila. Você aprova em massa em 1 clique.' },
  { emoji: '🔐', title: 'Verify URL + QR', desc: 'Cada cert tem URL única que valida 24/7. QR embutido.' },
  { emoji: '💼', title: 'LinkedIn 1-click', desc: 'Botão pré-preenchido. Vira marketing orgânico para sua escola.' },
  { emoji: '💳', title: 'Pix · Boleto · Cartão', desc: 'Cobrança em formas que brasileiros pagam. NF-e automática.' },
  { emoji: '🏷', title: 'White-label', desc: 'cert.suaescola.com.br · brand kit · email custom · sem custo extra.' },
  { emoji: '📊', title: 'Analytics que importam', desc: 'Visualizações, downloads, shares. NPS automático D+7 via WhatsApp.' },
];

const INTEGRATIONS = [
  { name: 'Fluent Community', tag: '🇧🇷 Nativo' },
  { name: 'Hotmart', tag: '🇧🇷 Nativo' },
  { name: 'Memberkit', tag: '🇧🇷 Nativo' },
  { name: 'Kiwify', tag: '🇧🇷 Nativo' },
  { name: 'Eduzz', tag: '🇧🇷 Nativo' },
  { name: 'Hubla', tag: '🇧🇷 Nativo' },
  { name: 'WordPress', tag: 'Plugin' },
  { name: 'Zapier', tag: '5000+ apps' },
];

const STEPS = [
  { title: 'Aluno conclui', desc: 'Termina o curso na plataforma que você já usa.' },
  { title: 'Solicita / é direcionado', desc: 'Form ou webhook automático cria a entrada na fila.' },
  { title: 'Você aprova', desc: 'Painel mostra a fila. Aprova individual ou em massa.' },
  { title: 'Envio automático', desc: 'WhatsApp + email com PDF + link verify. Aluno compartilha.' },
];

const TIERS = [
  {
    name: 'Free',
    price: 'R$ 0',
    period: '/mês',
    tagline: 'Para experimentar',
    features: ['50 certificados/mês', '5 templates BR', 'Verify page padrão', 'Marca UniverCert no rodapé'],
    cta: 'Começar grátis',
    cta_href: '/sign-up',
  },
  {
    name: 'Starter',
    price: 'R$ 97',
    period: '/mês',
    tagline: 'Pequenos cursos · UniverHair',
    popular: true,
    features: ['500 certificados/mês', '50 templates BR', 'Sem marca UniverCert', 'WhatsApp + Email', 'Hotmart + Memberkit + Fluent', 'Suporte PT-BR'],
    cta: 'Assinar Starter',
    cta_href: '/sign-up?plan=starter',
  },
  {
    name: 'Pro',
    price: 'R$ 297',
    period: '/mês',
    tagline: 'Escolas em crescimento',
    features: ['5.000 certificados/mês', 'Domínio próprio', 'Brand Kit + email custom', 'API + Webhooks', 'Open Badges 3.0', 'Multi-user (até 10)'],
    cta: 'Assinar Pro',
    cta_href: '/sign-up?plan=pro',
  },
  {
    name: 'Enterprise',
    price: 'R$ 1.497+',
    period: '/mês',
    tagline: 'White-label SaaS',
    features: ['Volume ilimitado', 'SSO/SAML', 'Blockchain Polygon', 'Multi-tenant', 'Reseller program', 'SLA 99.9%'],
    cta: 'Falar com vendas',
    cta_href: 'mailto:diegoxp12@me.com',
  },
];
