// UniverCert · landing · Sprint 12 (logo + paleta navy/gold)

import Footer from '@/components/Footer';
import Logo from '@/components/Logo';

export const runtime = 'edge';

export default function HomePage() {
  return (
    <main className="bg-white relative overflow-x-clip">
      <nav className="sticky top-0 z-50 bg-white/75 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2.5 group">
            <Logo size={40} className="group-hover:scale-105 transition-transform drop-shadow-md" />
            <span className="font-extrabold text-base tracking-tight">
              <span className="text-primary">univer</span>
              <span className="text-accent">CERT</span>
            </span>
          </a>
          <nav className="hidden md:flex gap-6 text-sm font-medium text-ink-700">
            <a href="/demo" className="hover:text-primary transition">Demo</a>
            <a href="#features" className="hover:text-primary transition">Recursos</a>
            <a href="#precos" className="hover:text-primary transition">Preços</a>
            <a href="/roi" className="hover:text-primary transition">ROI</a>
            <a href="#faq" className="hover:text-primary transition">FAQ</a>
          </nav>
          <div className="flex gap-2 items-center">
            <a href="/sign-in" className="hidden sm:inline text-sm text-ink-700 hover:text-primary px-3 font-medium">Entrar</a>
            <a href="/sign-up" className="btn-primary text-sm">Começar grátis</a>
          </div>
        </div>
      </nav>

      <section className="relative py-24 md:py-32 px-6 overflow-hidden bg-mesh">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full opacity-20 blur-3xl bg-gradient-to-br from-primary to-accent animate-float" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full opacity-15 blur-3xl bg-gradient-to-br from-violet-500 to-primary animate-float" style={{ animationDelay: '2s' }} />
        <div className="max-w-5xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-primary/20 rounded-full text-[10px] font-bold text-primary uppercase tracking-[0.2em] mb-6 shadow-card animate-fade-in">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            🇧🇷 A plataforma brasileira de certificados
          </div>
          <h1 className="font-display text-5xl md:text-7xl font-semibold tracking-tighter leading-[1.0] mb-6 animate-slide-up text-balance">
            Emita certificados que seus alunos <span className="text-gradient">querem compartilhar.</span>
          </h1>
          <p className="text-lg md:text-xl text-ink-500 max-w-2xl mx-auto mb-9 animate-slide-up stagger-1 text-balance">
            Certificados digitais profissionais, verificáveis e enviáveis por <strong className="text-ink-900">WhatsApp</strong>. Integrado com Hotmart, Memberkit, Fluent Community e Kiwify. Cobre em <strong className="text-ink-900">Pix, Boleto e Cartão</strong>.
          </p>
          <div className="flex gap-3 justify-center flex-wrap animate-slide-up stagger-2">
            <a href="/demo" className="btn-gradient text-base px-7 py-3.5">🧪 Testar em 30s · sem cadastro</a>
            <a href="/sign-up" className="btn-secondary text-base px-7 py-3.5">Criar conta grátis →</a>
          </div>
          <div className="flex gap-x-5 gap-y-2 justify-center text-xs text-ink-500 mt-9 flex-wrap animate-fade-in stagger-3">
            <span>✓ Demo sem cadastro</span>
            <span>✓ 50 certs grátis/mês</span>
            <span>✓ Sem cartão de crédito</span>
            <span>✓ LGPD-ready</span>
            <span>✓ 5min pra configurar</span>
          </div>
        </div>
      </section>

      <div className="relative bg-gradient-to-b from-gray-50/80 to-white border-y border-gray-100 py-12">
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-center text-[10px] uppercase tracking-[0.3em] text-ink-500 font-bold mb-6">Construído pra escolas brasileiras que usam</p>
          <div className="flex gap-8 md:gap-12 justify-center flex-wrap items-center text-sm font-bold text-ink-500/70 mb-12 grayscale opacity-70">
            <span>Hotmart</span><span>Memberkit</span><span>Fluent Community</span><span>Kiwify</span><span>Eduzz</span><span>Hubla</span><span>WordPress</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            <Metric value="< 5s" label="emissão por certificado" />
            <Metric value="100%" label="LGPD-compliant" />
            <Metric value="4×" label="mais views via WhatsApp" />
            <Metric value="R$ 97" label="por mês · sem dólar" />
          </div>
        </div>
      </div>

      <section id="features" className="relative py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-block text-[10px] font-bold text-primary uppercase tracking-[0.3em] mb-3">Tudo que você precisa</div>
            <h2 className="font-display text-4xl md:text-5xl font-semibold tracking-tight text-balance">Recursos pensados para o jeito brasileiro de ensinar.</h2>
            <p className="text-ink-500 mt-4 max-w-xl mx-auto text-balance">Plataformas gringas cobram em dólar e ignoram WhatsApp. UniverCert nasceu BR.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <div key={f.title} className="card-hover animate-slide-up" style={{ animationDelay: `${i * 60}ms` }}>
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-accent text-white text-xl flex items-center justify-center mb-4 shadow-glow-primary">{f.emoji}</div>
                <h3 className="font-bold text-lg mb-1.5 tracking-tight">{f.title}</h3>
                <p className="text-sm text-ink-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative py-24 px-6 bg-mesh">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary-soft/30 via-white to-accent/5" />
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <div className="text-[10px] font-bold text-primary uppercase tracking-[0.3em] mb-3">Quem já usa</div>
            <h2 className="font-display text-4xl md:text-5xl font-semibold tracking-tight">Escolas brasileiras que confiam.</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="card-glass relative animate-slide-up" style={{ animationDelay: `${i * 80}ms` }}>
                <div className="absolute -top-4 left-7 text-7xl text-primary/20 font-display leading-none">&ldquo;</div>
                <div className="text-yellow-400 mb-3 text-sm tracking-wider">★★★★★</div>
                <p className="text-sm text-ink-700 mb-5 leading-relaxed font-display text-base">{t.quote}</p>
                <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary to-accent text-white font-bold flex items-center justify-center text-sm shadow-glow-primary">{t.initials}</div>
                  <div>
                    <div className="font-bold text-sm">{t.name}</div>
                    <div className="text-xs text-ink-500">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-ink-500/70 mt-10 italic">* Depoimentos coletados em piloto fechado durante abril/maio 2026.</p>
        </div>
      </section>

      <section id="integracoes" className="py-24 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <div className="text-[10px] font-bold text-primary uppercase tracking-[0.3em] mb-3">Integrações nativas</div>
            <h2 className="font-display text-4xl md:text-5xl font-semibold tracking-tight text-balance">Conecta direto com as plataformas que você usa.</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {INTEGRATIONS.map((i) => (
              <div key={i.name} className="card-hover text-center !p-5">
                <div className="font-bold text-sm tracking-tight">{i.name}</div>
                <div className="text-[10px] text-success mt-1.5 font-bold uppercase tracking-widest">{i.tag}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="como-funciona" className="py-24 px-6 bg-gradient-to-b from-white to-primary-soft/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <div className="text-[10px] font-bold text-primary uppercase tracking-[0.3em] mb-3">Em 4 passos</div>
            <h2 className="font-display text-4xl md:text-5xl font-semibold tracking-tight text-balance">Do término do curso ao certificado no Zap em minutos.</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {STEPS.map((s, i) => (
              <div key={i} className="text-center group">
                <div className="relative inline-block mb-5">
                  <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-primary to-accent text-white text-xl font-extrabold flex items-center justify-center shadow-glow-primary group-hover:scale-105 transition-transform">{i + 1}</div>
                </div>
                <h3 className="font-bold mb-1.5 tracking-tight">{s.title}</h3>
                <p className="text-sm text-ink-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="precos" className="py-24 px-6 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <div className="text-[10px] font-bold text-primary uppercase tracking-[0.3em] mb-3">Preços</div>
            <h2 className="font-display text-4xl md:text-5xl font-semibold tracking-tight">Em real. Sem letra miúda.</h2>
            <p className="text-ink-500 mt-4">Garantia de 14 dias. Cancele quando quiser. Sem fidelidade.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {TIERS.map((t, i) => (
              <div key={t.name} className={`relative flex flex-col rounded-2xl p-6 transition-all animate-slide-up ${
                t.popular ? 'bg-white border-2 border-primary -translate-y-2 shadow-card-lift' : 'bg-white border border-gray-200 hover:border-primary/30 shadow-card'
              }`} style={{ animationDelay: `${i * 60}ms` }}>
                {t.popular && <div className="text-[10px] font-bold text-white uppercase tracking-widest bg-gradient-to-r from-primary to-accent text-center py-1 -mt-9 mb-4 rounded-full mx-auto px-3 shadow-glow-primary w-fit">Mais popular</div>}
                <div className="text-[10px] font-bold text-ink-500 uppercase tracking-widest">{t.name}</div>
                <div className="text-3xl font-extrabold mt-2 tracking-tight">{t.price}<span className="text-sm text-ink-500 font-medium">{t.period}</span></div>
                <p className="text-xs text-ink-500 mt-1 mb-5">{t.tagline}</p>
                <ul className="text-sm space-y-2 flex-1">
                  {t.features.map((f) => <li key={f} className="flex gap-2 text-ink-700"><span className="text-success font-bold">✓</span> <span>{f}</span></li>)}
                </ul>
                <a href={t.cta_href} className={`mt-6 text-center font-bold text-sm py-2.5 rounded-xl transition-all ${
                  t.popular ? 'btn-gradient justify-center' : 'bg-ink-900 text-white hover:bg-ink-700'
                }`}>{t.cta}</a>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <p className="text-xs text-ink-500">💳 Pix · Boleto · Cartão até 12x · 🛡 Garantia 14 dias · 📞 Suporte PT-BR</p>
          </div>
        </div>
      </section>

      <section id="faq" className="py-24 px-6 bg-white">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14">
            <div className="text-[10px] font-bold text-primary uppercase tracking-[0.3em] mb-3">FAQ</div>
            <h2 className="font-display text-4xl md:text-5xl font-semibold tracking-tight">Dúvidas mais comuns.</h2>
          </div>
          <div className="space-y-3">
            {FAQS.map((f, i) => (
              <details key={i} className="group card-hover cursor-pointer">
                <summary className="font-bold text-base list-none flex items-center justify-between gap-4 tracking-tight">
                  <span>{f.q}</span>
                  <span className="text-primary text-2xl font-light group-open:rotate-45 transition-transform leading-none">+</span>
                </summary>
                <p className="text-sm text-ink-500 mt-3 leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="relative py-24 px-6 bg-gradient-to-br from-ink-900 via-ink-900 to-primary/40 text-white text-center overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full opacity-30 blur-3xl bg-gradient-to-br from-primary to-accent animate-float" />
        <div className="absolute -bottom-40 -left-40 w-[400px] h-[400px] rounded-full opacity-25 blur-3xl bg-gradient-to-br from-violet-500 to-accent animate-float" style={{ animationDelay: '2s' }} />
        <div className="max-w-3xl mx-auto relative">
          <h2 className="font-display text-4xl md:text-6xl font-semibold tracking-tighter mb-5 text-balance">
            Pronto para emitir seu primeiro certificado em <span className="bg-gradient-to-r from-white via-pink-200 to-accent bg-clip-text text-transparent">5 minutos</span>?
          </h2>
          <p className="text-white/70 mb-9 max-w-lg mx-auto text-base text-balance">50 certificados grátis por mês. Sem cartão de crédito. Sem trial limitado. No seu nome, com seu logo.</p>
          <div className="flex gap-3 justify-center flex-wrap">
            <a href="/demo" className="btn-gradient text-base px-8 py-4">🧪 Testar em 30s →</a>
            <a href="https://wa.me/5511999998888?text=Vim%20do%20site%20e%20quero%20saber%20mais%20sobre%20o%20UniverCert" target="_blank" rel="noopener noreferrer" className="btn text-base px-8 py-4 bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur">💬 Falar no WhatsApp</a>
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
      <div className="font-display text-4xl md:text-5xl font-semibold tracking-tight text-gradient">{value}</div>
      <div className="text-[11px] text-ink-500 mt-2 uppercase tracking-widest font-semibold">{label}</div>
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
  { quote: 'Antes eu fazia certificado no Canva, mandava por email e o aluno nem abria. Agora com UniverCert vai pelo Zap, o aluno responde "obrigado" e ainda compartilha no Insta. Triplicou meu marketing orgânico.', name: 'Ana Carolina', role: 'Escola UniverHair · São Paulo', initials: 'AC' },
  { quote: 'Integrei com a Memberkit em 10 minutos. Quando o aluno conclui o curso, o certificado já vai automático. Não preciso fazer NADA. É surreal.', name: 'Roberto Lima', role: 'Curso Online Barbearia Pro', initials: 'RL' },
  { quote: 'O suporte responde em português, no WhatsApp, em minutos. Tentei o Certifier antes e era um inferno em inglês. Aqui é gente que entende escola brasileira.', name: 'Marina Souza', role: 'Estética Avançada · Curitiba', initials: 'MS' },
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
  { name: 'Free', price: 'R$ 0', period: '/mês', tagline: 'Para experimentar', features: ['50 certificados/mês', '5 templates BR', 'Verify page padrão', 'Marca UniverCert no rodapé'], cta: 'Começar grátis', cta_href: '/sign-up' },
  { name: 'Starter', price: 'R$ 97', period: '/mês', tagline: 'Pequenos cursos', popular: true, features: ['500 certificados/mês', '50 templates BR', 'Sem marca UniverCert', 'WhatsApp + Email', 'Hotmart + Memberkit + Fluent', 'Suporte PT-BR'], cta: 'Assinar Starter', cta_href: '/sign-up?plan=starter' },
  { name: 'Pro', price: 'R$ 297', period: '/mês', tagline: 'Escolas em crescimento', features: ['5.000 certificados/mês', 'Domínio próprio', 'Brand Kit + email custom', 'API + Webhooks', 'Open Badges 3.0', 'Multi-user (até 10)'], cta: 'Assinar Pro', cta_href: '/sign-up?plan=pro' },
  { name: 'Enterprise', price: 'R$ 1.497+', period: '/mês', tagline: 'White-label SaaS', features: ['Volume ilimitado', 'SSO/SAML', 'Blockchain Polygon', 'Multi-tenant', 'Reseller program', 'SLA 99.9%'], cta: 'Falar com vendas', cta_href: 'mailto:diegoxp12@me.com' },
];

const FAQS = [
  { q: 'O certificado UniverCert tem validade legal?', a: 'Sim. Como qualquer certificado de curso livre emitido no Brasil, comprova a participação/conclusão no curso. Para cursos regulamentados (MEC, conselhos), credenciamento é separado. Nosso certificado tem URL pública verificável, hash SHA-256 imutável, QR code e padrão Open Badges 3.0.' },
  { q: 'Como funciona o envio por WhatsApp?', a: 'Usamos a WhatsApp Cloud API oficial da Meta. Quando você aprova um certificado, o sistema envia automaticamente uma mensagem ao aluno com link do PDF, link de verificação e botão para baixar. API oficial — confiável e legal.' },
  { q: 'Posso usar meu próprio domínio (cert.minhaescola.com.br)?', a: 'Sim, no plano Pro e superior. Configuramos via Cloudflare for SaaS em poucos cliques.' },
  { q: 'E se eu cancelar? Os certificados que já emiti deixam de funcionar?', a: 'Não. Os links de verificação continuam ativos enquanto você tiver pelo menos plano Free. Pode também exportar tudo em ZIP.' },
  { q: 'Vocês cobram em dólar como Certifier ou Sertifier?', a: 'Não. UniverCert nasceu BR. Cobrança em real, NF-e automática, Pix instantâneo, boleto e cartão até 12x. Sem IOF, sem variação cambial.' },
  { q: 'Quanto tempo demora pra configurar?', a: 'Configuração inicial em 5 minutos. Primeiro certificado emitido em menos de 10 minutos no piloto fechado.' },
  { q: 'E LGPD? Como vocês tratam os dados dos meus alunos?', a: 'Você é o controlador, nós somos operadores. Dados em servidores Cloudflare com TLS. Detalhes em /privacidade · /lgpd' },
  { q: 'Posso revender UniverCert (white-label)?', a: 'Sim! Plano Enterprise + programa Reseller dão 30% de comissão recorrente vitalícia. Os primeiros 10 parceiros pegam 40%. Detalhes em /reseller.' },
];
