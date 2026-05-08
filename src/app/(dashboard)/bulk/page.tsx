// UniverCert · Bulk emit via CSV (Sprint 2 — UniverHair processa lote de alunos antigos)

import BulkClient from './BulkClient';

export const runtime = 'edge';

export default function BulkPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-8 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold">Emitir em massa</h1>
          <p className="text-sm text-gray-500 mt-1">
            Cole ou faça upload de um CSV com os alunos. Formato:{' '}
            <code className="text-xs bg-gray-100 px-2 py-1 rounded">nome,cpf,email,whatsapp,curso,horas</code>
          </p>
        </div>

        <BulkClient />

        <div className="mt-8 card text-sm text-gray-600 space-y-2">
          <h3 className="font-bold text-gray-900">Dicas</h3>
          <ul className="list-disc list-inside space-y-1">
            <li>CPFs inválidos são marcados em amarelo (você pode corrigir antes de emitir).</li>
            <li>Linhas com email duplicado dentro do CSV são deduplicadas automaticamente.</li>
            <li>Cada linha vira uma <code>certificate_request</code> + <code>credential</code> aprovada.</li>
            <li>Notificações (email + WhatsApp) são disparadas em background após emissão.</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
