// UniverCert · /casos/[vertical] · Sprint 13 GODMODE
// Páginas SEO por nicho — pain → solution → template recomendado

import { notFound } from 'next/navigation';
import Footer from '@/components/Footer';
import Logo from '@/components/Logo';
import StickyCTA from '@/components/StickyCTA';

export const runtime = 'edge';

type Params = { params: Promise<{ vertical: string }> };

type Vertical = {
  slug: string;
  name: string;
  emoji: string;
  flag?: string;
  h1: string;
  description: string;
  intro: string;
  pains: { title: string; desc: string }[];
  solutions: { icon: string; title: string; desc: string }[];
  recommendedTemplate: { id: string; name: string; why: string };
  testimonial: { quote: string; name: string; role: string; initials: string };
  exampleCertName: string;
  exampleStudent: string;
  cssAccent: string;
};

const VERTICALS: Record<string, Vertical> = {
  cabelo: {
    slug: 'cabelo',
    name: 'Cabelo · Beleza',
    emoji: '💇',
    h1: 'Certificados pra cursos de cabelo, alisamento, coloração',
    description:
      'Plataforma de certificados pra escolas de cabelo, salões e cabeleireiros. Templates premium, envio por WhatsApp, integração com Hotmart e Memberkit.',
    intro:
      'Escola de cabelo BR tem fluxo único: aluno paga via Pix, faz curso de fim de semana, quer cert pra postar no Insta. Plataformas gringas não entendem isso.',
    pains: [
      { title: 'Cert no Canva consome seu domingo', desc: 'Cada cert é 8min de edit + export + email. Pra 30 alunas/mês = 4h perdidas só nisso.' },
      { title: 'Aluna não responde email', desc: 'Email afunda na promoção. WhatsApp ela vê em 2min e responde "obrigada amada ❤️".' },
      { title: 'Cert sem QR ninguém respeita', desc: 'Mercado tá cheio de cert genérico. Aluna quer prova de que é REAL pra clientela ver.' },
    ],
    solutions: [
      { icon: '⚡', title: 'Hotmart → cert automático', desc: 'Curso vendido na Hotmart? Cert sai na hora do pagamento confirmado, sem você fazer nada.' },
      { icon: '💬', title: 'Manda no Zap em 30s', desc: 'WhatsApp Cloud API oficial Meta. Aluna recebe, lê, responde, compartilha. Triplica seu marketing.' },
      { icon: '🏆', title: 'Cert verificável com QR', desc: 'Cliente da aluna pode escanear QR e verificar autenticidade no cert.suaescola.com.br.' },
      { icon: '🎨', title: '6 templates premium prontos', desc: 'Da Cormorant Garamond clássica ao Creative gradient. Cores que combinam com sua marca.' },
    ],
    recommendedTemplate: {
      id: 'creative',
      name: 'Creative',
      why: 'Bold, vibrante, instagramável. Aluna posta orgulhosa no story.',
    },
    testimonial: {
      quote: 'Antes mandava cert no email da aluna e ela perdia. Agora vai no Zap dela, ela responde "amada obrigada", posta no story marcando a escola, vem cliente nova. Ganhei tempo + clientela.',
      name: 'Ana Carolina',
      role: 'UniverHair · São Paulo',
      initials: 'AC',
    },
    exampleCertName: 'Maria Aparecida',
    exampleStudent: 'Coloração Profissional · 40h',
    cssAccent: '#EC4899',
  },
  estetica: {
    slug: 'estetica',
    name: 'Estética · Beauty',
    emoji: '✨',
    h1: 'Certificados pra cursos de estética, micropigmentação, harmonização',
    description:
      'Plataforma BR pra escolas de estética. Cert digital com QR verificável, integração Hotmart/Memberkit, envio por WhatsApp.',
    intro:
      'Estética é mercado serissimo. Cliente da sua aluna PRECISA poder verificar credencial. Certificado em PDF anexado em email não passa essa segurança.',
    pains: [
      { title: 'Cliente da aluna pede prova de credencial', desc: 'Mercado de estética está rigorosos. Quem não tem certificado verificável perde cliente pra concorrência regulada.' },
      { title: 'Curso de fim de semana = pico de cert', desc: 'Domingo à noite, 25 alunas terminam, todas querem cert na segunda. Manualmente é impossível.' },
      { title: 'Quer registrar carga horária + selo MEC futuro', desc: 'Cert atual em PDF não tem campo estruturado. UniverCert exporta Open Badges 3.0 com JSON-LD.' },
    ],
    solutions: [
      { icon: '🔐', title: 'Hash SHA-256 imutável', desc: 'Cada cert tem assinatura criptográfica. Cliente verifica com 1 click no QR.' },
      { icon: '📋', title: 'Bulk emit pós-fim de semana', desc: 'Aprova 25 alunas em 1 click no domingo à noite. Todas recebem antes da segunda.' },
      { icon: '📜', title: 'Open Badges 3.0', desc: 'Padrão IMS Global. Aluna pode levar pra qualquer plataforma de portfólio profissional.' },
      { icon: '🏷', title: 'Domínio próprio cert.suaescola.com.br', desc: 'Aluna verifica no SEU domínio. Você fica em todo lugar.' },
    ],
    recommendedTemplate: {
      id: 'gold',
      name: 'Gold',
      why: 'Luxo art déco. Comunica confiança e profissionalismo serio. Cliente da aluna sente.',
    },
    testimonial: {
      quote: 'Estética exige seriedade. UniverCert tem QR, hash, é verificável. Quando minha aluna mostra pro cliente dela, fecha o atendimento na hora. Cert virou ferramenta de venda.',
      name: 'Marina Souza',
      role: 'Estética Avançada · Curitiba',
      initials: 'MS',
    },
    exampleCertName: 'Juliana Mendes',
    exampleStudent: 'Micropigmentação Avançada · 60h',
    cssAccent: '#D4A937',
  },
  barbearia: {
    slug: 'barbearia',
    name: 'Barbearia',
    emoji: '💈',
    h1: 'Certificados pra cursos de barbearia profissional',
    description:
      'Cert digital pra escolas de barbearia BR. Templates masculinos premium, integração Hotmart, envio WhatsApp.',
    intro:
      'Barbearia virou nicho premium. Curso de barber pago, aluno espera cert MASCULINO — não rosa floral. Templates no Canva não pegam essa estética.',
    pains: [
      { title: 'Templates online são femininos demais', desc: 'Canva, certificate makers — tudo dourado floral. Não combina com identidade barber.' },
      { title: 'Aluno é jovem, vive no Insta', desc: 'Cert em email vai pra spam. WhatsApp + Insta é onde ele tá.' },
      { title: 'Quer cert profissional pra abrir barbearia', desc: 'Aluno precisa mostrar credencial pro cliente. PDF genérico não dá esse vibe.' },
    ],
    solutions: [
      { icon: '⚫', title: 'Templates masculinos premium', desc: 'Executive (corporate dark), Modern (tech minimalista), Minimal (swiss bold). Sem floreio.' },
      { icon: '🎨', title: 'Cores totalmente custom', desc: 'Black + Gold, Navy + Steel, qualquer paleta. Combina com sua marca.' },
      { icon: '💬', title: 'Cert no Zap em segundos', desc: 'Aluno recebe, posta no story marcando a escola = clientela orgânica grátis.' },
      { icon: '🌐', title: 'cert.suabarber.com.br', desc: 'Domínio próprio. Cert sai com seu logo, sem marca UniverCert.' },
    ],
    recommendedTemplate: {
      id: 'executive',
      name: 'Executive',
      why: 'Dark navy + gold. Sério, masculino, premium. Comunica respeito e profissionalismo.',
    },
    testimonial: {
      quote: 'Tava usando Canva e o template parecia cert de festa de aniversário. Mudei pro Executive da UniverCert e meus alunos começaram a postar mais — alcance no Insta dobrou.',
      name: 'Roberto Lima',
      role: 'Curso Online Barbearia Pro',
      initials: 'RL',
    },
    exampleCertName: 'Lucas Oliveira',
    exampleStudent: 'Barbearia Profissional · 80h',
    cssAccent: '#1B2D5E',
  },
  idiomas: {
    slug: 'idiomas',
    name: 'Idiomas',
    emoji: '🗣',
    h1: 'Certificados pra cursos de idiomas online',
    description:
      'Cert digital pra escolas de idiomas BR. Open Badges 3.0, integração com plataforma, envio automático.',
    intro:
      'Idioma é cert que vai pro LinkedIn. Aluno precisa mostrar nível CEFR de inglês/espanhol/etc. Cert padrão certificate maker não tem credibilidade.',
    pains: [
      { title: 'Cert tem que ir pro LinkedIn', desc: 'Aluno usa pra emprego. Cert sem URL verificável é descartado por recrutador.' },
      { title: 'Estrutura de níveis CEFR (A1, A2, B1...)', desc: 'Cert genérico não tem campo de nível. Você precisa de metadados estruturados.' },
      { title: 'Cursos longos com múltiplos certs', desc: 'Aluno faz A1, depois A2, depois B1. Cada um precisa de cert. Manualmente é insano.' },
    ],
    solutions: [
      { icon: '💼', title: 'LinkedIn 1-clique', desc: 'Aluno adiciona ao perfil em 1 click — UniverCert pré-preenche todos os campos.' },
      { icon: '📜', title: 'Open Badges 3.0 com nível CEFR', desc: 'Metadados estruturados em JSON-LD. Recrutador valida automaticamente.' },
      { icon: '⚡', title: 'Trigger por módulo concluído', desc: 'Memberkit/Fluent dispara webhook. Cert sai na hora pra cada nível.' },
      { icon: '🌎', title: 'Cert em 3 idiomas', desc: 'Templates suportam PT-BR, EN-US, ES-ES. Aluno escolhe o idioma do cert.' },
    ],
    recommendedTemplate: {
      id: 'minimal',
      name: 'Minimal',
      why: 'Clean swiss style internacional. Carrega bem em LinkedIn, parece profissional global.',
    },
    testimonial: {
      quote: 'Meus alunos eram bilíngues mas o cert era em PT só. Agora UniverCert exporta em EN também — eles colocam no LinkedIn e empresas internacionais validam direto.',
      name: 'Camila Borges',
      role: 'English Hub · 100% Online',
      initials: 'CB',
    },
    exampleCertName: 'Pedro Henrique',
    exampleStudent: 'English Intermediate · B1 · 60h',
    cssAccent: '#1B2D5E',
  },
  mba: {
    slug: 'mba',
    name: 'MBA · Pós-graduação',
    emoji: '🎓',
    h1: 'Certificados pra MBA, pós-graduação e cursos executivos',
    description:
      'Plataforma de cert pra MBAs, especializações e cursos executivos. Templates corporate, audit log, multi-user.',
    intro:
      'MBA é cert que abre porta. Aluno paga R$ 30k esperando documento sério. Cert em PDF artesanal não combina com ticket alto.',
    pains: [
      { title: 'Aluno paga R$ 30k esperando seriedade', desc: 'Cert digital tem que comunicar valor. PDF amador suja a percepção do programa todo.' },
      { title: 'Compliance corporativo exige verificação', desc: 'RH da empresa do aluno valida cert antes de promoção. Sem URL pública = inválido.' },
      { title: 'Múltiplos coordenadores assinando', desc: 'Reitor, coordenador, professor responsável. Cert em PDF estático não escala.' },
    ],
    solutions: [
      { icon: '🏛', title: 'Template Executive corporate', desc: 'Dark navy + gold, tipografia Cormorant + Inter. Comunica peso institucional.' },
      { icon: '📋', title: 'Audit log completo', desc: 'Toda emissão registrada com IP/timestamp/quem aprovou. Compliance ready.' },
      { icon: '👥', title: 'Multi-user (Pro plan)', desc: 'Reitor + coordenador + secretaria, cada um com role. Aprovação em comitê.' },
      { icon: '🌐', title: 'Domínio institucional', desc: 'cert.suamba.edu.br. Aluno verifica no domínio oficial da instituição.' },
    ],
    recommendedTemplate: {
      id: 'executive',
      name: 'Executive',
      why: 'Padrão MBA premium. Dark navy comunica peso, gold accent traz prestígio.',
    },
    testimonial: {
      quote: 'Pra MBA executivo, percepção é tudo. Migramos do PDF anexo pra UniverCert — aluno orgulhoso de mostrar no LinkedIn, empresa valida sem ligar pra gente. Reduziu nossa carga de suporte.',
      name: 'Dr. Felipe Andrade',
      role: 'IBE Executive Education',
      initials: 'FA',
    },
    exampleCertName: 'Patricia Almeida Costa',
    exampleStudent: 'MBA Executivo em Gestão de Pessoas · 360h',
    cssAccent: '#0A1224',
  },
  online: {
    slug: 'online',
    name: 'Cursos Online',
    emoji: '💻',
    h1: 'Certificados pra cursos online · infoprodutos',
    description:
      'Cert digital pra criadores de curso online. Integração Hotmart/Kiwify/Memberkit nativa, automação total, marketing orgânico.',
    intro:
      'Você vende curso online. Quer cert que aluno COMPARTILHA — porque cada share = lead novo de graça.',
    pains: [
      { title: 'Volume escala — não dá pra fazer manual', desc: '100+ vendas/mês significam 100+ certs. Você não pode parar a vida pra emitir cada um.' },
      { title: 'Cert genérico não viraliza', desc: 'Aluno não posta cert sem graça. Cert bonito + verificável vira marketing orgânico no Insta.' },
      { title: 'Plataformas gringas cobram em USD', desc: 'Você cobra R$ 497 do aluno. Não faz sentido pagar US$ 49/mês de cert pra zerar margem.' },
    ],
    solutions: [
      { icon: '🤖', title: 'Hotmart/Kiwify/Memberkit nativos', desc: 'Webhook automático. Pagamento confirmado → cert emitido → WhatsApp disparado. Você só revisa.' },
      { icon: '📱', title: 'WhatsApp + LinkedIn 1-click', desc: 'Aluno compartilha em ambos canais. Cada share alcança 150 pessoas em média.' },
      { icon: '🧪', title: 'Demo /demo na sua landing', desc: 'Lead vê cert real em 30s antes de comprar. Aumenta conversão de checkout.' },
      { icon: '💰', title: 'Plano Starter R$ 97 · Pro R$ 297', desc: 'Cabe no orçamento de qualquer infoprodutor BR. ROI mensurável.' },
    ],
    recommendedTemplate: {
      id: 'creative',
      name: 'Creative',
      why: 'Gradient bold instagramável. Aluno orgulhoso de postar. Marketing orgânico em escala.',
    },
    testimonial: {
      quote: 'Cobro R$ 497 no curso. Pagar US$ 49/mês de Certifier era 10% da minha margem por aluno. UniverCert cabe + integra direto com Hotmart. ROI positivo desde a 2ª venda do mês.',
      name: 'Diego Pereira',
      role: 'Curso Liso Blindado · Hotmart',
      initials: 'DP',
    },
    exampleCertName: 'Gabriela Ferreira',
    exampleStudent: 'Maestria em Vendas Online · 50h',
    cssAccent: '#6366F1',
  },
};

export async function generateMetadata({ params }: Params) {
  const { vertical } = await params;
  const v = VERTICALS[vertical];
  if (!v) return { title: 'Casos de uso · UniverCert' };
  return {
    title: `${v.h1} · UniverCert`,
    description: v.description,
    openGraph: { title: v.h1, description: v.description, type: 'article' },
    alternates: { canonical: `/casos/${vertical}` },
  };
}

export default async function VerticalPage({ params }: Params) {
  const { vertical } = await params;
  const v = VERTICALS[vertical];
  if (!v) notFound();

  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'UniverCert', item: 'https://univercert.com.br' },
      { '@type': 'ListItem', position: 2, name: 'Casos de uso', item: 'https://univercert.com.br/casos' },
      { '@type': 'ListItem', position: 3, name: v.name, item: `https://univercert.com.br/casos/${vertical}` },
    ],
  };

  const previewUrl = `/api/v1/templates/${v.recommendedTemplate.id}/preview?accent=${encodeURIComponent(v.cssAccent)}`;

  return (
    <main className="bg-white relative overflow-x-clip">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <StickyCTA message={`Testar grátis · ${v.name}`} href="/demo" />

      <nav className="sticky top-0 z-50 bg-white/75 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2.5">
            <Logo size={36} />
            <span className="font-extrabold text-base tracking-tight">
              <span className="text-primary">univer</span>
              <span className="text-accent">CERT</span>
            </span>
          </a>
          <div className="flex items-center gap-2">
            <a href="/roi" className="hidden sm:inline text-sm text-ink-700 hover:text-primary px-3 font-medium">ROI</a>
            <a href="/demo" className="btn-secondary text-sm">Demo</a>
            <a href="/sign-up" className="btn-primary text-sm">Grátis</a>
          </div>
        </div>
      </nav>

      <div className="border-b border-gray-100 bg-gray-50/50">
        <div className="max-w-6xl mx-auto px-6 py-3 text-xs text-ink-500 flex items-center gap-2">
          <a href="/" className="hover:text-primary">UniverCert</a>
          <span className="text-ink-500/50">/</span>
          <span className="text-ink-700">Casos de uso</span>
          <span className="text-ink-500/50">/</span>
          <span className="text-ink-700 font-bold">{v.name}</span>
        </div>
      </div>

      {/* HERO */}
      <section className="relative py-20 px-6 bg-mesh overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full opacity-20 blur-3xl bg-gradient-to-br from-primary to-accent animate-float" />
        <div className="max-w-4xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-primary/20 rounded-full text-[10px] font-bold text-primary uppercase tracking-[0.2em] mb-5 shadow-card">
            <span className="text-base leading-none">{v.emoji}</span>
            Caso de uso · {v.name}
          </div>
          <h1 className="font-display text-4xl md:text-6xl font-semibold tracking-tighter leading-[1.05] mb-5 text-balance">
            {v.h1}
          </h1>
          <p className="text-lg text-ink-500 max-w-2xl mx-auto mb-9 text-balance">{v.intro}</p>
          <div className="flex gap-3 justify-center flex-wrap">
            <a href="/demo" className="btn-gradient text-base px-7 py-3.5">🧪 Testar em 30s</a>
            <a href={previewUrl} target="_blank" rel="noopener" className="btn-secondary text-base px-7 py-3.5">
              Ver template recomendado
            </a>
          </div>
        </div>
      </section>

      {/* PAINS */}
      <section className="py-20 px-6 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="text-[10px] font-bold text-danger uppercase tracking-[0.3em] mb-3">Você reconhece?</div>
            <h2 className="font-display text-3xl md:text-4xl font-semibold tracking-tight text-balance">
              Dores que você vive todo mês
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {v.pains.map((p, i) => (
              <div key={i} className="card-hover animate-slide-up" style={{ animationDelay: `${i * 60}ms` }}>
                <div className="w-10 h-10 rounded-xl bg-danger/10 text-danger text-xl flex items-center justify-center mb-3">
                  ⚠
                </div>
                <h3 className="font-bold text-lg mb-2 tracking-tight">{p.title}</h3>
                <p className="text-sm text-ink-500 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SOLUTIONS */}
      <section className="py-20 px-6 bg-mesh">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary-soft/30 via-white to-accent/5" />
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="text-[10px] font-bold text-success uppercase tracking-[0.3em] mb-3">Como UniverCert resolve</div>
            <h2 className="font-display text-3xl md:text-4xl font-semibold tracking-tight text-balance">
              Sua escola, no fluxo certo
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-5">
            {v.solutions.map((s, i) => (
              <div key={i} className="card-glass animate-slide-up" style={{ animationDelay: `${i * 60}ms` }}>
                <div className="text-3xl mb-3">{s.icon}</div>
                <h3 className="font-bold text-lg mb-2 tracking-tight">{s.title}</h3>
                <p className="text-sm text-ink-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* RECOMMENDED TEMPLATE */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <div className="text-[10px] font-bold text-primary uppercase tracking-[0.3em] mb-3">Recomendado pra {v.name}</div>
            <h2 className="font-display text-3xl md:text-4xl font-semibold tracking-tight">
              Template <span className="text-gradient">{v.recommendedTemplate.name}</span>
            </h2>
            <p className="text-ink-500 mt-3 max-w-xl mx-auto">{v.recommendedTemplate.why}</p>
          </div>

          <div className="card !p-0 overflow-hidden shadow-card-lift max-w-3xl mx-auto">
            <div className="relative aspect-[297/210] bg-gray-100 overflow-hidden">
              <iframe
                src={previewUrl}
                title={`Preview ${v.recommendedTemplate.name}`}
                className="absolute inset-0 w-[297mm] h-[210mm] origin-top-left pointer-events-none"
                style={{ transform: 'scale(0.45)' }}
                loading="lazy"
                sandbox="allow-same-origin"
              />
            </div>
            <div className="p-6 flex items-center justify-between flex-wrap gap-3">
              <div>
                <div className="font-display text-xl font-semibold tracking-tight">{v.recommendedTemplate.name}</div>
                <div className="text-xs text-ink-500 mt-0.5">Exemplo: {v.exampleStudent} · {v.exampleCertName}</div>
              </div>
              <a href={previewUrl} target="_blank" rel="noopener" className="btn-primary text-sm">
                Abrir em tela cheia →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIAL */}
      <section className="py-20 px-6 bg-gradient-to-br from-primary-soft/30 via-white to-accent/5">
        <div className="max-w-3xl mx-auto">
          <div className="card-glass relative !p-9 md:!p-12">
            <div className="absolute -top-6 left-9 text-9xl text-primary/15 font-display leading-none">&ldquo;</div>
            <div className="text-yellow-400 mb-4 text-base tracking-wider">★★★★★</div>
            <p className="font-display text-xl md:text-2xl text-ink-900 leading-relaxed mb-7 text-balance">
              {v.testimonial.quote}
            </p>
            <div className="flex items-center gap-4 pt-5 border-t border-gray-100">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent text-white font-bold flex items-center justify-center text-lg shadow-glow-primary">
                {v.testimonial.initials}
              </div>
              <div>
                <div className="font-bold text-base">{v.testimonial.name}</div>
                <div className="text-sm text-ink-500">{v.testimonial.role}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* OUTROS VERTICAIS */}
      <section className="py-12 px-6 bg-gray-50">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-[10px] uppercase tracking-[0.3em] text-ink-500 font-bold mb-5">Veja outros casos</p>
          <div className="flex gap-2 justify-center flex-wrap">
            {Object.values(VERTICALS).filter((x) => x.slug !== v.slug).slice(0, 5).map((other) => (
              <a
                key={other.slug}
                href={`/casos/${other.slug}`}
                className="px-4 py-2 rounded-full border border-gray-200 bg-white text-sm font-medium text-ink-700 hover:border-primary hover:text-primary transition flex items-center gap-1.5"
              >
                <span>{other.emoji}</span> {other.name}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-24 px-6 bg-gradient-to-br from-ink-900 via-ink-900 to-primary/40 text-white text-center overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full opacity-30 blur-3xl bg-gradient-to-br from-primary to-accent" />
        <div className="max-w-2xl mx-auto relative">
          <h2 className="font-display text-3xl md:text-5xl font-semibold tracking-tight mb-5 text-balance">
            Pronto pra emitir cert {v.name.toLowerCase()} no piloto automático?
          </h2>
          <p className="text-white/70 mb-9 text-balance">
            Demo grátis em 30 segundos · 50 certs/mês free · sem cartão · 5min pra configurar.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <a href="/demo" className="btn-gradient text-base px-7 py-3.5">🧪 Testar em 30s</a>
            <a href="/sign-up" className="btn text-base px-7 py-3.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur">
              Criar conta grátis
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

export async function generateStaticParams() {
  return Object.keys(VERTICALS).map((vertical) => ({ vertical }));
}
