// UniverCert · Verify page · Sprint 12 + S26 + S60-S63 (white-label)

import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { eq, sql } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { credentials, recipients, workspaces, brandKits, verifyLogs } from '@/db/schema';
import { ID } from '@/lib/ulid';
import Logo from '@/components/Logo';
import DarkModeToggle from '@/components/DarkModeToggle';
import CertShareBar from '@/components/CertShareBar';
import { getWhiteLabelContext, whiteLabelCss, whiteLabelFooter } from '@/lib/whitelabel';

export const runtime = 'edge';

type Params = { params: Promise<{ id: string }> };

async function getCredentialDetails(id: string) {
  const db = getDb();
  const [row] = await db
    .select({ credential: credentials, recipient: recipients, workspace: workspaces, brand: brandKits })
    .from(credentials)
    .leftJoin(recipients, eq(credentials.recipientId, recipients.id))
    .leftJoin(workspaces, eq(credentials.workspaceId, workspaces.id))
    .leftJoin(brandKits, eq(brandKits.workspaceId, workspaces.id))
    .where(eq(credentials.id, id))
    .limit(1);
  return row;
}

async function getViewCount(credentialId: string): Promise<number> {
  try {
    const db = getDb();
    const [row] = await db
      .select({ count: sql<number>`count(*)` })
      .from(verifyLogs)
      .where(eq(verifyLogs.credentialId, credentialId));
    return Number(row?.count ?? 0);
  } catch { return 0; }
}

async function logView(credentialId: string, ctx: { ipCountry?: string; ipCity?: string; userAgent?: string; referer?: string }) {
  try {
    const db = getDb();
    await db.insert(verifyLogs).values({
      id: ID.verifyLog(), credentialId,
      ipCountry: ctx.ipCountry, ipCity: ctx.ipCity, userAgent: ctx.userAgent, referer: ctx.referer,
    });
  } catch {}
}

export default async function VerifyPage({ params }: Params) {
  const { id } = await params;
  const data = await getCredentialDetails(id);
  if (!data || !data.credential) notFound();

  const { credential, recipient, workspace, brand } = data;
  const isRevoked = credential.revokedAt !== null;
  const isExpired = credential.expiresAt && credential.expiresAt < Math.floor(Date.now() / 1000);
  const isDemo = workspace?.slug === 'demo';

  // S60-S63: white-label context
  const whiteLabel = await getWhiteLabelContext(credential.workspaceId);

  if (!isRevoked) {
    const h = await headers();
    void logView(credential.id, {
      ipCountry: h.get('cf-ipcountry') ?? undefined,
      ipCity: h.get('cf-ipcity') ?? undefined,
      userAgent: h.get('user-agent') ?? undefined,
      referer: h.get('referer') ?? undefined,
    });
  }

  // S78b: contagem de verificações ocultada da UI (Diego prefere foco em credibilidade).
  // logView() continua rodando pra analytics interno (verify_logs).

  const status = isRevoked
    ? { label: 'Revogado', icon: '✗', cls: 'bg-gradient-to-r from-danger to-rose-600' }
    : isExpired
      ? { label: 'Expirado', icon: '⚠', cls: 'bg-gradient-to-r from-warning to-orange-500' }
      : { label: 'Verificado', icon: '✓', cls: 'bg-gradient-to-r from-success to-emerald-600' };

  const linkedinUrl = buildLinkedInUrl(credential, workspace?.name ?? 'UniverCert');
  const primary = whiteLabel.brandColor ?? brand?.primaryColor ?? '#1B2D5E';
  const accent = brand?.secondaryColor ?? '#D4A937';
  // verifyUrl usa host atual (custom domain ou univercert.net)
  const hostHdrs = await headers();
  const currentHost = hostHdrs.get('host') ?? 'univercert.net';
  const verifyUrl = `https://${currentHost}/v/${credential.id}`;
  const issuedDate = new Date(credential.issuedAt * 1000).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric',
  });
  const waText = encodeURIComponent(`Acabei de receber um certificado de ${credential.courseName}! ${verifyUrl}`);

  return (
    <main className="min-h-screen bg-mesh relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-white via-primary-soft/20 to-accent/5 -z-10" />

      {isDemo && (
        <div className="relative bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border-b border-amber-200 z-10">
          <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
            <span className="text-xl">🧪</span>
            <div className="flex-1 text-sm">
              <strong className="font-bold text-amber-900">Certificado de demonstração.</strong>
              <span className="text-amber-800"> Não tem validade legal — gerado no <code className="bg-amber-100 px-1 rounded font-mono text-xs">/demo</code>.</span>
            </div>
            <a href="/sign-up" className="text-xs font-bold text-primary hover:underline whitespace-nowrap">
              Criar conta grátis →
            </a>
          </div>
        </div>
      )}

      <div className="relative max-w-3xl mx-auto px-4 pt-8 pb-16">
        <header className="flex items-center justify-between mb-7 animate-fade-in">
          <a href="/" className="flex items-center gap-2.5 group">
            <Logo size={40} className="group-hover:scale-105 transition-transform drop-shadow-md" />
            <div>
              <div className="font-extrabold tracking-tight text-[15px] leading-none">{workspace?.name ?? 'UniverCert'}</div>
              <div className="text-[10px] text-ink-500 uppercase tracking-wider font-bold mt-0.5">Certificação Digital</div>
            </div>
          </a>
          <div className="flex items-center gap-2">
            <DarkModeToggle size="sm" />
            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-white text-xs font-bold uppercase tracking-wider shadow-card ${status.cls}`}>
              <span className="text-[14px] leading-none">{status.icon}</span> {status.label}
            </div>
          </div>
        </header>

        <article className="card-glass relative overflow-hidden p-8 md:p-10 animate-scale-in shadow-card-lift">
          <div className="absolute top-0 left-0 right-0 h-1.5" style={{ background: `linear-gradient(90deg, ${primary}, ${accent})` }} />
          <div className="absolute -top-8 -right-8 w-40 h-40 opacity-[0.04] pointer-events-none" style={{ background: `radial-gradient(circle, ${primary}, transparent)` }} />

          <div className="text-[10px] uppercase tracking-[0.4em] text-ink-500 font-bold mb-3">Certificado de Conclusão</div>
          <p className="text-sm text-ink-500 mb-2 italic font-display">conferimos a</p>
          <h1
            className="font-display text-5xl md:text-6xl font-semibold tracking-tight leading-[1.05] mb-6"
            style={{
              backgroundImage: `linear-gradient(135deg, #0A0E1A 25%, ${primary} 100%)`,
              WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
            }}
          >{recipient?.name}</h1>
          <p className="text-base text-ink-500 mb-1.5">por concluir com aproveitamento o curso de</p>
          <p className="font-display text-2xl md:text-3xl font-semibold mb-7 leading-tight" style={{ color: primary }}>{credential.courseName}</p>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm border-t border-gray-100 pt-5">
            {credential.courseHours ? <Field label="Carga horária" value={`${credential.courseHours} horas`} /> : null}
            {recipient?.cpf ? <Field label="CPF" value={maskCpf(recipient.cpf)} mono /> : null}
            <Field label="Emitido em" value={issuedDate} />
          </div>

          {!isRevoked && (
            <div className="mt-7 space-y-3">
              <div className="flex gap-2.5 flex-wrap">
                <a href={`/api/v1/credentials/${credential.id}/pdf`} target="_blank" rel="noopener" className="btn-primary text-sm">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M12 5v14M5 12l7 7 7-7" /></svg>
                  Baixar PDF
                </a>
                <a href={`/api/v1/credentials/${credential.id}/badge`} target="_blank" rel="noopener" className="btn-ghost text-sm">📜 Open Badge 3.0</a>
                <a href={`/api/v1/credentials/${credential.id}/vc`} target="_blank" rel="noopener" className="btn-ghost text-sm">🔒 Verifiable Cred</a>
              </div>
              <CertShareBar
                baseUrl={verifyUrl.split('/v/')[0]}
                data={{
                  recipientName: recipient?.name ?? 'Aluno',
                  courseName: credential.courseName,
                  issuerName: workspace?.name ?? 'UniverCert',
                  issueDateISO: new Date(credential.issuedAt * 1000).toISOString().slice(0, 10),
                  certUrl: verifyUrl,
                  credentialId: credential.id,
                  hours: credential.courseHours ?? undefined,
                }}
              />
            </div>
          )}

          {isRevoked && credential.revokeReason && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 animate-slide-up">
              <strong className="font-bold block mb-1">⚠ Certificado revogado.</strong>
              Motivo: {credential.revokeReason}
            </div>
          )}
        </article>

        <div className="mt-7 grid grid-cols-2 md:grid-cols-4 gap-2 animate-fade-in stagger-2">
          <TrustItem icon="🔐" label="HMAC SHA-256" sub="Hash imutável" />
          <TrustItem icon="🌎" label="URL pública" sub="Verificável 24/7" />
          <TrustItem icon="📜" label="Open Badges 3.0" sub="IMS Global" />
          <TrustItem icon="⚡" label="Cloudflare" sub="Edge global" />
        </div>

        <div className="mt-5 text-center">
          <div className="inline-flex items-center gap-2 text-[11px] text-ink-500 font-mono">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            <span className="select-all">{credential.hashSha256.slice(0, 16)}…{credential.hashSha256.slice(-8)}</span>
          </div>
        </div>

        {!isDemo && !whiteLabel.hideUniverCertBrand && (
          <div className="mt-10 card-glass text-center py-7 animate-fade-in stagger-3">
            <p className="text-sm text-ink-500 mb-3">Você é uma escola que quer emitir certificados como esse?</p>
            <a href="https://univercert.net/demo" target="_blank" rel="noopener" className="btn-gradient text-sm">
              🧪 Testar grátis em 30 segundos →
            </a>
          </div>
        )}

        <div className="text-center mt-7 text-xs text-ink-500">
          {whiteLabel.hideUniverCertBrand ? (
            <>Certificados de <strong>{whiteLabel.workspaceName}</strong></>
          ) : (
            <>Certificado gerado por{' '}
              <a href="https://univercert.net" className="text-primary font-bold hover:underline">UniverCert</a>
              {' · 🇧🇷 feito no Brasil'}</>
          )}
        </div>
      </div>
    </main>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-ink-500 font-bold mb-1">{label}</div>
      <div className={`font-semibold text-ink-900 ${mono ? 'font-mono text-sm' : ''}`}>{value}</div>
    </div>
  );
}

function TrustItem({ icon, label, sub }: { icon: string; label: string; sub: string }) {
  return (
    <div className="card !p-3 flex items-center gap-2.5 hover:border-primary/30 transition-colors">
      <div className="text-xl">{icon}</div>
      <div className="min-w-0">
        <div className="text-[11px] font-bold text-ink-900 truncate">{label}</div>
        <div className="text-[10px] text-ink-500 truncate">{sub}</div>
      </div>
    </div>
  );
}

function maskCpf(cpf: string): string {
  const c = cpf.replace(/\D/g, '');
  if (c.length !== 11) return cpf;
  return `${c.slice(0, 3)}.***.***-${c.slice(9)}`;
}

function buildLinkedInUrl(cred: { courseName: string; issuedAt: number; id: string }, organizationName: string) {
  const issuedAt = new Date(cred.issuedAt * 1000);
  const params = new URLSearchParams({
    startTask: 'CERTIFICATION_NAME', name: cred.courseName, organizationName,
    issueYear: String(issuedAt.getFullYear()), issueMonth: String(issuedAt.getMonth() + 1),
    certUrl: `https://univercert.net/v/${cred.id}`, certId: cred.id,
  });
  return `https://www.linkedin.com/profile/add?${params.toString()}`;
}
