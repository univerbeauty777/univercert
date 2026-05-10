'use client';

// UniverCert · DocumentScanner (S47)
// Plug em forms pra auto-fill nome + CPF a partir de foto do RG/CNH.

import { useState, useRef } from 'react';

type ExtractionResult = {
  document_type: string;
  confidence: number;
  fields: {
    full_name: string | null;
    cpf: string | null;
    rg: string | null;
    birth_date: string | null;
    [k: string]: any;
  };
  warnings: string[];
  is_authentic_likely: boolean;
  ai_generated_likelihood: number;
};

type Props = {
  onExtracted: (data: ExtractionResult['fields']) => void;
  onError?: (msg: string) => void;
};

export default function DocumentScanner({ onExtracted, onError }: Props) {
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<ExtractionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setError(null); setResult(null); setBusy(true);
    try {
      // Preview
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);

      // To base64
      const buf = await file.arrayBuffer();
      const bytes = new Uint8Array(buf);
      let base64 = '';
      for (let i = 0; i < bytes.length; i += 8192) {
        base64 += String.fromCharCode(...bytes.subarray(i, Math.min(i + 8192, bytes.length)));
      }
      base64 = btoa(base64);

      const r = await fetch('/api/v1/ai/extract-document', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, mediaType: file.type }),
      });
      const d = await r.json();
      if (!d.ok) {
        const msg = d.message ?? d.error ?? 'erro';
        setError(msg);
        onError?.(msg);
        return;
      }
      setResult(d.extraction);
      // Auto-fill se confidence > 60
      if (d.extraction.confidence >= 60) {
        onExtracted(d.extraction.fields);
      }
    } catch (e) {
      const msg = (e as Error).message;
      setError(msg);
      onError?.(msg);
    } finally { setBusy(false); }
  };

  return (
    <div style={{ border: '1px dashed rgba(99,102,241,0.3)', borderRadius: 12, padding: 16, background: 'rgba(99,102,241,0.02)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <span style={{ fontSize: 20 }}>🤖</span>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700 }}>Auto-preencher com IA</div>
          <div style={{ fontSize: 11, color: '#64748b' }}>Tire foto do RG/CNH e preenchemos os campos</div>
        </div>
      </div>

      {!preview && (
        <button onClick={() => inputRef.current?.click()} disabled={busy}
          style={{ width: '100%', padding: '12px', background: '#fff', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          📷 Tirar/escolher foto do documento
        </button>
      )}

      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" capture="environment"
        style={{ display: 'none' }}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />

      {preview && (
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <img src={preview} alt="" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, border: '1px solid rgba(0,0,0,0.1)' }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            {busy && <div style={{ fontSize: 12, color: '#64748b' }}>🔍 Analisando…</div>}
            {error && <div style={{ fontSize: 12, color: '#dc2626' }}>⚠ {error}</div>}
            {result && (
              <div style={{ fontSize: 12 }}>
                <div style={{ fontWeight: 700, color: result.confidence >= 60 ? '#059669' : '#d97706' }}>
                  {result.confidence >= 60 ? '✓ Detectado' : '⚠ Confiança baixa'} · {result.document_type.toUpperCase()} · {result.confidence}%
                </div>
                {result.fields.full_name && <div style={{ color: '#475569' }}>Nome: <strong>{result.fields.full_name}</strong></div>}
                {result.fields.cpf && <div style={{ color: '#475569' }}>CPF: <strong>{result.fields.cpf}</strong></div>}
                {result.warnings.length > 0 && (
                  <div style={{ marginTop: 4, color: '#d97706', fontSize: 11 }}>
                    {result.warnings.slice(0, 2).map((w, i) => <div key={i}>• {w}</div>)}
                  </div>
                )}
                {!result.is_authentic_likely && <div style={{ color: '#dc2626', fontSize: 11, marginTop: 4 }}>🚨 Possivelmente editado / IA</div>}
                <button onClick={() => { setPreview(null); setResult(null); inputRef.current!.value = ''; }}
                  style={{ marginTop: 6, fontSize: 11, color: '#1B2D5E', background: 'transparent', border: 'none', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}>
                  Trocar foto
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
