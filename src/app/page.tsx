// UniverCert · landing comercial · Sprint 9 (trust + testimonials + FAQ)

import Footer from '@/components/Footer';

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
            <a href="/demo" className="hover:text-primary">Demo</a>
            <a href="#features" className="hover:text-primary">Recursos</a>
            <a href="#integracoes" className="hover:text-primary">Integrações</a>
            <a href="#precos" className="hover:text-primary">Preços</a>
            <a href="#faq" className="hover:text-primary">FAQ</a>
          </nav>
          <div className="flex gap-2 items-center">
            <a href="/sign-in" className="text-sm text-gray-700 hover:text-primary px-3">Entrar</a>
            <a href="/sign-up" className="btn-primary text-sm">Começar grátis</a>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="py-20 px-6 bg-gradient-to-br from-primary-soft via-white to-accent/5 relative overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full opacity-15 blur-3xl bg-gradient-to-br from-primary to-accent" />
        <div className="max-w-5xl mx-auto text-center relative">
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
            <a href="/demo" className="btn-primary text-base px-7 py-3.5">
              🧪 Testar em 30s · sem cadastro
            </a>
            <a href="/sign-up" className="btn-secondary text-base px-7 py-3.5">
              Criar conta grátis →
            </a>
          </div>
          <div className="flex gap-5 justify-center text-xs text-gray-500 mt-8 flex-wrap">
            <span>✓ Demo sem cadastro</span>
            <span>✓ 50 certs grátis/mês</span>
            <span>✓ Sem cartão de crédito</span>
            <span>✓ LGPD-ready</span>
            <span>✓ 5min pra configurar</span>
          </div>
        </div>
      </section>

      {/* TRUSTED BAR + métricas */}
      <div className="bg-gray-50 border-y border-gray-100 py-9">
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-center text-xs uppercase tracking-widest text-gray-400 font-bold mb-5">
            Construído pra escolas brasileiras que usam
          </p>
          <div className="flex gap-10 justify-center flex-wrap items-center text-sm font-semibold text-gray-400 mb-9">
            <span>Hotmart</span>
            <span>Memberkit</span>
            <span>Fluent Community</span>
            <span>Kiwify</span>
            <span>Eduzz</span>
            <span>Hubla</span>
            <span>WordPress</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            <Metric value="< 5s" label="emissão por certificado" />
            <Metric value="100%" label="LGPD-compliant" />
            <Metric value="4×" label="mais views via WhatsApp" />
            <Metric value="R$ 97" label="por mês · sem dólar" />
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

      {/* TESTIMONIALS */}
      <section className="py-20 px-6 bg-gradient-to-br from-primary-soft via-white to-accent/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="text-xs font-bold text-primary uppercase tracking-widest mb-3">Quem já usa</div>
            <h2 className="text-4xl font-extrabold tracking-tight">Escolas brasileiras que confiam.</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="card relative">
                <div className="absolute -top-3 left-6 text-5xl text-primary/20 font-serif leading-none">&ldquo;</div>
                <div className="text-yellow-400 mb-3 text-sm">★★★★★</div>
                <p className="text-sm text-gray-700 mb-5 leading-relaxed">{t.quote}</p>
                <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent text-white font-bold flex items-center justify-center text-sm">
                    {t.initials}
                  </div>
                  <div>
                    <div className="font-bold text-sm">{t.name}</div>
                    <div className="text-xs text-gray-500">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-gray-400 mt-8 italic">
            * Depoimentos coletados em piloto fechado durante abril/maio 2026.
          </p>
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
            <p className="text-gray-600 mt-3">Garantia de 14 dias. Cancele quando quiser. Sem fidelidade.</p>
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

          <div className="text-center mt-9">
            <p className="text-xs text-gray-500">
              💳 Pix · Boleto · Cartão até 12x · 🛡 Garantia 14 dias · 📞 Suporte PT-BR
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <div className="text-xs font-bold text-primary uppercase tracking-widest mb-3">FAQ</div>
            <h2 className="text-4xl font-extrabold tracking-tight">Dúvidas mais comuns.</h2>
          </div>
          <div className="space-y-3">
            {FAQS.map((f, i) => (
              <details key={i} className="group card cursor-pointer hover:border-primary/40 transition">
                <summary className="font-bold text-base list-none flex items-center justify-between gap-4">
                  {f.q}
                  <span className="text-primary text-2xl group-open:rotate-45 transition-transform">+</span>
                </summary>
                <p className="text-sm text-gray-600 mt-3 leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-gradient-to-br from-gray-900 via-gray-900 to-primary/40 text-white text-center relative overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full opacity-25 blur-3xl bg-gradient-to-br from-primary to-accent" />
        <div className="max-w-3xl mx-auto relative">
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
            Pronto para emitir seu primeiro certificado em{' '}
            <span className="bg-gradient-to-r from-white to-accent bg-clip-text text-transparent">5 minutos</span>?
          </h2>
          <p className="text-white/70 mb-7 max-w-lg mx-auto">
            50 certificados grátis por mês. Sem cartão de crédito. Sem trial limitado.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <a href="/sign-up" className="btn-primary text-base px-8 py-3.5">
              Começar grátis →
            </a>
            <a href="https://wa.me/5511999998888?text=Oi!%20Vim%20do%20site%20e%20quero%20saber%20mais%20sobre%20o%20UniverCert" target="_blank" rel="noopener noreferrer" className="text-base px-8 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 font-semibold transition-all border border-white/20">
              💬 Falar no WhatsApp
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <div className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">{value}</div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
    </div>
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

const TESTIMONIALS = [
  {
    quote:
      'Antes eu fazia certificado no Canva, exportava PDF, mandava por email e o aluno nem abria. Agora com UniverCert vai pelo Zap, o aluno responde "obrigado" e ainda compartilha no Insta. Triplicou meu marketing orgânico.',
    name: 'Ana Carolina',
    role: 'Escola UniverHair · São Paulo',
    initials: 'AC',
  },
  {
    quote:
      'Integrei com a Memberkit em 10 minutos. Quando o aluno conclui o curso, o certificado já vai automático. Não preciso fazer NADA. É surreal.',
    name: 'Roberto Lima',
    role: 'Curso Online Barbearia Pro',
    initials: 'RL',
  },
  {
    quote:
      'O suporte responde em português, no WhatsApp, em minutos. Tentei o Certifier antes e era um inferno em inglês. Aqui é gente que entende escola brasileira.',
    name: 'Marina Souza',
    role: 'Estética Avançada · Curitiba',
    initials: 'MS',
  },
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

const FAQS = [
  {
    q: 'O certificado UniverCert tem validade legal?',
    a: 'Sim. Como qualquer certificado de curso livre emitido no Brasil, ele comprova a participação/conclusão do aluno no curso. Para cursos regulamentados (MEC, conselhos profissionais), você precisa de credenciamento específico do órgão regulador — o UniverCert apenas emite o documento digital. Nosso certificado tem URL pública verificável, hash SHA-256 imutável, QR code e padrão Open Badges 3.0 (IMS Global).',
  },
  {
    q: 'Como funciona o envio por WhatsApp?',
    a: 'Usamos a WhatsApp Cloud API oficial da Meta. Quando você aprova um certificado, o sistema envia automaticamente uma mensagem ao aluno com link do PDF, link de verificação e botão para baixar. Não é WhatsApp Web automatizado (que viola termos). É a API oficial — confiável e legal.',
  },
  {
    q: 'Posso usar meu próprio domínio (cert.minhaescola.com.br)?',
    a: 'Sim, no plano Pro e superior. Configuramos via Cloudflare for SaaS em poucos cliques. Seus alunos recebem o certificado em cert.suaescola.com.br — UniverCert fica invisível.',
  },
  {
    q: 'E se eu cancelar? Os certificados que já emiti deixam de funcionar?',
    a: 'Não. Os links de verificação continuam ativos enquanto você tiver pelo menos plano Free. Você pode também exportar todos os certificados em ZIP (PDFs + JSON-LD Open Badge) para backup completo.',
  },
  {
    q: 'Vocês cobram em dólar como Certifier ou Sertifier?',
    a: 'Não. UniverCert nasceu BR. Cobrança em real, NF-e automática, Pix instantâneo, boleto e cartão até 12x. Sem IOF, sem variação cambial. R$ 97/mês é R$ 97/mês — sempre.',
  },
  {
    q: 'Quanto tempo demora pra configurar?',
    a: 'Configuração inicial em 5 minutos: criar conta, escolher template, conectar Hotmart/Memberkit (ou ativar formulário público). Primeiro certificado emitido em menos de 10 minutos no piloto fechado.',
  },
  {
    q: 'E LGPD? Como vocês tratam os dados dos meus alunos?',
    a: 'Você é o controlador, nós somos operadores. Dados ficam em servidores Cloudflare com criptografia em trânsito (TLS) e em repouso. Seu DPO pode entrar em contato com nosso DPO a qualquer momento. Aluno tem botão "remover meus dados" na página de verificação. Detalhes: /privacidade · /lgpd',
  },
  {
    q: 'Posso revender UniverCert para minhas escolas-cliente (white-label SaaS)?',
    a: 'Sim! Plano Enterprise + programa Reseller dão 30% de comissão recorrente vitalícia. Os primeiros 10 parceiros pegam 40%. Você precifica o que quiser pros seus clientes; nós cuidamos da infra. Detalhes em /reseller.',
  },
];
