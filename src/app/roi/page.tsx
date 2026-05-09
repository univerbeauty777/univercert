// UniverCert · ROI calculator · Sprint 13

import RoiCalculator from './RoiCalculator';
import Footer from '@/components/Footer';
import Logo from '@/components/Logo';

export const runtime = 'edge';

export const metadata = {
  title: 'ROI Calculator · Quanto você economiza com UniverCert',
  description:
    'Calcule quanto sua escola economiza em horas + ganha em marketing orgânico ao automatizar certificados com UniverCert.',
};

export default function RoiPage() {
  return (
    <main className="bg-white relative overflow-x-clip">
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
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full opacity-20 blur-3xl bg-gradient-to-br from-primary to-accent" />
        <div className="max-w-4xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-primary/20 rounded-full text-[10px] font-bold text-primary uppercase tracking-[0.2em] mb-5 shadow-card">
            🧮 Calculadora de ROI
          </div>
          <h1 className="font-display text-4xl md:text-6xl font-semibold tracking-tighter leading-[1.0] mb-5 text-balance">
            Quanto você ganha automatizando seus <span className="text-gradient">certificados</span>?
          </h1>
          <p className="text-lg text-ink-500 max-w-2xl mx-auto">
            Insere os números da sua escola e veja quanto economiza por mês — em <strong>tempo</strong>, em <strong>marketing orgânico</strong> e em <strong>retenção</strong>.
          </p>
        </div>
      </section>

      <section className="py-12 px-6">
        <div className="max-w-5xl mx-auto">
          <RoiCalculator />
        </div>
      </section>

      <section className="py-20 px-6 bg-gradient-to-br from-ink-900 via-ink-900 to-primary/40 text-white text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="font-display text-3xl md:text-5xl font-semibold tracking-tight mb-5 text-balance">
            Pronto pra economizar?
          </h2>
          <p className="text-white/70 mb-8 text-balance">
            50 certs grátis/mês. Sem cartão. Configure em 5 min.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <a href="/sign-up" className="btn-gradient text-base px-7 py-3.5">Criar conta grátis →</a>
            <a href="/demo" className="btn text-base px-7 py-3.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur">
              🧪 Testar primeiro
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
