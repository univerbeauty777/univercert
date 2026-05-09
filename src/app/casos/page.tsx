// UniverCert · /casos · index dos verticais

import Footer from '@/components/Footer';
import Logo from '@/components/Logo';

export const runtime = 'edge';

export const metadata = {
  title: 'Casos de uso · Por nicho · UniverCert',
  description:
    'Como UniverCert atende cada nicho: cabelo, estética, barbearia, idiomas, MBA, cursos online. Templates recomendados + workflows otimizados.',
};

const VERTICALS = [
  { slug: 'cabelo', name: 'Cabelo · Beleza', emoji: '💇', desc: 'Cursos de alisamento, coloração, técnicas profissionais', accent: '#EC4899' },
  { slug: 'estetica', name: 'Estética · Beauty', emoji: '✨', desc: 'Micropigmentação, harmonização, estética avançada', accent: '#D4A937' },
  { slug: 'barbearia', name: 'Barbearia', emoji: '💈', desc: 'Cursos de barber, estilização masculina, salão', accent: '#1B2D5E' },
  { slug: 'idiomas', name: 'Idiomas', emoji: '🗣', desc: 'Inglês, espanhol, idiomas online com níveis CEFR', accent: '#1B2D5E' },
  { slug: 'mba', name: 'MBA · Pós', emoji: '🎓', desc: 'MBAs executivos, especializações, pós-graduação', accent: '#0A1224' },
  { slug: 'online', name: 'Cursos Online', emoji: '💻', desc: 'Infoprodutos, cursos digitais, criadores em escala', accent: '#6366F1' },
];

export default function CasosPage() {
  return (
    <main className="bg-white">
      <nav className="sticky top-0 z-50 bg-white/75 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2.5">
            <Logo size={36} />
            <span className="font-extrabold text-base tracking-tight">
              <span className="text-primary">univer</span>
              <span className="text-accent">CERT</span>
            </span>
          </a>
          <a href="/sign-up" className="btn-primary text-sm">Começar grátis</a>
        </div>
      </nav>

      <section className="relative py-20 px-6 bg-mesh">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full opacity-20 blur-3xl bg-gradient-to-br from-primary to-accent animate-float" />
        <div className="max-w-4xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-primary/20 rounded-full text-[10px] font-bold text-primary uppercase tracking-[0.2em] mb-5 shadow-card">
            🎯 Por nicho
          </div>
          <h1 className="font-display text-4xl md:text-6xl font-semibold tracking-tighter leading-[1.05] mb-5 text-balance">
            UniverCert pra <span className="text-gradient">sua escola</span>
          </h1>
          <p className="text-lg text-ink-500 max-w-2xl mx-auto">
            Cada nicho tem seu fluxo, seu template, seu jeito de vender. Veja como UniverCert se adapta.
          </p>
        </div>
      </section>

      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {VERTICALS.map((v, i) => (
              <a
                key={v.slug}
                href={`/casos/${v.slug}`}
                className="card-hover relative overflow-hidden p-6 animate-slide-up group"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div
                  className="absolute -top-12 -right-12 w-32 h-32 rounded-full opacity-10 blur-2xl group-hover:opacity-20 transition"
                  style={{ background: v.accent }}
                />
                <div className="relative">
                  <div className="text-5xl mb-4">{v.emoji}</div>
                  <h2 className="font-display text-2xl font-semibold tracking-tight mb-2">{v.name}</h2>
                  <p className="text-sm text-ink-500 mb-5 leading-relaxed">{v.desc}</p>
                  <span className="inline-flex items-center gap-1 text-sm font-bold text-primary group-hover:gap-2 transition-all">
                    Ver caso completo →
                  </span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-6 bg-gradient-to-br from-ink-900 via-ink-900 to-primary/40 text-white text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="font-display text-3xl md:text-5xl font-semibold tracking-tight mb-5 text-balance">
            Não achou seu nicho?
          </h2>
          <p className="text-white/70 mb-8 text-balance">
            UniverCert serve qualquer escola que emite certificados. Cabelo, gastronomia, fitness, religião, tecnologia, qualquer coisa.
          </p>
          <a href="/demo" className="btn-gradient text-base px-7 py-3.5">🧪 Testar em 30s →</a>
        </div>
      </section>

      <Footer />
    </main>
  );
}
