'use client';

// UniverCert · Public request form (S22)

import { useState, useRef, useTransition } from 'react';
import { submitRequestAction, submitRevisionAction } from './actions';
import type { RequirementsSchema, RequirementField, ExtrasResponse } from '@/lib/course-requirements';

const FORM_STYLE: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #e5e7eb',
  borderRadius: 12,
  padding: 24,
};

export default function RequestFormClient({
  workspaceSlug, workspaceName, courseSlug, courseName, schema,
  reviseToken, initialName = '', initialEmail = '', initialExtras = {},
}: {
  workspaceSlug: string;
  workspaceName: string;
  courseSlug: string;
  courseName: string;
  schema: RequirementsSchema;
  reviseToken?: string;
  initialName?: string;
  initialEmail?: string;
  initialExtras?: ExtrasResponse;
}) {
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [cpf, setCpf] = useState('');
  const [phone, setPhone] = useState('');
  const [extras, setExtras] = useState<ExtrasResponse>(initialExtras);
  const [submitted, setSubmitted] = useState<{ requestId: string; autoIssued: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!reviseToken) {
      if (!name.trim()) { setError('Nome é obrigatório'); return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Email inválido'); return; }
    }
    startTransition(async () => {
      if (reviseToken) {
        const r = await submitRevisionAction({ token: reviseToken, extras });
        if (r.ok) {
          setSubmitted({ requestId: 'revisão', autoIssued: false });
        } else {
          setError(r.error);
        }
        return;
      }
      const r = await submitRequestAction({
        workspaceSlug, courseSlug,
        submitterName: name, submitterEmail: email,
        cpf: cpf || undefined, phone: phone || undefined,
        extras,
      });
      if (r.ok) {
        setSubmitted({ requestId: r.requestId, autoIssued: !!r.autoIssued });
      } else {
        setError(r.error);
      }
    });
  };

  if (submitted) {
    return (
      <div style={FORM_STYLE}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, margin: '0 auto 16px', borderRadius: '50%', background: '#d1fae5', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 600, margin: 0, color: '#111827' }}>
            {submitted.autoIssued ? 'Certificado emitido!' : 'Solicitação recebida!'}
          </h2>
          <p style={{ color: '#6b7280', marginTop: 8, fontSize: 14, lineHeight: 1.6 }}>
            {submitted.autoIssued
              ? `Você vai receber um email em até 30 segundos com o link do seu certificado de ${courseName}.`
              : `Sua solicitação está na fila pra revisão. ${workspaceName} vai aprovar e te enviar o certificado por email.`}
          </p>
          <p style={{ color: '#9ca3af', fontSize: 11, marginTop: 16, fontFamily: 'monospace' }}>
            ID: {submitted.requestId}
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={FORM_STYLE}>
      {error && (
        <div style={{ background: '#fee2e2', color: '#991b1b', padding: '10px 12px', borderRadius: 6, marginBottom: 16, fontSize: 13 }}>
          ⚠ {error}
        </div>
      )}

      <FieldRow label="Nome completo *">
        <input type="text" required value={name} onChange={(e) => setName(e.target.value)} style={INPUT_STYLE} placeholder="Maria Silva" />
      </FieldRow>
      <FieldRow label="Email *">
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} style={INPUT_STYLE} placeholder="maria@exemplo.com" />
      </FieldRow>
      <FieldRow label="CPF (opcional)">
        <input type="text" value={cpf} onChange={(e) => setCpf(e.target.value)} style={INPUT_STYLE} placeholder="000.000.000-00" />
      </FieldRow>
      <FieldRow label="WhatsApp (opcional)">
        <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} style={INPUT_STYLE} placeholder="(11) 99999-9999" />
      </FieldRow>

      {schema.fields.length > 0 && (
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #f3f4f6' }}>
          {schema.fields.map((f) => (
            <FieldRenderer
              key={f.id}
              field={f}
              value={extras[f.id]}
              workspaceSlug={workspaceSlug}
              onChange={(v) => setExtras({ ...extras, [f.id]: v })}
            />
          ))}
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        style={{
          width: '100%', marginTop: 24, padding: '12px 16px',
          background: '#1B2D5E', color: '#fff', border: 0, borderRadius: 8,
          fontSize: 15, fontWeight: 600, cursor: isPending ? 'not-allowed' : 'pointer',
          opacity: isPending ? 0.6 : 1,
        }}
      >
        {isPending ? 'Enviando…' : 'Solicitar certificado'}
      </button>

      <p style={{ marginTop: 12, fontSize: 11, color: '#9ca3af', textAlign: 'center' }}>
        Ao enviar, você concorda em receber email com o link do certificado.
      </p>
    </form>
  );
}

const INPUT_STYLE: React.CSSProperties = {
  width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 6,
  fontSize: 14, fontFamily: 'inherit', background: '#fff', color: '#111827',
  boxSizing: 'border-box',
};

const TEXTAREA_STYLE: React.CSSProperties = { ...INPUT_STYLE, minHeight: 80, resize: 'vertical' };

function FieldRow({ label, helpText, children }: { label: string; helpText?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>{label}</label>
      {children}
      {helpText && <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 4, marginBottom: 0 }}>{helpText}</p>}
    </div>
  );
}

function FieldRenderer({
  field, value, onChange, workspaceSlug,
}: {
  field: RequirementField;
  value: any;
  onChange: (v: any) => void;
  workspaceSlug: string;
}) {
  const label = `${field.label}${field.required ? ' *' : ''}`;

  switch (field.type) {
    case 'text':
    case 'email':
    case 'url':
    case 'video_url':
      return (
        <FieldRow label={label} helpText={field.helpText}>
          <input
            type={field.type === 'email' ? 'email' : field.type.includes('url') ? 'url' : 'text'}
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            style={INPUT_STYLE}
          />
        </FieldRow>
      );

    case 'longtext':
      return (
        <FieldRow label={label} helpText={field.helpText}>
          <textarea value={value ?? ''} onChange={(e) => onChange(e.target.value)} placeholder={field.placeholder} style={TEXTAREA_STYLE} />
        </FieldRow>
      );

    case 'number':
      return (
        <FieldRow label={label} helpText={field.helpText}>
          <input type="number" value={value ?? ''} min={field.min} max={field.max} onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))} style={INPUT_STYLE} />
        </FieldRow>
      );

    case 'checkbox':
      return (
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: '#374151', cursor: 'pointer' }}>
            <input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} style={{ marginTop: 2 }} />
            <span>{field.label}{field.required ? ' *' : ''}</span>
          </label>
          {field.helpText && <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 4, marginLeft: 24 }}>{field.helpText}</p>}
        </div>
      );

    case 'select':
      return (
        <FieldRow label={label} helpText={field.helpText}>
          <select value={value ?? ''} onChange={(e) => onChange(e.target.value)} style={INPUT_STYLE}>
            <option value="">— escolha —</option>
            {(field.options ?? []).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </FieldRow>
      );

    case 'image':
    case 'file':
      return (
        <FieldRow label={label} helpText={field.helpText}>
          <PublicUploader
            accept={field.accept ?? (field.type === 'image' ? 'image/*' : 'image/*,application/pdf')}
            workspaceSlug={workspaceSlug}
            value={value}
            onChange={onChange}
          />
        </FieldRow>
      );

    case 'image_pair':
      const pair = (value ?? {}) as { before?: string; after?: string };
      return (
        <FieldRow label={label} helpText={field.helpText}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div>
              <p style={{ fontSize: 11, color: '#6b7280', margin: '0 0 4px', fontWeight: 600 }}>{field.beforeLabel ?? 'Antes'}</p>
              <PublicUploader accept="image/*" workspaceSlug={workspaceSlug} value={pair.before} onChange={(v) => onChange({ ...pair, before: v })} />
            </div>
            <div>
              <p style={{ fontSize: 11, color: '#6b7280', margin: '0 0 4px', fontWeight: 600 }}>{field.afterLabel ?? 'Depois'}</p>
              <PublicUploader accept="image/*" workspaceSlug={workspaceSlug} value={pair.after} onChange={(v) => onChange({ ...pair, after: v })} />
            </div>
          </div>
        </FieldRow>
      );

    default:
      return null;
  }
}

function PublicUploader({
  accept, workspaceSlug, value, onChange,
}: {
  accept?: string;
  workspaceSlug: string;
  value?: string;
  onChange: (v: string | undefined) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const handle = async (file: File) => {
    setErr(null);
    if (file.size > 10 * 1024 * 1024) { setErr('Máximo 10MB'); return; }
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('ws', workspaceSlug);
      const r = await fetch('/api/public/uploads', { method: 'POST', body: fd });
      const data = await r.json();
      if (!data.ok) throw new Error(data.error);
      onChange(data.key);                                   // salva o R2 key
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (value) {
    const url = `/api/v1/assets/${encodeURIComponent(value)}`;
    return (
      <div style={{ position: 'relative' }}>
        <img src={url} alt="upload" style={{ width: '100%', maxHeight: 160, objectFit: 'cover', borderRadius: 6, border: '1px solid #e5e7eb', display: 'block' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        <button
          type="button"
          onClick={() => onChange(undefined)}
          style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.7)', color: '#fff', border: 0, padding: '4px 8px', borderRadius: 4, fontSize: 11, cursor: 'pointer' }}
        >
          Remover
        </button>
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        style={{
          width: '100%', padding: 16,
          border: '2px dashed #d1d5db', borderRadius: 6,
          background: '#f9fafb', color: '#6b7280',
          fontSize: 13, cursor: busy ? 'not-allowed' : 'pointer',
        }}
      >
        {busy ? 'Enviando…' : '📷 Clique pra enviar imagem'}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        style={{ display: 'none' }}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handle(f); }}
      />
      {err && <p style={{ color: '#dc2626', fontSize: 12, marginTop: 4 }}>{err}</p>}
    </div>
  );
}
