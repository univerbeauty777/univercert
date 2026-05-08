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

export default function BulkClient() {
  const [csv, setCsv] = useState('');
  const [preview, setPreview] = useState<BulkRow[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [result, setResult] = useState<BulkResult | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleParse = () => {
    const { rows, errors } = parseCsv(csv);
    setPreview(rows);
    setParseErrors(errors);
    setResult(null);
  };

  const handleEmit = () => {
    if (preview.length === 0) return;
    startTransition(async () => {
      const res = await bulkEmitAction(preview);
      setResult(res);
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setCsv(text);
  };

  return (
    <div className="space-y-4">
      <div className="card">
        <label className="label">Upload CSV (ou cole abaixo)</label>
        <input type="file" accept=".csv,text/csv" onChange={handleFileUpload} className="mb-3 text-sm" />

        <textarea
          className="input font-mono text-xs h-40"
          placeholder={SAMPLE_CSV}
          value={csv}
          onChange={(e) => setCsv(e.target.value)}
        />

        <div className="flex gap-2 mt-3">
          <button onClick={handleParse} className="btn-secondary">Pré-visualizar</button>
          <button
            onClick={() => setCsv(SAMPLE_CSV)}
            className="btn-secondary text-xs"
            type="button"
          >
            Usar exemplo
          </button>
        </div>
      </div>

      {parseErrors.length > 0 && (
        <div className="card border-l-4 border-danger bg-red-50 text-sm text-red-700">
          {parseErrors.map((e, i) => (
            <div key={i}>✗ {e}</div>
          ))}
        </div>
      )}

      {preview.length > 0 && !result && (
        <div className="card p-0 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center">
            <span className="font-bold text-sm">{preview.length} alunos encontrados</span>
            <button onClick={handleEmit} disabled={isPending} className="btn-primary">
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
                <tr>
                  <td colSpan={5} className="px-3 py-2 text-center text-gray-500">
                    +{preview.length - 50} linhas (preview limitado a 50)
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {result && (
        <div className="card border-l-4 border-success bg-green-50">
          <div className="font-bold text-success text-lg">
            ✓ {result.emitted} certificados emitidos · {result.failed} falhas
          </div>
          {result.errors.length > 0 && (
            <details className="mt-3 text-sm">
              <summary className="cursor-pointer font-semibold text-danger">
                Ver {result.errors.length} erros
              </summary>
              <ul className="mt-2 space-y-1 font-mono text-xs">
                {result.errors.map((e, i) => (
                  <li key={i}>linha {e.row + 1}: {e.error}</li>
                ))}
              </ul>
            </details>
          )}
          {result.credentialIds.length > 0 && (
            <details className="mt-3 text-sm">
              <summary className="cursor-pointer font-semibold">
                Ver primeiros 10 IDs de credenciais
              </summary>
              <ul className="mt-2 space-y-1 font-mono text-xs">
                {result.credentialIds.slice(0, 10).map((id) => (
                  <li key={id}>
                    <a href={`/v/${id}`} target="_blank" rel="noopener" className="text-primary underline">
                      {id}
                    </a>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
