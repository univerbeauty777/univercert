// UniverCert · verify page pública /v/{id}
// Sprint 1.5: download PDF on-demand via /api/v1/credentials/:id/pdf

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

type LogContext = {
  ipCountry?: string;
  ipCity?: string;
  userAgent?: string;
  referer?: string;
};

async function logView(credentialId: string, ctx: LogContext) {
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
    ? { color: 'bg-danger', text: 'Revogado', icon: '✗' }
    : isExpired
    ? { color: 'bg-warning', text: 'Expirado', icon: '⚠' }
    : { color: 'bg-success', text: 'Verificado', icon: '✓' };

  const linkedinUrl = buildLinkedInUrl(credential, workspace?.name ?? 'UniverCert');

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-white py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
              style={{
                background: `linear-gradient(135deg, ${brand?.primaryColor ?? '#6366F1'}, ${brand?.secondaryColor ?? '#EC4899'})`,
              }}
            >
              🏆
            </div>
            <span className="font-bold">{workspace?.name ?? 'UniverCert'}</span>
          </div>
          <div
            className={`px-3 py-1 ${status.color} text-white text-xs font-bold rounded-full uppercase tracking-wider`}
          >
            {status.icon} {status.text}
          </div>
        </div>

        <div className="card shadow-xl">
          <div className="text-xs uppercase tracking-widest text-gray-400 mb-2">Certificado de Conclusão</div>
          <h1 className="text-3xl font-extrabold mb-4">{recipient?.name}</h1>
          <p className="text-sm text-gray-600 mb-1">Concluiu com aproveitamento o curso de</p>
          <p className="text-xl font-bold text-primary mb-6">{credential.courseName}</p>

          <div className="grid grid-cols-2 gap-4 text-sm border-t border-gray-100 pt-4">
            {credential.courseHours ? (
              <div>
                <div className="text-gray-400 text-xs uppercase tracking-wider">Carga horária</div>
                <div className="font-semibold">{credential.courseHours}h</div>
              </div>
            ) : null}
            {recipient?.cpf ? (
              <div>
                <div className="text-gray-400 text-xs uppercase tracking-wider">CPF</div>
                <div className="font-semibold">{recipient.cpf}</div>
              </div>
            ) : null}
            <div>
              <div className="text-gray-400 text-xs uppercase tracking-wider">Emitido em</div>
              <div className="font-semibold">
                {new Date(credential.issuedAt * 1000).toLocaleDateString('pt-BR')}
              </div>
            </div>
            <div>
              <div className="text-gray-400 text-xs uppercase tracking-wider">ID</div>
              <div className="font-mono text-xs">{credential.id}</div>
            </div>
          </div>

          {!isRevoked && (
            <div className="mt-6 flex gap-3 flex-wrap">
              <a
                href={`/api/v1/credentials/${credential.id}/pdf`}
                className="btn-primary"
                target="_blank"
                rel="noopener"
              >
                ⬇ Baixar PDF
              </a>
              <a href={linkedinUrl} target="_blank" rel="noopener" className="btn-secondary">
                Adicionar ao LinkedIn
              </a>
            </div>
          )}

          {isRevoked && credential.revokeReason && (
            <div className="mt-6 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              <strong>Revogado:</strong> {credential.revokeReason}
            </div>
          )}
        </div>

        <p className="text-xs text-center text-gray-400 mt-6">
          Verificável 24/7 · hash SHA-256: <span className="font-mono">{credential.hashSha256.slice(0, 16)}…</span>
        </p>
      </div>
    </main>
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
