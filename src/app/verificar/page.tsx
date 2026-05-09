// UniverCert · Verificador público · Sprint 24
// Página SEO pra qualquer um colar ID/hash e validar cert

import { redirect } from 'next/navigation';
import { eq, like, or } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { credentials, recipients, workspaces } from '@/db/schema';
import Logo from '@/components/Logo';
import DarkModeToggle from '@/components/DarkModeToggle';
import Footer from '@/components/Footer';
import StickyCTA from '@/components/StickyCTA';

export const runtime = 'edge';

type Params = { searchParams: Promise<{ id?: string; q?: string }> };

export const metadata = {
  title: 'Verificar certificado · UniverCert',
  description:
    'Verifique a autenticidade de qualquer certificado digital UniverCert. Cole o ID ou hash SHA-256 e veja se é real.',
  alternates: { canonical: '/verificar' },
};

export default async function VerifyHubPage({ searchParams }: Params) {
  const sp = await searchParams;
  const query = (sp.id ?? sp.q ?? '').trim();

  let result: any = null;
  let notFound = false;
  let errorMsg: string | null = null;

  if (query) {
    if (query.length > 80 || /[<>'"`;\\]/.test(query)) {
      errorMsg = 'Identificador inválido — copie e cole o ID exato do certificado.';
    } else {
      try {
        const db = getDb();
        const looksLikeHash = /^[a-f0-9]{16,}$/i.test(query);
        const looksLikeId = query.startsWith('cred_');
        const looksLikeUrl = query.includes('/v/');

        let id: string | null = null;
        if (looksLikeUrl) {
          const m = query.match(/\/v\/(cred_[A-Za-z0-9_-]+)/);
          if (m) id = m[1];
        } else if (looksLikeId) {
          id = query;
        }

        if (id) {
          // Match by ID — redireciona pra /v/<id> (URL canônica)
          redirect(`/v/${id}`);
        }

        if (looksLikeHash) {
          // Tenta match por hash — pode achar mais de um (improvável) ou nenhum
          const [row] = await db
            .select({ credential: credentials, recipient: recipients, workspace: workspaces })
            .from(credentials)
            .leftJoin(recipients, eq(credentials.recipientId, recipients.id))
            .leftJoin(workspaces, eq(credentials.workspaceId, workspaces.id))
            .where(or(eq(credentials.hashSha256, query.toLowerCase()), like(credentials.hashSha256, `${query.toLowerCase()}%`)))
            .limit(1);
          if (row?.credential) redirect(`/v/${row.credential.id}`);
          notFound = true;
        } else {
          notFound = true;
        }
      } catch (e) {
        // redirect() throws — re-throw pra Next.js processar
        if ((e as any)?.digest?.startsWith('NEXT_REDIRECT')) throw e;
        errorMsg = 'Erro ao buscar. Tente novamente.';
      }
    }
  }

  return (
    <main className="bg-white dark:bg-ink-900 relative overflow-x-clip min-h-screen">
      <StickyCTA message="Quer emitir certs assim na sua escola?" href="/demo" />

      <nav className="sticky top-0 z-50 bg-white/75 dark:bg-ink-900/75 backdrop-blur-xl border-b border-gray-100 dark:border-ink-700">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2.5">
            <Logo size={36} />
            <span className="font-extrabold text-base tracking-tight">
              <span className="text-primary dark:text-ink-200">univer</span>
              <span className="text-accent">CERT</span>
            </span>
          </a>
          <div className="flex items-center gap-1">
            <DarkModeToggle size="sm" />
            <a href="/demo" className="btn-secondary text-sm">Demo</a>
            <a href="/sign-up" className="btn-primary text-sm">Grátis</a>
          </div>
        </div>
      </nav>

      <section className="relative py-24 px-6 bg-mesh">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full opacity-20 blur-3xl bg-gradient-to-br from-primary to-accent animate-float" />
        <div className="max-w-3xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-ink-700 border border-primary/20 dark:border-ink-600 rounded-full text-[10px] font-bold text-primary dark:text-ink-300 uppercase tracking-[0.2em] mb-5 shadow-card">
            🔐 Verificador público · grátis
          </div>
          <h1 className="font-display text-4xl md:text-6xl font-semibold tracking-tighter leading-[1.0] mb-5 text-balance">
            Esse certificado é <span className="text-gradient">real?</span>
          </h1>
          <p className="text-lg text-ink-500 dark:text-ink-400 max-w-2xl mx-auto mb-9 text-balance">
            Cole o ID, hash SHA-256 ou URL completa do certificado UniverCert e a gente confirma na hora.
          </p>

          <form method="GET" action="/verificar" className="max-w-xl mx-auto">
            <div className="flex flex-col sm:flex-row gap-2.5">
              <input
                type="text"
                name="id"
                defaultValue={query}
                autoFocus
                placeholder="cred_ABC123 · ou hash SHA-256 · ou URL completa"
                className="input flex-1 !py-3.5 text-base font-mono"
              />
              <button type="submit" className="btn-gradient text-base px-7">
                Verificar →
              </button>
            </div>
          </form>

          {errorMsg && (
            <div className="mt-5 p-4 bg-warning/10 border border-warning/30 text-warning rounded-xl text-sm max-w-xl mx-auto">
              ⚠ {errorMsg}
            </div>
          )}

          {notFound && (
            <div className="mt-5 p-5 bg-danger-soft border border-danger/30 rounded-xl max-w-xl mx-auto text-left animate-slide-up">
              <div className="flex items-start gap-3">
                <span className="text-2xl">❌</span>
                <div>
                  <div className="font-bold text-danger mb-1">Certificado não encontrado</div>
                  <p className="text-sm text-ink-700 dark:text-ink-300 leading-relaxed mb-3">
                    Não achamos nenhum cert UniverCert com esse identificador. Confira o ID copiado do cert original ou da URL.
                  </p>
                  <p className="text-xs text-ink-500">
                    Atenção: certificados de OUTRAS plataformas (Canva, certificate makers, etc) não podem ser verificados aqui.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Como funciona */}
      <section className="py-20 px-6 bg-gradient-to-b from-white to-gray-50 dark:from-ink-900 dark:to-ink-800">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="text-[10px] font-bold text-primary dark:text-accent uppercase tracking-[0.3em] mb-3">Como funciona</div>
            <h2 className="font-display text-3xl md:text-4xl font-semibold tracking-tight text-balance">
              Toda credencial UniverCert é verificável
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            <Step n={1} title="Hash SHA-256 imutável" desc="Cada certificado é gerado com hash criptográfico do conteúdo. Mudar uma letra muda o hash inteiro." />
            <Step n={2} title="URL pública 24/7" desc="O cert tem uma URL única (univercert.com.br/v/cred_...) que valida em segundos." />
            <Step n={3} title="Open Badges 3.0" desc="Padrão IMS Global. Recrutadores, RHs e plataformas internacionais validam automaticamente." />
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="text-[10px] font-bold text-primary dark:text-accent uppercase tracking-[0.3em] mb-3">Por que confiar</div>
          <h2 className="font-display text-3xl md:text-4xl font-semibold tracking-tight mb-7 text-balance">
            Verificação que aceita auditoria
          </h2>
          <div className="grid md:grid-cols-2 gap-4 text-left">
            <div className="card !p-5">
              <div className="text-2xl mb-2">🔐</div>
              <h3 className="font-bold mb-1">Hash imutável</h3>
              <p className="text-sm text-ink-500 dark:text-ink-400 leading-relaxed">
                Computado da combinação de campos canônicos no momento da emissão. Não pode ser editado retroativamente.
              </p>
            </div>
            <div className="card !p-5">
              <div className="text-2xl mb-2">📋</div>
              <h3 className="font-bold mb-1">Audit log</h3>
              <p className="text-sm text-ink-500 dark:text-ink-400 leading-relaxed">
                Toda ação de emissão/revogação é registrada com IP, timestamp, user. Disponível pro DPO sob solicitação.
              </p>
            </div>
            <div className="card !p-5">
              <div className="text-2xl mb-2">🌐</div>
              <h3 className="font-bold mb-1">Cloudflare Edge</h3>
              <p className="text-sm text-ink-500 dark:text-ink-400 leading-relaxed">
                Hospedagem em data center brasileiro. SLA 99,9% (Pro/Enterprise) e backup automatizado.
              </p>
            </div>
            <div className="card !p-5">
              <div className="text-2xl mb-2">🇧🇷</div>
              <h3 className="font-bold mb-1">LGPD-ready</h3>
              <p className="text-sm text-ink-500 dark:text-ink-400 leading-relaxed">
                DPO declarado. Sub-operadores listados. Aluno pode revogar consentimento a qualquer momento.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-6 bg-gradient-to-br from-ink-900 via-ink-900 to-primary/40 text-white text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="font-display text-3xl md:text-5xl font-semibold tracking-tight mb-5 text-balance">
            Você é uma escola? Emita certs verificáveis.
          </h2>
          <p className="text-white/70 mb-8 text-balance">
            Demo grátis em 30s · sem cartão · cert real, com QR e URL pública.
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

function Step({ n, title, desc }: { n: number; title: string; desc: string }) {
  return (
    <div className="card-hover">
      <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-accent text-white text-base font-extrabold flex items-center justify-center mb-3 shadow-glow-primary">
        {n}
      </div>
      <h3 className="font-bold text-lg mb-1.5 tracking-tight">{title}</h3>
      <p className="text-sm text-ink-500 dark:text-ink-400 leading-relaxed">{desc}</p>
    </div>
  );
}
