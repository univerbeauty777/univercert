'use client';

import { useState, useTransition } from 'react';
import { bulkEmitAction, type BulkRow, type BulkResult } from './actions';

const SAMPLE_CSV = `nome,cpf,email,whatsapp,curso,horas
Maria Silva Souza,12345678909,maria@example.com,11999999999,Coloração Avançada,80
João Santos,98765432100,joao@example.com,11988888888,Cortes Femininos,40`;

function parseCsv(text: string): { rows: BulkRow[]; errors: string[] } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return { rows: [], errors: ['CSV vazio ou sem linhas de dados'] };

  const header = lines[0].split(',').map((h) => h.trim().toLowerCase());
  const required = ['nome', 'email', 'curso'];
  const missing = required.filter((r) => !header.includes(r));
  if (missing.length) return { rows: [], errors: [`Faltam colunas: ${missing.join(', ')}`] };

  const idx = (k: string) => header.indexOf(k);

  const rows: BulkRow[] = [];
  const errors: string[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split(',').map((c) => c.trim());
    if (cells.every((c) => !c)) continue;
    const row: BulkRow = {
      nome: cells[idx('nome')] ?? '',
      email: cells[idx('email')] ?? '',
      curso: cells[idx('curso')] ?? '',
      cpf: idx('cpf') >= 0 ? cells[idx('cpf')] : undefined,
      whatsapp: idx('whatsapp') >= 0 ? cells[idx('whatsapp')] : undefined,
      horas: idx('horas') >= 0 ? Number(cells[idx('horas')]) || undefined : undefined,
    };
    rows.push(row);
  }
  return { rows, errors };
}

type Props = { templateOptions?: Array<{ id: string; name: string }> };

export default function BulkClient({ templateOptions = [] }: Props) {
  const [mode, setMode] = useState<'single' | 'csv'>('single');
  const [templateId, setTemplateId] = useState<string>(templateOptions[0]?.id ?? 'classic');
  const [result, setResult] = useState<BulkResult | null>(null);
  const [isPending, startTransition] = useTransition();

  // --- modo individual ---
  const [single, setSingle] = useState({ nome: '', cpf: '', email: '', whatsapp: '', curso: '', horas: '' });
  const [singleErr, setSingleErr] = useState<string | null>(null);

  // --- modo CSV ---
  const [csv, setCsv] = useState('');
  const [preview, setPreview] = useState<BulkRow[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);

  const TemplatePicker = templateOptions.length > 0 ? (
    <div>
      <label className="label" htmlFor="tpl">Template do certificado</label>
      <select id="tpl" className="input" value={templateId} onChange={(e) => setTemplateId(e.target.value)}>
        {templateOptions.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
      </select>
    </div>
  ) : null;

  const handleEmitSingle = () => {
    setSingleErr(null);
    if (!single.nome.trim() || !single.email.trim() || !single.curso.trim()) {
      setSingleErr('Preencha pelo menos Nome, Email e Curso.');
      return;
    }
    const row: BulkRow = {
      nome: single.nome.trim(),
      email: single.email.trim(),
      curso: single.curso.trim(),
      cpf: single.cpf.trim() || undefined,
      whatsapp: single.whatsapp.trim() || undefined,
      horas: single.horas ? Number(single.horas) || undefined : undefined,
    };
    startTransition(async () => {
      const res = await bulkEmitAction([row], { templateId });
      setResult(res);
    });
  };

  const handleParse = () => {
    const { rows, errors } = parseCsv(csv);
    setPreview(rows);
    setParseErrors(errors);
    setResult(null);
  };

  const handleEmitCsv = () => {
    if (preview.length === 0) return;
    startTransition(async () => {
      const res = await bulkEmitAction(preview, { templateId });
      setResult(res);
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsv(await file.text());
  };

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => { setMode('single'); setResult(null); }}
          className={mode === 'single' ? 'btn-primary' : 'btn-secondary'}
        >
          👤 Um aluno
        </button>
        <button
          type="button"
          onClick={() => { setMode('csv'); setResult(null); }}
          className={mode === 'csv' ? 'btn-primary' : 'btn-secondary'}
        >
          📋 Em massa (CSV)
        </button>
      </div>

      {/* MODO INDIVIDUAL */}
      {mode === 'single' && (
        <div className="card space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="label" htmlFor="s-nome">Nome do aluno *</label>
              <input id="s-nome" className="input" value={single.nome} onChange={(e) => setSingle({ ...single, nome: e.target.value })} placeholder="Maria Silva Souza" />
            </div>
            <div>
              <label className="label" htmlFor="s-email">Email *</label>
              <input id="s-email" type="email" className="input" value={single.email} onChange={(e) => setSingle({ ...single, email: e.target.value })} placeholder="maria@email.com" />
            </div>
            <div>
              <label className="label" htmlFor="s-curso">Curso *</label>
              <input id="s-curso" className="input" value={single.curso} onChange={(e) => setSingle({ ...single, curso: e.target.value })} placeholder="Liso Blindado Express" />
            </div>
            <div>
              <label className="label" htmlFor="s-horas">Carga horária</label>
              <input id="s-horas" type="number" className="input" value={single.horas} onChange={(e) => setSingle({ ...single, horas: e.target.value })} placeholder="32" />
            </div>
            <div>
              <label className="label" htmlFor="s-cpf">CPF</label>
              <input id="s-cpf" className="input" value={single.cpf} onChange={(e) => setSingle({ ...single, cpf: e.target.value })} placeholder="000.000.000-00" />
            </div>
            <div>
              <label className="label" htmlFor="s-wa">WhatsApp</label>
              <input id="s-wa" className="input" value={single.whatsapp} onChange={(e) => setSingle({ ...single, whatsapp: e.target.value })} placeholder="5511999999999" />
            </div>
          </div>

          {TemplatePicker}

          {singleErr && <div className="text-sm text-red-600">⚠ {singleErr}</div>}

          <button onClick={handleEmitSingle} disabled={isPending} className="btn-primary">
            {isPending ? 'Emitindo...' : 'Emitir certificado →'}
          </button>
        </div>
      )}

      {/* MODO CSV */}
      {mode === 'csv' && (
        <div className="card">
          <p className="text-sm text-gray-500 mb-3">
            Formato: <code className="text-xs bg-gray-100 px-2 py-1 rounded">nome,cpf,email,whatsapp,curso,horas</code>
          </p>
          <label className="label">Upload CSV (ou cole abaixo)</label>
          <input type="file" accept=".csv,text/csv" onChange={handleFileUpload} className="mb-3 text-sm" />
          <textarea className="input font-mono text-xs h-40" placeholder={SAMPLE_CSV} value={csv} onChange={(e) => setCsv(e.target.value)} />

          <div className="mt-3">{TemplatePicker}</div>

          <div className="flex gap-2 mt-3">
            <button onClick={handleParse} className="btn-secondary">Pré-visualizar</button>
            <button onClick={() => setCsv(SAMPLE_CSV)} className="btn-secondary text-xs" type="button">Usar exemplo</button>
          </div>
        </div>
      )}

      {parseErrors.length > 0 && (
        <div className="card border-l-4 border-danger bg-red-50 text-sm text-red-700">
          {parseErrors.map((e, i) => <div key={i}>✗ {e}</div>)}
        </div>
      )}

      {mode === 'csv' && preview.length > 0 && !result && (
        <div className="card p-0 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center">
            <span className="font-bold text-sm">{preview.length} alunos encontrados</span>
            <button onClick={handleEmitCsv} disabled={isPending} className="btn-primary">
              {isPending ? 'Emitindo...' : `Emitir ${preview.length} certificados →`}
            </button>
          </div>
          <table className="w-full text-xs">
            <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="px-3 py-2 text-left">Nome</th>
                <th className="px-3 py-2 text-left">Email</th>
                <th className="px-3 py-2 text-left">CPF</th>
                <th className="px-3 py-2 text-left">Curso</th>
                <th className="px-3 py-2 text-left">CH</th>
              </tr>
            </thead>
            <tbody>
              {preview.slice(0, 50).map((r, i) => (
                <tr key={i} className="border-t border-gray-100">
                  <td className="px-3 py-2">{r.nome}</td>
                  <td className="px-3 py-2 text-gray-500">{r.email}</td>
                  <td className="px-3 py-2 font-mono">{r.cpf ?? '—'}</td>
                  <td className="px-3 py-2">{r.curso}</td>
                  <td className="px-3 py-2">{r.horas ?? '—'}</td>
                </tr>
              ))}
              {preview.length > 50 && (
                <tr><td colSpan={5} className="px-3 py-2 text-center text-gray-500">+{preview.length - 50} linhas (preview limitado a 50)</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {result && (
        <div className="card border-l-4 border-success bg-green-50">
          <div className="font-bold text-success text-lg">
            ✓ {result.emitted} certificado{result.emitted === 1 ? '' : 's'} emitido{result.emitted === 1 ? '' : 's'} · {result.failed} falhas
          </div>
          {result.errors.length > 0 && (
            <details className="mt-3 text-sm">
              <summary className="cursor-pointer font-semibold text-danger">Ver {result.errors.length} erros</summary>
              <ul className="mt-2 space-y-1 font-mono text-xs">
                {result.errors.map((e, i) => <li key={i}>linha {e.row + 1}: {e.error}</li>)}
              </ul>
            </details>
          )}
          {result.credentialIds.length > 0 && (
            <ul className="mt-3 space-y-1 text-sm">
              {result.credentialIds.slice(0, 10).map((id) => (
                <li key={id}>
                  <a href={`/v/${id}`} target="_blank" rel="noopener" className="text-primary underline">Ver certificado: {id}</a>
                  {' · '}
                  <a href={`/api/v1/credentials/${id}/pdf`} target="_blank" rel="noopener" className="text-primary underline">PDF</a>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
