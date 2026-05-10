// UniverCert · Workflow template engine · Sprint 17
// Interpola {{variables}} em strings de template (email/WhatsApp)

export type WorkflowVars = {
  recipientName?: string;
  recipientFirstName?: string;
  recipientEmail?: string;
  recipientPhone?: string;
  courseName?: string;
  courseHours?: number | null;
  workspaceName?: string;
  verifyUrl?: string;
  pdfUrl?: string;
  credentialId?: string;
  issuedAt?: string;
};

export const AVAILABLE_VARS = [
  { key: 'recipientName', label: 'Nome completo do aluno', example: 'Maria Aparecida da Silva' },
  { key: 'recipientFirstName', label: 'Primeiro nome', example: 'Maria' },
  { key: 'recipientEmail', label: 'Email do aluno', example: 'maria@gmail.com' },
  { key: 'recipientPhone', label: 'WhatsApp do aluno', example: '11999998888' },
  { key: 'courseName', label: 'Nome do curso', example: 'Alisamento Profissional' },
  { key: 'courseHours', label: 'Carga horária', example: '40' },
  { key: 'workspaceName', label: 'Nome da escola', example: 'UniverHair' },
  { key: 'verifyUrl', label: 'URL de verificação', example: 'https://univercert.net/v/cred_ABC' },
  { key: 'pdfUrl', label: 'URL do PDF', example: 'https://univercert.net/api/v1/credentials/cred_ABC/pdf' },
  { key: 'credentialId', label: 'ID do certificado', example: 'cred_ABC123' },
  { key: 'issuedAt', label: 'Data de emissão', example: '8 de maio de 2026' },
] as const;

const SAMPLE_VARS: WorkflowVars = {
  recipientName: 'Maria Aparecida da Silva',
  recipientFirstName: 'Maria',
  recipientEmail: 'maria@gmail.com',
  recipientPhone: '11999998888',
  courseName: 'Alisamento Profissional',
  courseHours: 40,
  workspaceName: 'UniverHair',
  verifyUrl: 'https://univercert.net/v/cred_ABC123',
  pdfUrl: 'https://univercert.net/api/v1/credentials/cred_ABC123/pdf',
  credentialId: 'cred_ABC123',
  issuedAt: '8 de maio de 2026',
};

/**
 * Interpola variáveis no formato {{variable}}.
 * - Variáveis desconhecidas ficam vazias (NÃO mantém o {{var}} literal pra evitar leak ao usuário).
 * - Trim do valor pra evitar surpresa.
 */
export function interpolate(template: string, vars: WorkflowVars): string {
  return template.replace(/\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g, (_, key) => {
    const v = (vars as any)[key];
    if (v === undefined || v === null) return '';
    return String(v).trim();
  });
}

/** Preview com vars de exemplo (pra mostrar no editor) */
export function previewWithSample(template: string, overrides: Partial<WorkflowVars> = {}): string {
  return interpolate(template, { ...SAMPLE_VARS, ...overrides });
}

/** Lista todas as variáveis usadas em um template (pra validação) */
export function extractVars(template: string): string[] {
  const matches = template.matchAll(/\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g);
  const set = new Set<string>();
  for (const m of matches) set.add(m[1]);
  return Array.from(set);
}

/** Valida que todas as variáveis usadas existem no nosso catalog */
export function validateTemplate(template: string): { ok: true } | { ok: false; unknownVars: string[] } {
  const used = extractVars(template);
  const known = new Set(AVAILABLE_VARS.map((v) => v.key));
  const unknown = used.filter((v) => !known.has(v as any));
  if (unknown.length === 0) return { ok: true };
  return { ok: false, unknownVars: unknown };
}

/** Defaults pra cada combinação channel × event */
export const DEFAULT_TEMPLATES: Record<string, { subject?: string; body: string }> = {
  'email:credential.issued': {
    subject: '🏆 Seu certificado de {{courseName}} chegou, {{recipientFirstName}}!',
    body: `Olá {{recipientFirstName}}!

Parabéns pela conclusão do curso de **{{courseName}}** ({{courseHours}}h)!

Seu certificado já está pronto e pode ser:
- 📄 Baixado em PDF: {{pdfUrl}}
- 🌐 Verificado online: {{verifyUrl}}
- 💼 Adicionado ao LinkedIn em 1 click

Compartilhe sua conquista! 🎓

Abraços,
Equipe {{workspaceName}}`,
  },
  'whatsapp:credential.issued': {
    body: `Oi {{recipientFirstName}}! 🏆

Seu certificado de *{{courseName}}* tá pronto!

📄 PDF: {{pdfUrl}}
✅ Verificar: {{verifyUrl}}

Posta no LinkedIn aí 💼

Equipe {{workspaceName}}`,
  },
  'email:nps.d7': {
    subject: 'Como foi o curso, {{recipientFirstName}}? 💛',
    body: `Oi {{recipientFirstName}}!

Faz uma semana que você concluiu *{{courseName}}*. Como você está achando o que aprendeu?

De 0 a 10, o quanto você recomendaria nosso curso pra um amigo?

Responde aí no Zap, vai me ajudar muito! 🙏

Obrigada,
{{workspaceName}}`,
  },
  'whatsapp:nps.d7': {
    body: `Oi {{recipientFirstName}}! 💛

Faz uma semana que você concluiu *{{courseName}}*.

De 0 a 10, o quanto você recomendaria pra um amigo?

Responde aí, ajuda muito 🙏`,
  },
  'email:request.created': {
    subject: 'Recebemos sua solicitação de certificado',
    body: `Oi {{recipientFirstName}}!

Recebemos sua solicitação de certificado para o curso *{{courseName}}*. Vamos validar e em breve enviar pra você.

Em caso de dúvida, responde esse email.

Equipe {{workspaceName}}`,
  },
  'whatsapp:request.created': {
    body: `Oi {{recipientFirstName}}!

Recebemos sua solicitação de certificado para *{{courseName}}*. Vamos validar e mandar pra você logo logo 👌`,
  },
  'email:credential.revoked': {
    subject: 'Importante: certificado revogado',
    body: `Olá {{recipientFirstName}},

Informamos que o certificado de *{{courseName}}* (ID: {{credentialId}}) foi revogado em {{issuedAt}}.

Se isso é um engano, entre em contato.

{{workspaceName}}`,
  },
  'whatsapp:credential.revoked': {
    body: `Olá {{recipientFirstName}}, seu certificado de *{{courseName}}* foi revogado. Entre em contato se foi engano.`,
  },
};
