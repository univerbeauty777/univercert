// UniverCert · Demo result · celebration + conversion CTA

import { notFound } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { credentials, recipients, workspaces } from '@/db/schema';
import DemoConfetti from './DemoConfetti';

export const runtime = 'edge';

type Params = { params: Promise<{ id: string }> };

export const metadata = {
  title: 'Pronto! Seu certificado de teste está aqui',
  description: 'Veja como funciona um certificado UniverCert. Compartilhe, baixe o PDF, ou crie sua conta gratuita para emitir certificados reais.',
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
  const verifyUrl = `https://univercert.com.br/v/${credential.id}`;
  const issuedDate = new Date(credential.issuedAt * 1000).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const waMessage = encodeURIComponent(
    `Olha o certificado que acabei de emitir em 30 segundos no UniverCert! ${verifyUrl}`,
  );
  const linkedinShareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(verifyUrl)}`;

  return (
    <main className="min-h-screen bg-gradient-to-br from-primary-soft via-white to-accent/10 px-4 relative overflow-hidden pb-16">
      <DemoConfetti />
      <div className="fixed -top-40 -right-40 w-[600px] h-[600px] rounded-full opacity-20 blur-3xl bg-gradient-to-br from-primary to-accent" />
      <div className="fixed -bottom-40 -left-40 w-[500px] h-[500px] rounded-full opacity-15 blur-3xl bg-gradient-to-br from-accent to-primary" />

      <nav className="relative z-10 max-w-5xl mx-auto py-5 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2 hover:opacity-80 transition">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold shadow-md shadow-primary/30">
            🏆
          </div>
          <span className="font-extrabold tracking-tight">
            Univer<span className="text-primary">Cert</span>
          </span>
        </a>
        <a href="/demo" className="text-sm text-gray-700 hover:text-primary transition">
          ← Testar de novo
        </a>
      </nav>

      <div className="relative z-10 max-w-2xl mx-auto pt-6">
        {/* Hero */}
        <div className="text-center mb-10 animate-slide-up">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-success/10 border border-success/30 rounded-full text-xs font-bold text-success uppercase tracking-wider mb-5">
            ✓ Emitido em segundos
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-[1.05] mb-3">
            Pronto, <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">{firstName(recipient?.name)}</span>!
          </h1>
          <p className="text-base text-gray-600 max-w-md mx-auto">
            Seu certificado de teste foi emitido com hash SHA-256 imutável e URL de verificação pública.
            Um link real, válido 24/7. Compartilha aí pra ver:
          </p>
        </div>

        {/* Cert preview card */}
        <div className="card shadow-2xl shadow-primary/15 border-2 border-primary/20 relative overflow-hidden animate-scale-in mb-6">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary to-accent" />
          <div className="text-xs uppercase tracking-[0.25em] text-gray-400 font-bold mb-3 mt-2">
            Certificado de Conclusão
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight leading-tight mb-4">
            <span className="bg-gradient-to-br from-gray-900 to-primary bg-clip-text text-transparent">
              {recipient?.name}
            </span>
          </h2>
          <p className="text-sm text-gray-600 mb-1">Concluiu com aproveitamento o curso de</p>
          <p className="text-xl font-bold text-primary mb-5">{credential.courseName}</p>
          <div className="grid grid-cols-2 gap-4 text-sm border-t border-gray-100 pt-4">
            <div>
              <div className="text-gray-400 text-[10px] uppercase tracking-[0.15em] font-bold mb-1">Emitido em</div>
              <div className="font-semibold">{issuedDate}</div>
            </div>
            <div>
              <div className="text-gray-400 text-[10px] uppercase tracking-[0.15em] font-bold mb-1">ID</div>
              <div className="font-semibold font-mono text-xs">{credential.id}</div>
            </div>
          </div>
        </div>

        {/* Share buttons */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-10">
          <ShareBtn href={`/v/${credential.id}`} icon="🔗" label="Ver verify" target="_blank" />
          <ShareBtn
            href={`/api/v1/credentials/${credential.id}/pdf`}
            icon="📄"
            label="Baixar PDF"
            target="_blank"
          />
          <ShareBtn
            href={`https://wa.me/?text=${waMessage}`}
            icon="💬"
            label="WhatsApp"
            target="_blank"
            highlight
          />
          <ShareBtn href={linkedinShareUrl} icon="💼" label="LinkedIn" target="_blank" />
        </div>

        {/* Conversion CTA */}
        <div className="card bg-gradient-to-br from-gray-900 via-gray-900 to-primary/40 text-white text-center py-10 relative overflow-hidden border-0">
          <div className="absolute -top-32 -right-32 w-72 h-72 rounded-full opacity-30 blur-3xl bg-gradient-to-br from-primary to-accent" />
          <div className="relative">
            <div className="inline-block px-3 py-1 bg-white/10 border border-white/20 rounded-full text-xs font-bold uppercase tracking-widest mb-4">
              🚀 Curtiu?
            </div>
            <h3 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-2">
              Agora emita certificados <span className="bg-gradient-to-r from-white to-accent bg-clip-text text-transparent">de verdade</span>.
            </h3>
            <p className="text-white/70 text-sm mb-6 max-w-md mx-auto">
              Conta gratuita. 50 certificados/mês sem custo. Sem cartão de crédito.
              No seu nome, com seu logo, integrado com Hotmart/Memberkit/Fluent.
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <a href="/sign-up" className="btn-primary text-base px-7 py-3.5">
                Criar conta grátis →
              </a>
              <a
                href="https://wa.me/5511999998888?text=Vim%20do%20demo%20do%20UniverCert%20e%20quero%20saber%20mais"
                target="_blank"
                rel="noopener noreferrer"
                className="text-base px-7 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 font-semibold transition border border-white/20"
              >
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

        {/* Disclaimer */}
        <p className="text-center text-xs text-gray-400 mt-6">
          🧪 Esse certificado é apenas para demonstração e expira em 90 dias. Para emitir certificados
          reais com seu logo, no seu domínio, <a href="/sign-up" className="text-primary font-semibold hover:underline">crie sua conta</a>.
        </p>
      </div>
    </main>
  );
}

function firstName(nome: string | null | undefined): string {
  if (!nome) return 'aluno(a)';
  return nome.trim().split(/\s+/)[0];
}

function ShareBtn({
  href,
  icon,
  label,
  target,
  highlight,
}: {
  href: string;
  icon: string;
  label: string;
  target?: string;
  highlight?: boolean;
}) {
  return (
    <a
      href={href}
      target={target}
      rel={target === '_blank' ? 'noopener noreferrer' : undefined}
      className={`card text-center hover:-translate-y-0.5 transition-all !p-3 flex flex-col items-center gap-1 ${
        highlight ? 'border-success/40 bg-success/5' : 'hover:border-primary/40'
      }`}
    >
      <span className="text-2xl">{icon}</span>
      <span className="text-xs font-bold">{label}</span>
    </a>
  );
}
