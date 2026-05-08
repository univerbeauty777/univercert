// UniverCert · Open Badges 3.0 JSON-LD generator
// Spec IMS Global · https://www.imsglobal.org/spec/ob/v3p0

export type OpenBadgeArgs = {
  credentialId: string;
  hashSha256: string;
  recipientName: string;
  recipientEmail: string | null;
  cpf: string | null;
  courseName: string;
  courseHours: number | null;
  issuedAt: number;
  expiresAt: number | null;
  workspaceName: string;
  workspaceUrl: string;
  verifyUrl: string;
};

export function buildOpenBadge(args: OpenBadgeArgs) {
  const issuedDate = new Date(args.issuedAt * 1000).toISOString();
  const expiresDate = args.expiresAt ? new Date(args.expiresAt * 1000).toISOString() : undefined;

  return {
    '@context': [
      'https://www.w3.org/ns/credentials/v2',
      'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
    ],
    id: args.verifyUrl,
    type: ['VerifiableCredential', 'OpenBadgeCredential'],
    name: args.courseName,
    description: `Certificado de conclusão emitido por ${args.workspaceName}`,
    issuer: {
      id: args.workspaceUrl,
      type: ['Profile'],
      name: args.workspaceName,
      url: args.workspaceUrl,
    },
    validFrom: issuedDate,
    ...(expiresDate ? { validUntil: expiresDate } : {}),
    credentialSubject: {
      type: ['AchievementSubject'],
      identifier: [
        {
          type: 'IdentityObject',
          identityType: 'emailAddress',
          identityHash: args.recipientEmail ?? '',
        },
        ...(args.cpf
          ? [{ type: 'IdentityObject', identityType: 'nationalIdentifier', identityHash: args.cpf }]
          : []),
      ],
      name: args.recipientName,
      achievement: {
        id: `${args.verifyUrl}#achievement`,
        type: ['Achievement'],
        name: args.courseName,
        description: `Concluiu com aproveitamento o curso de ${args.courseName}${args.courseHours ? ` (${args.courseHours}h)` : ''}.`,
        criteria: {
          narrative: 'Participação e aproveitamento mínimo nas atividades do curso.',
        },
        ...(args.courseHours
          ? { creditsAvailable: args.courseHours }
          : {}),
      },
    },
    proof: {
      type: 'DataIntegrityProof',
      cryptosuite: 'sha256',
      created: issuedDate,
      proofPurpose: 'assertionMethod',
      proofValue: args.hashSha256,
    },
  };
}
