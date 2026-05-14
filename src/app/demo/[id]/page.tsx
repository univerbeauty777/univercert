// UniverCert · Demo result · Sprint 12 (logo navy/gold)

import { notFound } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { credentials, recipients, workspaces } from '@/db/schema';
import DemoConfetti from './DemoConfetti';
import EmittedAgo from './EmittedAgo';
import Logo from '@/components/Logo';

export const runtime = 'edge';

type Params = { params: Promise<{ id: string }> };

export const metadata = {
  title: 'Pronto! Seu certificado de teste está aqui',
  description: 'Veja como funciona um certificado UniverCert. Compartilhe, baixe o PDF, ou crie sua conta gratuita.',
};

export default async function DemoResultPage({ params }: Params) {
  const { id } = await params;
  const db = getDb();
  const [row] = await db
    .select({ credential: credentials, recipient: recipients, workspace: workspaces })
    .from(credentials)
    .leftJoin(recipients, eq(credentials.recipientId, recipients.id))
    .leftJoin(workspaces, eq(credentials.workspaceId, workspaces.id))
    .where(eq(credentials.id, id))
    .limit(1);

  if (!row || !row.credential || row.workspace?.slug !== 'demo') notFound();

  const { credential, recipient } = row;
  const verifyUrl = `https://univercert.net/v/${credential.id}`;
  const issuedDate = new Date(credential.issuedAt * 1000).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric',
  });

  const waMessage = encodeURIComponent(`Olha o certificado que acabei de emitir em 30 segundos no UniverCert! ${verifyUrl}`);
  const linkedinShareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(verifyUrl)}`;

  return (
    <main className="min-h-screen bg-mesh relative overflow-hidden pb-20">
      <DemoConfetti />
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-primary-soft/40 via-white to-accent/10" />
      <div className="fixed -top-40 -right-40 w-[600px] h-[600px] rounded-full opacity-30 blur-3xl bg-gradient-to-br from-primary to-accent" />
      <div className="fixed -bottom-40 -left-40 w-[500px] h-[500px] rounded-full opacity-20 blur-3xl bg-gradient-to-br from-violet-500 to-primary" />

      <nav className="relative z-10 max-w-5xl mx-auto py-5 px-5 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2.5 group">
          <Logo size={40} className="group-hover:scale-105 transition-transform drop-shadow-md" />
          <span className="font-extrabold tracking-tight text-base">
            <span className="text-primary">univer</span>
            <span className="text-accent">CERT</span>
          </span>
        </a>
        <a href="/demo" className="text-xs md:text-sm text-ink-700 hover:text-primary transition flex items-center gap-1 font-medium">← Testar de novo</a>
      </nav>

      <div className="relative z-10 max-w-3xl mx-auto px-5 pt-4">
        <div className="text-center mb-10 animate-slide-up">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-success-soft border border-success/30 rounded-full text-[10px] font-bold text-success uppercase tracking-widest mb-5 shadow-card">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            <EmittedAgo issuedAt={credential.issuedAt} />
          </div>
          <h1 className="font-display text-5xl md:text-7xl font-semibold tracking-tight leading-[1.0] mb-4 text-balance">
            Pronto, <span className="text-gradient">{firstName(recipient?.name)}</span>!
          </h1>
          <p className="text-base md:text-lg text-ink-500 max-w-md mx-auto">
            Seu certificado de teste foi emitido com hash SHA-256 imutável e URL pública verificável 24/7. Um link real. Compartilha aí pra ver:
          </p>
        </div>

        <article className="card-glass relative overflow-hidden p-7 md:p-9 animate-scale-in shadow-card-lift mb-6 border-2 border-primary/15">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary via-violet-500 to-accent" />
          <div className="absolute -top-12 -right-12 w-56 h-56 rounded-full opacity-[0.05] pointer-events-none bg-gradient-to-br from-primary to-accent" />
          <div className="text-[10px] uppercase tracking-[0.4em] text-ink-500 font-bold mb-3">Certificado de Conclusão</div>
          <p className="text-sm text-ink-500 mb-2 italic font-display">conferimos a</p>
          <h2 className="font-display text-4xl md:text-5xl font-semibold tracking-tight leading-[1.05] mb-5 text-gradient-dark">
            {recipient?.name}
          </h2>
          <p className="text-sm text-ink-500 mb-1.5">por concluir com aproveitamento o curso de</p>
          <p className="font-display text-2xl md:text-3xl font-semibold text-primary mb-7 leading-tight">{credential.courseName}</p>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm border-t border-gray-100 pt-5">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-ink-500 font-bold mb-1">Emitido em</div>
              <div className="font-semibold">{issuedDate}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-widest text-ink-500 font-bold mb-1">Hash</div>
              <div className="font-mono text-xs select-all">{credential.hashSha256.slice(0, 8)}…</div>
            </div>
            <div className="col-span-2 md:col-span-1">
              <div className="text-[10px] uppercase tracking-widest text-ink-500 font-bold mb-1">ID</div>
              <div className="font-mono text-[11px] truncate">{credential.id}</div>
            </div>
          </div>
        </article>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-10 animate-fade-in stagger-2">
          <ShareBtn href={`/v/${credential.id}`} target="_blank" icon="🔗" label="Ver verify" sub="Link público" />
          <ShareBtn href={`/api/v1/credentials/${credential.id}/pdf`} target="_blank" icon="📄" label="Baixar PDF" sub="A4 landscape" />
          <ShareBtn href={`https://wa.me/?text=${waMessage}`} target="_blank" icon="💬" label="WhatsApp" sub="Mais usado BR" highlight />
          <ShareBtn href={linkedinShareUrl} target="_blank" icon="💼" label="LinkedIn" sub="Pra portfolio" />
        </div>

        <div className="card relative overflow-hidden text-center py-10 md:py-12 border-0 bg-gradient-to-br from-ink-900 via-ink-900 to-primary/40 text-white animate-fade-in stagger-3">
          <div className="absolute -top-32 -right-32 w-72 h-72 rounded-full opacity-30 blur-3xl bg-gradient-to-br from-primary to-accent" />
          <div className="absolute -bottom-32 -left-32 w-64 h-64 rounded-full opacity-20 blur-3xl bg-gradient-to-br from-violet-500 to-accent" />
          <div className="relative">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 border border-white/20 rounded-full text-[10px] font-bold uppercase tracking-widest mb-4 backdrop-blur">🚀 Curtiu?</div>
            <h3 className="font-display text-3xl md:text-4xl font-semibold tracking-tight mb-3 text-balance">
              Agora emita certificados <span className="bg-gradient-to-r from-white via-pink-200 to-accent bg-clip-text text-transparent">de verdade</span>.
            </h3>
            <p className="text-white/70 text-sm md:text-base mb-7 max-w-md mx-auto">
              Conta gratuita. 50 certificados/mês sem custo. Sem cartão de crédito. No seu nome, com seu logo.
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <a href="/sign-up" className="btn-primary text-base px-7 py-3.5">Criar conta grátis →</a>
              <a href="https://wa.me/5511999998888?text=Vim%20do%20demo%20do%20UniverCert" target="_blank" rel="noopener noreferrer" className="btn text-base px-7 py-3.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur">
                💬 Falar no WhatsApp
              </a>
            </div>
            <div className="flex gap-4 justify-center text-xs text-white/50 mt-7 flex-wrap">
              <span>✓ 5min pra configurar</span>
              <span>✓ Pix · Boleto · Cartão</span>
              <span>✓ LGPD-ready</span>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-ink-500 mt-7 max-w-md mx-auto">
          🧪 Esse certificado é apenas para demonstração e expira em 90 dias. Para emitir certificados reais, <a href="/sign-up" className="text-primary font-bold hover:underline">crie sua conta</a>.
        </p>
      </div>
    </main>
  );
}

function firstName(nome: string | null | undefined): string {
  if (!nome) return 'aluno(a)';
  return nome.trim().split(/\s+/)[0];
}

function ShareBtn({ href, icon, label, sub, target, highlight }: { href: string; icon: string; label: string; sub?: string; target?: string; highlight?: boolean }) {
  return (
    <a href={href} target={target} rel={target === '_blank' ? 'noopener noreferrer' : undefined}
      className={`card !p-3.5 text-center hover:-translate-y-1 transition-all flex flex-col items-center gap-1 group ${
        highlight ? 'border-success/40 bg-success/5 hover:border-success/60' : 'hover:border-primary/40'
      }`}>
      <span className="text-2xl group-hover:scale-110 transition-transform">{icon}</span>
      <span className="text-xs font-bold text-ink-900">{label}</span>
      {sub && <span className="text-[9px] text-ink-500 uppercase tracking-wider font-semibold">{sub}</span>}
    </a>
  );
}
