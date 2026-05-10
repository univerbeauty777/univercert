// UniverCert · /vs/[competitor] · Sprint 13 GODMODE

import { notFound } from 'next/navigation';
import Footer from '@/components/Footer';
import Logo from '@/components/Logo';
import StickyCTA from '@/components/StickyCTA';

export const runtime = 'edge';

type Params = { params: Promise<{ competitor: string }> };

type Row = { feature: string; us: string; them: string; winner: 'us' | 'them' | 'tie' };
type Comparison = {
  name: string;
  fullName: string;
  pitch: string;
  flag: string;
  h1: string;
  description: string;
  intro: string;
  killerLine: string;
  rows: Row[];
  verdict: { use_us: string; use_them: string };
  testimonial: { quote: string; name: string; role: string; initials: string };
  related: { slug: string; label: string }[];
};

const COMPARISONS: Record<string, Comparison> = {
  certifier: {
    name: 'Certifier',
    fullName: 'Certifier.io',
    pitch: 'Plataforma americana popular pra cursos online globais.',
    flag: '🇺🇸',
    h1: 'UniverCert vs Certifier · qual escolher pra escolas brasileiras?',
    description:
      'Comparação direta UniverCert vs Certifier.io. Preços em real, suporte em português, integrações nativas BR (Hotmart, Memberkit, Fluent), envio por WhatsApp.',
    intro:
      'Certifier é uma ótima ferramenta — pra escolas que cobram em dólar e vivem em LinkedIn.',
    killerLine: 'Mas se você emite curso em Curitiba, vende via Hotmart e o aluno só responde no Zap, está pagando em dólar pelo que sobra.',
    rows: [
      { feature: 'Cobrança', us: 'R$ em Pix, Boleto, Cartão até 12x', them: 'USD via cartão internacional', winner: 'us' },
      { feature: 'Suporte', us: 'PT-BR, WhatsApp, em minutos', them: 'EN, email, 24-48h', winner: 'us' },
      { feature: 'Integração Hotmart nativa', us: '✓ Webhook 1-clique', them: 'Via Zapier (extra $$)', winner: 'us' },
      { feature: 'Integração Memberkit nativa', us: '✓', them: '✗', winner: 'us' },
      { feature: 'Integração Fluent Community', us: '✓', them: '✗', winner: 'us' },
      { feature: 'Envio WhatsApp Cloud API', us: '✓ nativo', them: '✗ não tem', winner: 'us' },
      { feature: 'NF-e automática (BR)', us: '✓', them: '✗', winner: 'us' },
      { feature: 'Domínio próprio', us: '✓ no Pro (R$ 297)', them: '✓ apenas Enterprise', winner: 'us' },
      { feature: 'Open Badges 3.0', us: '✓', them: '✓', winner: 'tie' },
      { feature: 'Editor visual drag-and-drop', us: 'Em S14', them: '✓ maduro', winner: 'them' },
      { feature: 'Templates prontos', us: '6 estilos premium + custom', them: '50+ templates', winner: 'them' },
      { feature: 'Volume free tier', us: '50 certs/mês', them: '50 certs/mês', winner: 'tie' },
      { feature: 'Preço Starter mensal', us: 'R$ 97 (~ US$ 18)', them: 'US$ 49 (~ R$ 270)', winner: 'us' },
      { feature: 'LGPD-ready', us: '✓ DPO + sub-operadores', them: 'GDPR-only', winner: 'us' },
      { feature: 'Edge BR (Cloudflare São Paulo)', us: '✓', them: '✗ AWS US-east', winner: 'us' },
    ],
    verdict: {
      use_us:
        'Você cobra em real, vende em plataformas BR (Hotmart/Memberkit/Fluent), seu aluno responde no Zap, e quer NF-e automática.',
      use_them:
        'Você vende cursos B2B em inglês pra mercado internacional, precisa de editor visual maduro hoje, cobrança em USD.',
    },
    testimonial: {
      quote: 'Tentei o Certifier antes — interface em inglês, suporte demorando 2 dias, boleto não existia. Migrei pro UniverCert e configurei em 1 tarde. Aluno recebe no Zap e ainda compartilha no Insta.',
      name: 'Marina Souza',
      role: 'Estética Avançada · Curitiba',
      initials: 'MS',
    },
    related: [
      { slug: 'sertifier', label: 'vs Sertifier' },
      { slug: 'canva', label: 'vs Canva' },
    ],
  },
  sertifier: {
    name: 'Sertifier',
    fullName: 'Sertifier.com',
    pitch: 'Plataforma turca focada em organizações grandes e LMS.',
    flag: '🇹🇷',
    h1: 'UniverCert vs Sertifier · vale a pena pra escolas brasileiras?',
    description:
      'Comparação UniverCert vs Sertifier: integrações BR nativas, cobrança em real, envio por WhatsApp, verify page profissional.',
    intro:
      'Sertifier mira universidades grandes e LMS corporativos com integração Moodle/Canvas.',
    killerLine: 'Pra cursos livres BR vendidos em Hotmart/Memberkit, é overkill — e ainda cobra em USD.',
    rows: [
      { feature: 'Cobrança', us: 'R$ em Pix, Boleto, Cartão', them: 'USD via cartão', winner: 'us' },
      { feature: 'Suporte', us: 'PT-BR via WhatsApp', them: 'EN/Turkish', winner: 'us' },
      { feature: 'Integração Hotmart', us: '✓ nativo', them: '✗', winner: 'us' },
      { feature: 'Integração Memberkit', us: '✓ nativo', them: '✗', winner: 'us' },
      { feature: 'Envio WhatsApp', us: '✓', them: '✗', winner: 'us' },
      { feature: 'NF-e Brasil', us: '✓', them: '✗', winner: 'us' },
      { feature: 'Integração Moodle LMS', us: 'Em S15', them: '✓', winner: 'them' },
      { feature: 'Integração Canvas LMS', us: 'Em S15', them: '✓', winner: 'them' },
      { feature: 'API REST + Webhooks', us: '✓', them: '✓', winner: 'tie' },
      { feature: 'Bulk emit (CSV)', us: '✓', them: '✓', winner: 'tie' },
      { feature: 'Volume free tier', us: '50 certs/mês', them: '20 certs/mês', winner: 'us' },
      { feature: 'Starter mensal', us: 'R$ 97 (~ US$ 18)', them: 'US$ 39 (~ R$ 215)', winner: 'us' },
      { feature: 'White-label completo', us: '✓ no Pro (R$ 297)', them: 'Apenas Enterprise (US$ 199+)', winner: 'us' },
    ],
    verdict: {
      use_us:
        'Você é uma escola BR de cursos livres ou comunidade WordPress vendendo via Hotmart/Memberkit/Fluent.',
      use_them:
        'Você é universidade ou LMS corporativo com Moodle/Canvas e mais de 10k alunos ativos.',
    },
    testimonial: {
      quote: 'Sertifier é robusto, mas pra escola de cabelo no Brasil que vende na Hotmart, é dinheiro jogado fora. UniverCert faz o que eu preciso, no idioma certo, no preço certo.',
      name: 'Roberto Lima',
      role: 'Curso Online Barbearia Pro',
      initials: 'RL',
    },
    related: [
      { slug: 'certifier', label: 'vs Certifier' },
      { slug: 'canva', label: 'vs Canva' },
    ],
  },
  canva: {
    name: 'Canva',
    fullName: 'Canva (DIY)',
    pitch: 'Editor de design popular usado por 90% das escolas BR pra fazer cert manualmente.',
    flag: '🌍',
    h1: 'UniverCert vs Canva · automação real vs DIY artesanal',
    description:
      'Pare de fazer certificados no Canva. Compare UniverCert (automatizado, verificável) vs Canva (manual, sem proof).',
    intro:
      'Canva é amazing pra design — mas certificado pede MAIS que design bonito.',
    killerLine: 'Pede emissão automática, hash imutável, verify page pública, integração com plataforma de curso, envio por WhatsApp. No Canva você ainda faz tudo manual.',
    rows: [
      { feature: 'Tempo por certificado', us: '< 30s automático', them: '~8min manual', winner: 'us' },
      { feature: 'Emissão automática (webhook)', us: '✓ Hotmart, Memberkit, Fluent, Kiwify', them: '✗ Tudo manual', winner: 'us' },
      { feature: 'URL de verificação pública', us: '✓ /v/{id} com QR', them: '✗ É só um PDF', winner: 'us' },
      { feature: 'Hash SHA-256 imutável', us: '✓', them: '✗', winner: 'us' },
      { feature: 'LinkedIn 1-clique', us: '✓ pré-preenchido', them: '✗ aluno não sabe que pode', winner: 'us' },
      { feature: 'WhatsApp automático (Meta API)', us: '✓', them: '✗', winner: 'us' },
      { feature: 'Open Badges 3.0', us: '✓ JSON-LD', them: '✗', winner: 'us' },
      { feature: 'Bulk emit (100s de cert)', us: '✓ CSV upload', them: 'Tedioso', winner: 'us' },
      { feature: 'Audit log + revogação', us: '✓', them: '✗', winner: 'us' },
      { feature: 'Custo mensal', us: 'R$ 0 a 297', them: 'Grátis (Canva Free)', winner: 'them' },
      { feature: 'Liberdade total de design', us: '6 templates premium + cores custom', them: '✓ qualquer coisa', winner: 'them' },
      { feature: 'Curva de aprendizado', us: '5min', them: '0min (todos sabem)', winner: 'them' },
    ],
    verdict: {
      use_us:
        'Você emite mais que 10 certs/mês, quer integração automática, e quer que aluno compartilhe no LinkedIn (= marketing orgânico de graça).',
      use_them:
        'Você emite 1-2 certs/mês, é uma escola pequena começando, e cert é só "lembrança bonita" sem necessidade de verificação ou automação.',
    },
    testimonial: {
      quote: 'Antes eu fazia certificado no Canva, exportava PDF, mandava por email e o aluno nem abria. Agora vai pelo Zap automático, o aluno responde "obrigado" e ainda compartilha no Insta. Triplicou meu marketing orgânico.',
      name: 'Ana Carolina',
      role: 'Escola UniverHair · São Paulo',
      initials: 'AC',
    },
    related: [
      { slug: 'certifier', label: 'vs Certifier' },
      { slug: 'sertifier', label: 'vs Sertifier' },
    ],
  },
};

export async function generateMetadata({ params }: Params) {
  const { competitor } = await params;
  const c = COMPARISONS[competitor];
  if (!c) return { title: 'Comparação · UniverCert' };
  return {
    title: `${c.h1}`,
    description: c.description,
    openGraph: { title: c.h1, description: c.description, type: 'article' },
    alternates: { canonical: `/vs/${competitor}` },
  };
}

export default async function ComparisonPage({ params }: Params) {
  const { competitor } = await params;
  const c = COMPARISONS[competitor];
  if (!c) notFound();

  const usWins = c.rows.filter((r) => r.winner === 'us').length;
  const themWins = c.rows.filter((r) => r.winner === 'them').length;
  const ties = c.rows.filter((r) => r.winner === 'tie').length;

  // BreadcrumbList JSON-LD pra SEO
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'UniverCert', item: 'https://univercert.net' },
      { '@type': 'ListItem', position: 2, name: 'Comparativos', item: 'https://univercert.net/vs' },
      { '@type': 'ListItem', position: 3, name: `vs ${c.name}`, item: `https://univercert.net/vs/${competitor}` },
    ],
  };

  return (
    <main className="bg-white relative overflow-x-clip">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <StickyCTA message={`Testar UniverCert grátis · sem cadastro`} href="/demo" />

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

      {/* Breadcrumb */}
      <div className="border-b border-gray-100 bg-gray-50/50">
        <div className="max-w-6xl mx-auto px-6 py-3 text-xs text-ink-500 flex items-center gap-2">
          <a href="/" className="hover:text-primary">UniverCert</a>
          <span className="text-ink-500/50">/</span>
          <a href="/#features" className="hover:text-primary">Comparativos</a>
          <span className="text-ink-500/50">/</span>
          <span className="text-ink-700 font-bold">vs {c.name}</span>
        </div>
      </div>

      {/* HERO — VS visual centro */}
      <section className="relative py-20 md:py-24 px-6 bg-mesh overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full opacity-20 blur-3xl bg-gradient-to-br from-primary to-accent animate-float" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full opacity-15 blur-3xl bg-gradient-to-br from-violet-500 to-primary animate-float" style={{ animationDelay: '2s' }} />

        <div className="max-w-5xl mx-auto relative">
          {/* VS visual */}
          <div className="flex items-center justify-center gap-5 md:gap-10 mb-10 animate-fade-in">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 md:w-24 md:h-24 rounded-3xl bg-gradient-to-br from-primary to-primary-dark shadow-glow-primary mb-3">
                <Logo size={64} variant="mark-light" className="text-white" />
              </div>
              <div className="font-display text-2xl md:text-3xl font-semibold tracking-tight">
                <span className="text-primary">univer</span><span className="text-accent">CERT</span>
              </div>
              <div className="text-[10px] uppercase tracking-widest text-ink-500 font-bold mt-1">🇧🇷 Brasil</div>
            </div>

            <div className="font-display text-5xl md:text-7xl font-semibold text-ink-500/40 italic leading-none">vs</div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 md:w-24 md:h-24 rounded-3xl bg-gray-100 border border-gray-200 mb-3 text-4xl">
                {c.flag}
              </div>
              <div className="font-display text-2xl md:text-3xl font-semibold tracking-tight text-ink-700">
                {c.name}
              </div>
              <div className="text-[10px] uppercase tracking-widest text-ink-500 font-bold mt-1">{c.pitch.split(' ')[1] ?? c.flag}</div>
            </div>
          </div>

          <div className="text-center max-w-3xl mx-auto animate-slide-up stagger-1">
            <h1 className="font-display text-3xl md:text-5xl font-semibold tracking-tighter leading-[1.05] mb-5 text-balance">
              {c.h1}
            </h1>
            <p className="text-base md:text-lg text-ink-500 mb-3 text-balance">{c.intro}</p>
            <p className="text-base md:text-lg text-ink-900 font-display italic max-w-2xl mx-auto text-balance">
              {c.killerLine}
            </p>
          </div>

          <div className="flex gap-3 justify-center flex-wrap mt-9 animate-slide-up stagger-2">
            <a href="/demo" className="btn-gradient text-base px-7 py-3.5">🧪 Testar UniverCert em 30s</a>
            <a href="#comparison" className="btn-secondary text-base px-7 py-3.5">Ver comparação completa ↓</a>
          </div>
        </div>
      </section>

      {/* SCORE BAR */}
      <section className="py-9 px-6 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-3xl mx-auto">
          <p className="text-center text-[10px] uppercase tracking-[0.3em] text-ink-500 font-bold mb-4">Placar geral</p>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="card !p-5 bg-success/5 border-success/30">
              <div className="text-[10px] uppercase tracking-widest text-success font-bold">UniverCert</div>
              <div className="font-display text-5xl font-semibold tracking-tight text-success mt-1">{usWins}</div>
              <div className="text-xs text-ink-500 mt-1">de {c.rows.length}</div>
            </div>
            <div className="card !p-5">
              <div className="text-[10px] uppercase tracking-widest text-ink-500 font-bold">Empate</div>
              <div className="font-display text-5xl font-semibold tracking-tight text-ink-700 mt-1">{ties}</div>
              <div className="text-xs text-ink-500 mt-1">pares iguais</div>
            </div>
            <div className="card !p-5">
              <div className="text-[10px] uppercase tracking-widest text-ink-500 font-bold">{c.name}</div>
              <div className="font-display text-5xl font-semibold tracking-tight text-ink-700 mt-1">{themWins}</div>
              <div className="text-xs text-ink-500 mt-1">categorias</div>
            </div>
          </div>
        </div>
      </section>

      {/* MOCKUP SIDE-BY-SIDE — text terminal style */}
      <section className="py-16 px-6 bg-gradient-to-br from-ink-900 via-ink-900 to-primary/40 text-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <div className="text-[10px] font-bold text-accent uppercase tracking-[0.3em] mb-3">Workflow real</div>
            <h2 className="font-display text-3xl md:text-4xl font-semibold tracking-tight">Quanto tempo pra emitir 100 certificados?</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/10">
                <div className="flex gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-400/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-green-400/80" />
                </div>
                <span className="text-[10px] font-mono text-white/50 ml-2">UniverCert · ~3min total</span>
              </div>
              <div className="font-mono text-xs space-y-2 text-white/80">
                <div><span className="text-success">$</span> Upload CSV com 100 alunos</div>
                <div className="text-white/40 pl-3">→ 100 recipients criados em 0.8s</div>
                <div><span className="text-success">$</span> Click "Aprovar todos"</div>
                <div className="text-white/40 pl-3">→ 100 credentials emitidas em 12s</div>
                <div><span className="text-success">$</span> WhatsApp dispara automático</div>
                <div className="text-white/40 pl-3">→ 100 mensagens em ~2min</div>
                <div className="pt-3 mt-3 border-t border-white/10 text-success font-bold">✓ Pronto. Vai tomar um café.</div>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/10">
                <div className="flex gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-400/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-green-400/80" />
                </div>
                <span className="text-[10px] font-mono text-white/50 ml-2">{c.name} · ~13 horas</span>
              </div>
              <div className="font-mono text-xs space-y-2 text-white/60">
                <div><span className="text-warning">$</span> Editar template manualmente pra cada nome</div>
                <div className="text-white/40 pl-3">→ ~5min por cert × 100</div>
                <div><span className="text-warning">$</span> Exportar PDF, salvar no drive</div>
                <div className="text-white/40 pl-3">→ ~1min por cert × 100</div>
                <div><span className="text-warning">$</span> Mandar email manual com anexo</div>
                <div className="text-white/40 pl-3">→ ~2min por cert × 100</div>
                <div className="pt-3 mt-3 border-t border-white/10 text-warning font-bold">⚠ Sua quinta-feira inteira.</div>
              </div>
            </div>
          </div>

          <p className="text-center text-xs text-white/50 mt-7 italic max-w-2xl mx-auto">
            * Estimativas baseadas em workflows reais de escolas BR. Diferença = ~12h economizadas a cada 100 certs. A R$ 50/h, isso é R$ 600.
          </p>
        </div>
      </section>

      {/* COMPARISON TABLE */}
      <section id="comparison" className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="text-[10px] font-bold text-primary uppercase tracking-[0.3em] mb-3">Recurso por recurso</div>
            <h2 className="font-display text-3xl md:text-5xl font-semibold tracking-tight">Comparação detalhada</h2>
          </div>

          <div className="card !p-0 overflow-hidden shadow-card-lift">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gradient-to-r from-primary to-primary-dark text-white">
                  <tr>
                    <th className="px-5 py-4 text-left font-bold text-xs uppercase tracking-widest">Recurso</th>
                    <th className="px-5 py-4 text-left font-bold">
                      <span className="flex items-center gap-2">
                        <Logo size={18} variant="mark-light" className="text-white" />
                        UniverCert
                      </span>
                    </th>
                    <th className="px-5 py-4 text-left font-bold">
                      <span className="flex items-center gap-2">
                        <span>{c.flag}</span> {c.name}
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {c.rows.map((r, i) => (
                    <tr key={i} className="border-t border-gray-100 hover:bg-primary-soft/30 transition">
                      <td className="px-5 py-3.5 font-bold text-ink-900">{r.feature}</td>
                      <td className={`px-5 py-3.5 ${r.winner === 'us' ? 'text-success font-bold bg-success/5' : 'text-ink-700'}`}>
                        {r.winner === 'us' && <span className="inline-block mr-1.5">✓</span>}
                        {r.us}
                      </td>
                      <td className={`px-5 py-3.5 ${r.winner === 'them' ? 'text-ink-900 font-bold bg-gray-50' : 'text-ink-500'}`}>
                        {r.winner === 'them' && <span className="inline-block mr-1.5">✓</span>}
                        {r.them}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIAL callout */}
      <section className="py-20 px-6 bg-gradient-to-br from-primary-soft/30 via-white to-accent/5">
        <div className="max-w-3xl mx-auto">
          <div className="card-glass relative !p-9 md:!p-12">
            <div className="absolute -top-6 left-9 text-9xl text-primary/15 font-display leading-none">&ldquo;</div>
            <div className="text-yellow-400 mb-4 text-base tracking-wider">★★★★★</div>
            <p className="font-display text-xl md:text-2xl text-ink-900 leading-relaxed mb-7 text-balance">
              {c.testimonial.quote}
            </p>
            <div className="flex items-center gap-4 pt-5 border-t border-gray-100">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent text-white font-bold flex items-center justify-center text-lg shadow-glow-primary">
                {c.testimonial.initials}
              </div>
              <div>
                <div className="font-bold text-base">{c.testimonial.name}</div>
                <div className="text-sm text-ink-500">{c.testimonial.role}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* VERDICT */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="text-[10px] font-bold text-primary uppercase tracking-[0.3em] mb-3">Veredicto</div>
            <h2 className="font-display text-3xl md:text-5xl font-semibold tracking-tight text-balance">
              Qual escolher? Depende do seu caso.
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            <div className="card-hover relative overflow-hidden border-2 border-success/40 bg-gradient-to-br from-success/5 to-white !p-8">
              <div className="absolute top-0 right-0 w-24 h-24 bg-success/10 rounded-full blur-2xl" />
              <div className="relative">
                <div className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-success font-bold mb-3 px-2.5 py-1 bg-success/10 rounded-full">
                  ✓ Recomendamos
                </div>
                <h3 className="font-display text-2xl font-semibold tracking-tight mb-3">Use UniverCert se:</h3>
                <p className="text-base text-ink-700 leading-relaxed mb-7">{c.verdict.use_us}</p>
                <a href="/sign-up" className="btn-gradient text-sm">Criar conta grátis →</a>
              </div>
            </div>

            <div className="card !p-8">
              <div className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-ink-500 font-bold mb-3 px-2.5 py-1 bg-gray-100 rounded-full">
                Considere {c.name}
              </div>
              <h3 className="font-display text-2xl font-semibold tracking-tight mb-3">Use {c.name} se:</h3>
              <p className="text-base text-ink-700 leading-relaxed mb-7">{c.verdict.use_them}</p>
              <p className="text-xs text-ink-500 italic">Sem rancor — a ferramenta certa depende do seu caso.</p>
            </div>
          </div>
        </div>
      </section>

      {/* RELATED */}
      <section className="py-12 px-6 bg-gray-50">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-[10px] uppercase tracking-[0.3em] text-ink-500 font-bold mb-4">
            Comparar com outros
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            {c.related.map((r) => (
              <a
                key={r.slug}
                href={`/vs/${r.slug}`}
                className="px-4 py-2 rounded-full border border-gray-200 bg-white text-sm font-medium text-ink-700 hover:border-primary hover:text-primary transition"
              >
                {r.label} →
              </a>
            ))}
            <a
              href="/roi"
              className="px-4 py-2 rounded-full border border-gray-200 bg-white text-sm font-medium text-ink-700 hover:border-primary hover:text-primary transition"
            >
              🧮 Calcular ROI →
            </a>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-24 px-6 bg-gradient-to-br from-ink-900 via-ink-900 to-primary/40 text-white text-center overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full opacity-30 blur-3xl bg-gradient-to-br from-primary to-accent animate-float" />
        <div className="max-w-2xl mx-auto relative">
          <h2 className="font-display text-3xl md:text-5xl font-semibold tracking-tight mb-5 text-balance">
            Por que não testar antes de decidir?
          </h2>
          <p className="text-white/70 mb-8 text-balance">
            Demo em 30 segundos · sem cadastro · cert real, verificável, com QR code, na sua palma da mão.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <a href="/demo" className="btn-gradient text-base px-7 py-3.5">🧪 Testar agora</a>
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

// Sprint 19 fix: edge runtime + generateStaticParams são incompatíveis no Next 15.
// Mantemos edge p/ Cloudflare Pages e fazemos lookup dinâmico (COMPARISONS é em memória).
// Removendo `export const runtime = 'edge'` permite SSG, mas perde benefícios do edge.
