'use client';

// UniverCert · Course editor + form builder embutido (S22)

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { upsertCourseAction, deleteCourseAction } from '../actions';
import type { RequirementsSchema, RequirementField, FieldType } from '@/lib/course-requirements';
import { PRESET_REQUIREMENTS } from '@/lib/course-requirements';

type Props = {
  workspaceSlug: string;
  templateOptions: { id: string; name: string }[];
  initial?: {
    id: string;
    name: string;
    slug: string;
    description?: string;
    hours?: number;
    defaultTemplateId?: string;
    requirements: RequirementsSchema | null;
    vertical?: string;
    isPublic?: boolean;
    isActive?: boolean;
    autoApprove?: boolean;
  };
};

const FIELD_TYPE_OPTIONS: { value: FieldType; label: string; icon: string }[] = [
  { value: 'text', label: 'Texto curto', icon: 'Aa' },
  { value: 'longtext', label: 'Texto longo', icon: '¶' },
  { value: 'email', label: 'Email', icon: '@' },
  { value: 'url', label: 'URL', icon: '🔗' },
  { value: 'number', label: 'Número', icon: '#' },
  { value: 'checkbox', label: 'Checkbox', icon: '☑' },
  { value: 'select', label: 'Dropdown', icon: '▾' },
  { value: 'image', label: 'Imagem (1)', icon: '🖼' },
  { value: 'image_pair', label: 'Antes/Depois', icon: '⇆' },
  { value: 'video_url', label: 'Link de vídeo', icon: '▶' },
  { value: 'file', label: 'Arquivo', icon: '📎' },
];

export default function CourseEditorClient({ workspaceSlug, templateOptions, initial }: Props) {
  const router = useRouter();
  const [name, setName] = useState(initial?.name ?? '');
  const [slug, setSlug] = useState(initial?.slug ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [hours, setHours] = useState<number | ''>(initial?.hours ?? '');
  const [defaultTemplateId, setDefaultTemplateId] = useState(initial?.defaultTemplateId ?? '');
  const [vertical, setVertical] = useState(initial?.vertical ?? '');
  const [isPublic, setIsPublic] = useState(initial?.isPublic ?? true);
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [autoApprove, setAutoApprove] = useState(initial?.autoApprove ?? false);
  const [requirements, setRequirements] = useState<RequirementsSchema>(
    initial?.requirements ?? { version: 1, fields: [] },
  );
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'error'; msg: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const addField = (type: FieldType) => {
    const id = `f-${Date.now().toString(36)}`;
    const newField: RequirementField = {
      id,
      type,
      label: defaultLabelForType(type),
      required: true,
    };
    if (type === 'image_pair') { newField.beforeLabel = 'Antes'; newField.afterLabel = 'Depois'; }
    if (type === 'select') newField.options = [{ value: 'op1', label: 'Opção 1' }];
    setRequirements({ ...requirements, fields: [...requirements.fields, newField] });
  };

  const updateField = (id: string, patch: Partial<RequirementField>) => {
    setRequirements({
      ...requirements,
      fields: requirements.fields.map((f) => (f.id === id ? { ...f, ...patch } : f)),
    });
  };

  const removeField = (id: string) => {
    setRequirements({ ...requirements, fields: requirements.fields.filter((f) => f.id !== id) });
  };

  const moveField = (id: string, dir: -1 | 1) => {
    const idx = requirements.fields.findIndex((f) => f.id === id);
    if (idx === -1) return;
    const next = [...requirements.fields];
    const swap = idx + dir;
    if (swap < 0 || swap >= next.length) return;
    [next[idx], next[swap]] = [next[swap], next[idx]];
    setRequirements({ ...requirements, fields: next });
  };

  const applyPreset = (key: keyof typeof PRESET_REQUIREMENTS) => {
    const preset = PRESET_REQUIREMENTS[key];
    setRequirements(preset);
    setFeedback({ tone: 'success', msg: `Preset "${key}" aplicado · ${preset.fields.length} campos` });
  };

  const handleSave = () => {
    if (!name.trim()) { setFeedback({ tone: 'error', msg: 'Nome obrigatório' }); return; }
    startTransition(async () => {
      const r = await upsertCourseAction({
        id: initial?.id,
        name,
        slug: slug || undefined,
        description: description || undefined,
        hours: hours === '' ? undefined : Number(hours),
        defaultTemplateId: defaultTemplateId || undefined,
        requirementsJson: requirements.fields.length > 0 ? requirements : null,
        vertical: vertical || undefined,
        isPublic, isActive, autoApprove,
      });
      if (r.ok) {
        setFeedback({ tone: 'success', msg: initial?.id ? 'Curso salvo' : `Criado · /solicitar/${workspaceSlug}/${r.slug}` });
        if (!initial?.id) {
          setTimeout(() => router.push(`/courses/${r.courseId}`), 600);
        }
      } else {
        setFeedback({ tone: 'error', msg: r.error });
      }
    });
  };

  const handleDelete = () => {
    if (!initial?.id) return;
    if (!confirm(`Apagar o curso "${name}"? Requests existentes ficam órfãos.`)) return;
    startTransition(async () => {
      const r = await deleteCourseAction(initial.id);
      if (r.ok) router.push('/courses');
      else setFeedback({ tone: 'error', msg: r.error });
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4">
      {/* COLUNA ESQUERDA: dados do curso */}
      <div className="space-y-4">
        <section className="card">
          <h2 className="text-base font-semibold mb-3">Detalhes</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="Nome do curso *">
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Coloração Avançada" />
            </Field>
            <Field label="Slug (URL)">
              <input className="input font-mono text-xs" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="coloracao-avancada" />
            </Field>
            <Field label="Carga horária (h)">
              <input className="input" type="number" min={0} value={hours} onChange={(e) => setHours(e.target.value === '' ? '' : Number(e.target.value))} />
            </Field>
            <Field label="Vertical / categoria">
              <input className="input" value={vertical} onChange={(e) => setVertical(e.target.value)} placeholder="cabelo, estética, …" />
            </Field>
            <Field label="Template default">
              <select className="input" value={defaultTemplateId} onChange={(e) => setDefaultTemplateId(e.target.value)}>
                <option value="">(usar variant padrão)</option>
                {templateOptions.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </Field>
            <Field label="Descrição (opcional)">
              <textarea className="input" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
            </Field>
          </div>

          <div className="mt-4 pt-4 border-t border-[rgb(var(--border))] space-y-2">
            <Toggle label="Curso ativo" hint="Aceita novas solicitações." checked={isActive} onChange={setIsActive} />
            <Toggle label="Form público" hint="URL acessível por qualquer aluno (com confirmação por email)." checked={isPublic} onChange={setIsPublic} />
            <Toggle label="Auto-aprovar" hint="Emite cert sem revisão manual (mesmo com requirements). Use só se confiar no preenchimento." checked={autoApprove} onChange={setAutoApprove} />
          </div>
        </section>

        {/* FORM BUILDER */}
        <section className="card">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <div>
              <h2 className="text-base font-semibold">Requisitos do form</h2>
              <p className="text-xs text-[rgb(var(--fg-muted))]">{requirements.fields.length} campo(s)</p>
            </div>
            <div className="flex items-center gap-2">
              <select
                className="input text-xs"
                onChange={(e) => { if (e.target.value) applyPreset(e.target.value as any); }}
                value=""
              >
                <option value="">Aplicar preset…</option>
                {Object.keys(PRESET_REQUIREMENTS).map((k) => <option key={k} value={k}>{k}</option>)}
              </select>
            </div>
          </div>

          {requirements.fields.length === 0 && (
            <div className="border-2 border-dashed border-[rgb(var(--border))] rounded-md p-6 text-center text-sm text-[rgb(var(--fg-muted))]">
              Sem requisitos. Aluno só vai informar nome + email pra solicitar.
            </div>
          )}

          <div className="space-y-2">
            {requirements.fields.map((f, idx) => (
              <FieldEditor
                key={f.id}
                field={f}
                onUpdate={(patch) => updateField(f.id, patch)}
                onRemove={() => removeField(f.id)}
                onMoveUp={idx > 0 ? () => moveField(f.id, -1) : undefined}
                onMoveDown={idx < requirements.fields.length - 1 ? () => moveField(f.id, 1) : undefined}
              />
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-[rgb(var(--border))]">
            <p className="text-[10px] uppercase tracking-wider font-semibold text-[rgb(var(--fg-subtle))] mb-2">+ Adicionar campo</p>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
              {FIELD_TYPE_OPTIONS.map((t) => (
                <button
                  key={t.value}
                  onClick={() => addField(t.value)}
                  className="flex flex-col items-center gap-0.5 p-2 rounded border border-[rgb(var(--border))] hover:bg-[rgb(var(--surface-2))] hover:border-[rgb(var(--brand))] transition text-xs"
                >
                  <span className="text-base">{t.icon}</span>
                  <span className="text-[10px] leading-tight">{t.label}</span>
                </button>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* COLUNA DIREITA: preview + actions */}
      <aside className="space-y-3">
        {feedback && (
          <div className={`px-3 py-2 rounded-md text-sm ${
            feedback.tone === 'success' ? 'bg-[rgb(var(--success-soft))] text-[rgb(var(--success))]' : 'bg-[rgb(var(--danger-soft))] text-[rgb(var(--danger))]'
          }`}>
            {feedback.msg}
          </div>
        )}

        <div className="card">
          <h3 className="text-sm font-semibold mb-2">Preview do form</h3>
          <FormPreview schema={requirements} />
        </div>

        <div className="card">
          <button onClick={handleSave} disabled={isPending} className="btn-primary btn-sm w-full">
            {isPending ? 'Salvando…' : initial?.id ? 'Salvar alterações' : 'Criar curso'}
          </button>
          {initial?.id && (
            <button onClick={handleDelete} disabled={isPending} className="btn-ghost btn-sm w-full mt-2 text-[rgb(var(--danger))]">
              Apagar curso
            </button>
          )}
        </div>

        {initial?.id && (
          <div className="card text-xs">
            <h3 className="text-sm font-semibold mb-2">Como compartilhar</h3>
            <p className="text-[rgb(var(--fg-muted))] mb-2">URL pra aluno solicitar cert:</p>
            <code className="block px-2 py-1.5 bg-[rgb(var(--surface-2))] rounded text-[10px] font-mono break-all">
              {`https://univercert.net/solicitar/${workspaceSlug}/${slug || initial.slug}`}
            </code>
          </div>
        )}
      </aside>
    </div>
  );
}

/* ---- Helpers ---- */

function defaultLabelForType(type: FieldType): string {
  switch (type) {
    case 'text': return 'Campo de texto';
    case 'longtext': return 'Texto longo';
    case 'email': return 'Email';
    case 'url': return 'URL';
    case 'number': return 'Número';
    case 'checkbox': return 'Confirmo que…';
    case 'select': return 'Escolha';
    case 'image': return 'Imagem';
    case 'image_pair': return 'Foto antes e depois';
    case 'video_url': return 'Link do vídeo';
    case 'file': return 'Arquivo';
  }
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
    </label>
  );
}

function Toggle({ label, hint, checked, onChange }: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-start gap-3 cursor-pointer p-2 -m-2 rounded hover:bg-[rgb(var(--surface-2))]">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-0.5 w-4 h-4 accent-[rgb(var(--brand))]" />
      <div className="flex-1 text-sm">
        <div className="font-medium">{label}</div>
        {hint && <div className="text-xs text-[rgb(var(--fg-muted))]">{hint}</div>}
      </div>
    </label>
  );
}

function FieldEditor({
  field, onUpdate, onRemove, onMoveUp, onMoveDown,
}: {
  field: RequirementField;
  onUpdate: (patch: Partial<RequirementField>) => void;
  onRemove: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}) {
  const typeMeta = FIELD_TYPE_OPTIONS.find((t) => t.value === field.type)!;
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-[rgb(var(--border))] rounded-md p-3 bg-[rgb(var(--surface-2))]">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-base shrink-0">{typeMeta.icon}</span>
        <input
          value={field.label}
          onChange={(e) => onUpdate({ label: e.target.value })}
          className="input flex-1 min-w-[160px] text-sm"
        />
        <span className="text-[10px] uppercase tracking-wider text-[rgb(var(--fg-subtle))]">{field.type}</span>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={() => setExpanded((v) => !v)} className="btn-ghost btn-sm text-xs">{expanded ? '▾' : '▸'}</button>
          {onMoveUp && <button onClick={onMoveUp} className="btn-ghost btn-sm text-xs">↑</button>}
          {onMoveDown && <button onClick={onMoveDown} className="btn-ghost btn-sm text-xs">↓</button>}
          <button onClick={onRemove} className="btn-ghost btn-sm text-xs text-[rgb(var(--danger))]">×</button>
        </div>
      </div>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-[rgb(var(--border))] space-y-2 text-sm">
          <Field label="Help text (opcional)">
            <input value={field.helpText ?? ''} onChange={(e) => onUpdate({ helpText: e.target.value })} className="input" />
          </Field>
          <Field label="Placeholder">
            <input value={field.placeholder ?? ''} onChange={(e) => onUpdate({ placeholder: e.target.value })} className="input" />
          </Field>
          <Toggle label="Obrigatório" checked={!!field.required} onChange={(v) => onUpdate({ required: v })} />
          {field.type === 'image_pair' && (
            <div className="grid grid-cols-2 gap-2">
              <Field label="Label antes"><input value={field.beforeLabel ?? 'Antes'} onChange={(e) => onUpdate({ beforeLabel: e.target.value })} className="input" /></Field>
              <Field label="Label depois"><input value={field.afterLabel ?? 'Depois'} onChange={(e) => onUpdate({ afterLabel: e.target.value })} className="input" /></Field>
            </div>
          )}
          {field.type === 'select' && (
            <Field label="Opções (uma por linha)">
              <textarea
                rows={4}
                className="input"
                value={(field.options ?? []).map((o) => `${o.value}|${o.label}`).join('\n')}
                onChange={(e) => {
                  const opts = e.target.value.split('\n').filter((l) => l.trim()).map((l) => {
                    const [v, lab] = l.split('|');
                    return { value: v.trim(), label: (lab ?? v).trim() };
                  });
                  onUpdate({ options: opts });
                }}
              />
            </Field>
          )}
          {(field.type === 'text' || field.type === 'longtext') && (
            <div className="grid grid-cols-2 gap-2">
              <Field label="Min chars"><input type="number" value={field.minLength ?? ''} onChange={(e) => onUpdate({ minLength: e.target.value === '' ? undefined : Number(e.target.value) })} className="input" /></Field>
              <Field label="Max chars"><input type="number" value={field.maxLength ?? ''} onChange={(e) => onUpdate({ maxLength: e.target.value === '' ? undefined : Number(e.target.value) })} className="input" /></Field>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function FormPreview({ schema }: { schema: RequirementsSchema }) {
  if (schema.fields.length === 0) {
    return <p className="text-xs text-[rgb(var(--fg-subtle))]">Sem campos · form mínimo (nome + email)</p>;
  }
  return (
    <div className="space-y-3 text-xs">
      <div className="text-[10px] uppercase tracking-wider text-[rgb(var(--fg-subtle))]">Campos básicos (sempre)</div>
      <Mini label="Nome completo *" />
      <Mini label="Email *" />
      <div className="text-[10px] uppercase tracking-wider text-[rgb(var(--fg-subtle))] pt-2">Campos do curso</div>
      {schema.fields.map((f) => (
        <Mini key={f.id} label={`${f.label}${f.required ? ' *' : ''}`} type={f.type} />
      ))}
    </div>
  );
}

function Mini({ label, type }: { label: string; type?: string }) {
  return (
    <div className="px-2 py-1.5 bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded text-[11px]">
      <div className="text-[rgb(var(--fg))]">{label}</div>
      {type && <div className="text-[9px] text-[rgb(var(--fg-subtle))] uppercase mt-0.5">{type}</div>}
    </div>
  );
}
