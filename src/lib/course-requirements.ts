// UniverCert · Course Requirements (S22)
// Spec do form custom de solicitacao de cert (anexado a courses.requirementsJson).

export type FieldType =
  | 'text'              // input single line
  | 'longtext'          // textarea
  | 'email'
  | 'url'
  | 'number'
  | 'checkbox'          // boolean
  | 'select'            // dropdown
  | 'image'             // 1 upload imagem
  | 'image_pair'        // 2 uploads (antes/depois)
  | 'video_url'         // YouTube/Vimeo (validacao de URL conhecida)
  | 'file';             // arquivo generico (PDF/zip/etc)

export type RequirementField = {
  id: string;                        // slug unico no form
  type: FieldType;
  label: string;
  helpText?: string;
  required?: boolean;
  placeholder?: string;
  /** Pra select: opcoes */
  options?: { value: string; label: string }[];
  /** Pra number: range */
  min?: number;
  max?: number;
  /** Pra text/longtext: comprimento */
  minLength?: number;
  maxLength?: number;
  /** Pra image/file: tipos aceitos (default depende do type) */
  accept?: string;
  /** Pra image_pair: labels custom (default 'Antes' / 'Depois') */
  beforeLabel?: string;
  afterLabel?: string;
};

export type RequirementsSchema = {
  version: 1;
  fields: RequirementField[];
};

export const MAX_FILES_PER_REQUEST = 5;
export const MAX_BYTES_PER_FILE = 10 * 1024 * 1024;

const VIDEO_HOSTS = ['youtube.com', 'youtu.be', 'vimeo.com', 'vimeo.io', 'loom.com', 'wistia.com', 'tiktok.com', 'instagram.com'];

export function isValidVideoUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return VIDEO_HOSTS.some((h) => u.hostname === h || u.hostname.endsWith('.' + h));
  } catch { return false; }
}

export function isValidEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

export function isValidUrl(s: string): boolean {
  try { new URL(s); return true; } catch { return false; }
}

/** Resposta do form. Cada chave = field.id. Valor depende do type. */
export type ExtrasResponse = Record<string, unknown>;

export type ValidationError = { fieldId: string; message: string };

export function validateExtras(
  schema: RequirementsSchema,
  extras: ExtrasResponse,
): ValidationError[] {
  const errs: ValidationError[] = [];
  for (const f of schema.fields) {
    const v = extras[f.id];

    if (f.required) {
      if (v == null || v === '' || (Array.isArray(v) && v.length === 0)) {
        errs.push({ fieldId: f.id, message: `${f.label} é obrigatório` });
        continue;
      }
    }
    if (v == null || v === '') continue;

    switch (f.type) {
      case 'email':
        if (typeof v !== 'string' || !isValidEmail(v)) errs.push({ fieldId: f.id, message: `${f.label}: email inválido` });
        break;
      case 'url':
        if (typeof v !== 'string' || !isValidUrl(v)) errs.push({ fieldId: f.id, message: `${f.label}: URL inválida` });
        break;
      case 'video_url':
        if (typeof v !== 'string' || !isValidVideoUrl(v)) errs.push({ fieldId: f.id, message: `${f.label}: deve ser URL de YouTube/Vimeo/Loom/etc` });
        break;
      case 'number':
        const n = Number(v);
        if (Number.isNaN(n)) errs.push({ fieldId: f.id, message: `${f.label}: número inválido` });
        if (f.min != null && n < f.min) errs.push({ fieldId: f.id, message: `${f.label}: mínimo ${f.min}` });
        if (f.max != null && n > f.max) errs.push({ fieldId: f.id, message: `${f.label}: máximo ${f.max}` });
        break;
      case 'text':
      case 'longtext':
        if (typeof v !== 'string') { errs.push({ fieldId: f.id, message: `${f.label}: texto inválido` }); break; }
        if (f.minLength != null && v.length < f.minLength) errs.push({ fieldId: f.id, message: `${f.label}: mínimo ${f.minLength} caracteres` });
        if (f.maxLength != null && v.length > f.maxLength) errs.push({ fieldId: f.id, message: `${f.label}: máximo ${f.maxLength} caracteres` });
        break;
      case 'select':
        if (typeof v !== 'string' || !f.options?.some((o) => o.value === v)) errs.push({ fieldId: f.id, message: `${f.label}: escolha uma opção válida` });
        break;
      case 'image':
      case 'file':
        if (typeof v !== 'string' || !v.startsWith('workspaces/')) errs.push({ fieldId: f.id, message: `${f.label}: upload obrigatório` });
        break;
      case 'image_pair':
        if (typeof v !== 'object' || v == null || !(v as any).before || !(v as any).after) {
          errs.push({ fieldId: f.id, message: `${f.label}: 2 imagens (antes + depois) obrigatórias` });
        }
        break;
      case 'checkbox':
        // boolean — ok se truthy ou explicit false
        break;
    }
  }
  return errs;
}

/** Conta quantos arquivos uma resposta carrega (pra validar limite global) */
export function countFiles(schema: RequirementsSchema, extras: ExtrasResponse): number {
  let c = 0;
  for (const f of schema.fields) {
    const v = extras[f.id];
    if (f.type === 'image' || f.type === 'file') {
      if (typeof v === 'string' && v.startsWith('workspaces/')) c++;
    } else if (f.type === 'image_pair') {
      if (typeof v === 'object' && v != null) {
        if ((v as any).before) c++;
        if ((v as any).after) c++;
      }
    }
  }
  return c;
}

/** Templates pre-prontos por vertical */
export const PRESET_REQUIREMENTS: Record<string, RequirementsSchema> = {
  cabelo: {
    version: 1,
    fields: [
      { id: 'antes_depois', type: 'image_pair', label: 'Foto antes e depois', required: true, beforeLabel: 'Antes', afterLabel: 'Depois', helpText: 'Foto do trabalho realizado' },
      { id: 'video', type: 'video_url', label: 'Link do vídeo (opcional)', helpText: 'YouTube, TikTok ou Instagram com o trabalho realizado' },
      { id: 'observacoes', type: 'longtext', label: 'Observações sobre o trabalho', maxLength: 500 },
    ],
  },
  estetica: {
    version: 1,
    fields: [
      { id: 'fotos_progressao', type: 'image', label: 'Foto do resultado final', required: true },
      { id: 'consentimento', type: 'file', label: 'Termo de consentimento assinado', accept: 'application/pdf,image/*', required: true },
      { id: 'cpf', type: 'text', label: 'CPF do cliente atendido', minLength: 11, maxLength: 14 },
    ],
  },
  coaching: {
    version: 1,
    fields: [
      { id: 'artigo', type: 'longtext', label: 'Artigo sobre o que aprendeu', minLength: 500, required: true, helpText: 'Mínimo 500 caracteres' },
      { id: 'video_apresentacao', type: 'video_url', label: 'Vídeo de apresentação (2min)', required: true },
    ],
  },
  basico: {
    version: 1,
    fields: [
      { id: 'foto_trabalho', type: 'image', label: 'Foto do trabalho realizado', required: true },
    ],
  },
};
