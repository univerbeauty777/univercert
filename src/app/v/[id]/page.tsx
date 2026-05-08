// UniverCert · verify page premium

import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { credentials, recipients, workspaces, brandKits, verifyLogs } from '@/db/schema';
import { ID } from '@/lib/ulid';

export const runtime = 'edge';

type Params = { params: Promise<{ id: string }> };

async function getCredentialDetails(id: string) {
  const db = getDb();
  const [row] = await db
    .select({
      credential: credentials,
      recipient: recipients,
      workspace: workspaces,
      brand: brandKits,
    })
    .from(credentials)
    .leftJoin(recipients, eq(credentials.recipientId, recipients.id))
    .leftJoin(workspaces, eq(credentials.workspaceId, workspaces.id))
    .leftJoin(brandKits, eq(brandKits.workspaceId, workspaces.id))
    .where(eq(credentials.id, id))
    .limit(1);
  return row;
}

async function logView(credentialId: string, ctx: { ipCountry?: string; ipCity?: string; userAgent?: string; referer?: string }) {
  try {
    const db = getDb();
    await db.insert(verifyLogs).values({
      id: ID.verifyLog(),
      credentialId,
      ipCountry: ctx.ipCountry,
      ipCity: ctx.ipCity,
      userAgent: ctx.userAgent,
      referer: ctx.referer,
    });
  } catch (e) {
    console.error('verify log failed', e);
  }
}

export default async function VerifyPage({ params }: Params) {
  const { id } = await params;
  const data = await getCredentialDetails(id);
  if (!data || !data.credential) notFound();

  const { credential, recipient, workspace, brand } = data;
  const isRevoked = credential.revokedAt !== null;
  const isExpired = credential.expiresAt && credential.expiresAt < Math.floor(Date.now() / 1000);
  const isDemo = workspace?.slug === 'demo';

  if (!isRevoked) {
    const h = await headers();
    void logView(credential.id, {
      ipCountry: h.get('cf-ipcountry') ?? undefined,
      ipCity: h.get('cf-ipcity') ?? undefined,
      userAgent: h.get('user-agent') ?? undefined,
      referer: h.get('referer') ?? undefined,
    });
  }

  const status = isRevoked
    ? { color: 'from-danger to-rose-600', text: 'Revogado', icon: '✗', textColor: 'text-danger' }
    : isExpired
    ? { color: 'from-warning to-orange-500', text: 'Expirado', icon: '⚠', textColor: 'text-warning' }
    : { color: 'from-success to-emerald-600', text: 'Verificado', icon: '✓', textColor: 'text-success' };

  const linkedinUrl = buildLinkedInUrl(credential, workspace?.name ?? 'UniverCert');
  const primaryColor = brand?.primaryColor ?? '#6366F1';
  const accentColor = brand?.secondaryColor ?? '#EC4899';

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-soft/30 py-12 px-4 relative overflow-hidden">
      {/* Background decorative gradient */}
      <div
        className="fixed -top-40 -right-40 w-96 h-96 rounded-full opacity-20 blur-3xl"
        style={{ background: `radial-gradient(circle, ${primaryColor} 0%, transparent 70%)` }}
      />
      <div
        className="fixed -bottom-40 -left-40 w-96 h-96 rounded-full opacity-20 blur-3xl"
        style={{ background: `radial-gradient(circle, ${accentColor} 0%, transparent 70%)` }}
      />

      <div className="max-w-2xl mx-auto relative animate-slide-up">
        {/* DEMO banner */}
        {isDemo && (
          <div className="mb-5 p-4 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-2xl text-sm flex items-start gap-3 shadow-sm">
            <span className="text-2xl">🧪</span>
            <div className="flex-1">
              <div className="font-bold text-amber-900 mb-0.5">Este é um certificado de demonstração</div>
              <p className="text-xs text-amber-800 leading-relaxed">
                Foi gerado pela página <code className="bg-amber-100 px-1 rounded">univercert.com.br/demo</code> apenas
                para você ver como o certificado funciona. Não tem validade legal.
              </p>
              <a href="/sign-up" className="inline-block mt-2 text-xs font-bold text-primary hover:underline">
                Criar conta grátis e emitir certificados reais →
              </a>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <a href="/" className="flex items-center gap-2 hover:opacity-80 transition">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-primary/30"
              style={{ background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})` }}
            >
              🏆
            </div>
            <span className="font-extrabold tracking-tight">{workspace?.name ?? 'UniverCert'}</span>
          </a>
          <div
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-white text-xs font-bold uppercase tracking-wider shadow-md bg-gradient-to-r ${status.color}`}
          >
            {status.icon} {status.text}
          </div>
        </div>

        {/* Main card */}
        <div className="card shadow-2xl shadow-primary/10 border-2 relative overflow-hidden animate-scale-in">
          {/* Top stripe */}
          <div
            className="absolute top-0 left-0 right-0 h-1.5"
            style={{ background: `linear-gradient(90deg, ${primaryColor}, ${accentColor})` }}
          />

          <div className="text-xs uppercase tracking-[0.25em] text-gray-400 font-bold mb-3 mt-2">
            Certificado de Conclusão
          </div>

          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight mb-5">
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: `linear-gradient(135deg, #1a1a2e 30%, ${primaryColor})` }}
            >
              {recipient?.name}
            </span>
          </h1>

          <p className="text-base text-gray-600 mb-1">Concluiu com aproveitamento o curso de</p>
          <p className="text-2xl font-bold mb-7" style={{ color: primaryColor }}>
            {credential.courseName}
          </p>

          <div className="grid grid-cols-2 gap-4 text-sm border-t border-gray-100 pt-4">
            {credential.courseHours ? (
              <Field label="Carga horária" value={`${credential.courseHours}h`} />
            ) : null}
            {recipient?.cpf ? (
              <Field label="CPF" value={recipient.cpf} mono />
            ) : null}
            <Field
              label="Emitido em"
              value={new Date(credential.issuedAt * 1000).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
              })}
            />
            <Field label="ID" value={credential.id} mono small />
          </div>

          {!isRevoked && (
            <div className="mt-7 flex gap-3 flex-wrap">
              <a
                href={`/api/v1/credentials/${credential.id}/pdf`}
                target="_blank"
                rel="noopener"
                className="btn-primary text-sm"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 5v14M5 12l7 7 7-7" />
                </svg>
                Baixar PDF
              </a>
              <a href={linkedinUrl} target="_blank" rel="noopener" className="btn-secondary text-sm">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                </svg>
                Adicionar ao LinkedIn
              </a>
              <a
                href={`/api/v1/credentials/${credential.id}/openbadge.json`}
                target="_blank"
                rel="noopener"
                className="btn-secondary text-sm"
                title="Open Badges 3.0 JSON-LD"
              >
                Open Badge
              </a>
            </div>
          )}

          {isRevoked && credential.revokeReason && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              <strong className="font-bold">⚠ Certificado revogado.</strong>
              <br />
              Motivo: {credential.revokeReason}
            </div>
          )}
        </div>

        {/* Trust footer */}
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-400">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <span>
            Verificável 24/7 · hash SHA-256:{' '}
            <span className="font-mono select-all">{credential.hashSha256.slice(0, 16)}…</span>
          </span>
        </div>
        <div className="text-center mt-4 text-xs text-gray-400">
          Powered by{' '}
          <a href="https://univercert.com.br" className="text-primary font-semibold hover:underline">
            UniverCert
          </a>
        </div>
      </div>
    </main>
  );
}

function Field({ label, value, mono, small }: { label: string; value: string; mono?: boolean; small?: boolean }) {
  return (
    <div>
      <div className="text-gray-400 text-[10px] uppercase tracking-[0.15em] font-bold mb-1">{label}</div>
      <div className={`font-semibold ${mono ? 'font-mono' : ''} ${small ? 'text-xs' : ''}`}>{value}</div>
    </div>
  );
}

function buildLinkedInUrl(
  cred: { courseName: string; issuedAt: number; id: string },
  organizationName: string,
) {
  const issuedAt = new Date(cred.issuedAt * 1000);
  const params = new URLSearchParams({
    startTask: 'CERTIFICATION_NAME',
    name: cred.courseName,
    organizationName,
    issueYear: String(issuedAt.getFullYear()),
    issueMonth: String(issuedAt.getMonth() + 1),
    certUrl: `https://univercert.com.br/v/${cred.id}`,
    certId: cred.id,
  });
  return `https://www.linkedin.com/profile/add?${params.toString()}`;
}
