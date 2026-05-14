// UniverCert · /app — Landing app nativo + PWA install (S34)

import type { Metadata } from 'next';
import Logo from '@/components/Logo';
import TopNav from '@/components/TopNav';

export const runtime = 'edge';

export const metadata: Metadata = {
  title: 'UniverCert no celular · App + PWA',
  description: 'Carteira de certificados no celular. Instala como app, recebe notificações, compartilha em 1 toque.',
  openGraph: {
    title: 'UniverCert no celular',
    description: 'Carteira de certificados verificáveis no seu bolso.',
  },
};

export default function AppLandingPage() {
  return (
    <main style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0A0E1A 0%, #1B2D5E 50%, #06B6D4 100%)', color: '#fff', overflow: 'hidden', position: 'relative' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 20% 20%, rgba(212,169,55,0.15), transparent 40%), radial-gradient(circle at 80% 80%, rgba(139,92,246,0.15), transparent 40%)' }} />

      <TopNav variant="dark" current="app" />

      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '60px 24px 80px', position: 'relative', zIndex: 2 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 1fr) minmax(280px, 1fr)', gap: 60, alignItems: 'center' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: 100, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 24 }}>
              📲 Em breve · Beta
            </div>
            <h1 style={{ fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: 800, lineHeight: 1.05, margin: '0 0 20px', letterSpacing: '-0.03em' }}>
              Sua carteira de<br/><span style={{ background: 'linear-gradient(to right, #D4A937, #06B6D4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>certificados no bolso.</span>
            </h1>
            <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.8)', lineHeight: 1.5, margin: '0 0 32px' }}>
              Acesse, compartilhe e adicione na carteira do iPhone/Android.<br/>
              Hoje: PWA. Em breve: app nativo iOS + Android.
            </p>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 40 }}>
              <a href="#install" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 24px', background: '#fff', color: '#1B2D5E', borderRadius: 14, fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>
                📲 Instalar PWA agora
              </a>
              <a href="/sign-up" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 24px', background: 'rgba(255,255,255,0.1)', color: '#fff', borderRadius: 14, fontSize: 14, fontWeight: 700, textDecoration: 'none', border: '1px solid rgba(255,255,255,0.3)' }}>
                Criar conta grátis →
              </a>
            </div>

            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
              <span>✓ Funciona offline</span>
              <span>✓ Apple/Google Wallet</span>
              <span>✓ Push notifications</span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
            <div style={{ width: 280, height: 560, borderRadius: 40, background: 'linear-gradient(180deg, #0A0E1A, #1B2D5E)', border: '8px solid #1a1a1a', boxShadow: '0 32px 80px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.1)', padding: 24, display: 'flex', flexDirection: 'column', gap: 16, position: 'relative' }}>
              <div style={{ width: 80, height: 6, background: '#1a1a1a', borderRadius: 3, margin: '0 auto -8px' }} />
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginTop: 8 }}>UniverCert · Carteira</div>

              <MockCert title="Botox capilar" hours={40} />
              <MockCert title="Progressiva premium" hours={60} />
              <MockCert title="Coloração avançada" hours={32} />
            </div>
          </div>
        </div>
      </section>

      <section id="install" style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(255,255,255,0.1)', padding: '60px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 32, textAlign: 'center' }}>Como instalar</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
            <Step icon="🍎" title="iPhone (Safari)" steps={['Toca em Compartilhar', 'Adicionar à Tela de Início', 'Pronto: vira app']} />
            <Step icon="🤖" title="Android (Chrome)" steps={['Menu (⋮)', 'Instalar app', 'Adiciona ao launcher']} />
            <Step icon="🖥" title="Desktop" steps={['Banner no canto', 'Clica Instalar', 'Atalho no dock/menu']} />
          </div>
        </div>
      </section>

      <footer style={{ textAlign: 'center', padding: 32, color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>
        UniverCert · Certificados verificáveis · 🇧🇷 feito no Brasil
      </footer>
    </main>
  );
}

function MockCert({ title, hours }: { title: string; hours: number }) {
  return (
    <div style={{ background: 'linear-gradient(135deg, #fff8e7, #fff)', borderRadius: 16, padding: 14, color: '#1B2D5E', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
      <div style={{ fontSize: 9, color: '#D4A937', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase' }}>UniverCert</div>
      <div style={{ fontSize: 14, fontWeight: 700, marginTop: 4 }}>{title}</div>
      <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>{hours}h · Verificado ✓</div>
    </div>
  );
}

function Step({ icon, title, steps }: { icon: string; title: string; steps: string[] }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: 20 }}>
      <div style={{ fontSize: 28, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 10 }}>{title}</div>
      <ol style={{ margin: 0, paddingLeft: 18, color: 'rgba(255,255,255,0.7)', fontSize: 13, lineHeight: 1.7 }}>
        {steps.map((s, i) => <li key={i}>{s}</li>)}
      </ol>
    </div>
  );
}
