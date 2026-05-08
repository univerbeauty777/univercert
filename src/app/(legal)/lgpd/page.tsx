// UniverCert · LGPD · DPO

export const runtime = 'edge';

export const metadata = {
  title: 'LGPD · DPO · UniverCert',
  description: 'Encarregado de dados, base legal e exercício de direitos LGPD.',
};

export default function LgpdPage() {
  return (
    <>
      <p className="text-xs uppercase tracking-widest text-primary font-bold mb-2">Legal</p>
      <h1>LGPD · Encarregado de Dados</h1>
      <p className="text-xs text-gray-500">Lei 13.709/2018 · Última atualização: 8 de maio de 2026</p>

      <h2>Encarregado (DPO)</h2>
      <p>
        <strong>Diego Pereira</strong><br />
        E-mail: <a className="text-primary" href="mailto:diegoxp12@me.com">diegoxp12@me.com</a><br />
        WhatsApp: pelo botão flutuante no rodapé direito do site
      </p>

      <h2>Como exercer seus direitos</h2>
      <p>
        Envie um e-mail com o assunto <strong>"LGPD · [tipo de solicitação]"</strong> para o DPO.
        Tipos suportados:
      </p>
      <ul>
        <li><strong>Acesso</strong> — quero ver todos os meus dados</li>
        <li><strong>Portabilidade</strong> — quero exportar em formato estruturado (JSON)</li>
        <li><strong>Correção</strong> — meus dados estão errados, preciso corrigir</li>
        <li><strong>Eliminação</strong> — quero remover meus dados</li>
        <li><strong>Revogação</strong> — quero retirar o consentimento dado</li>
        <li><strong>Anonimização</strong> — quero que meus dados deixem de me identificar</li>
        <li><strong>Informação</strong> — com quem vocês compartilharam meus dados</li>
      </ul>

      <p className="text-xs text-gray-500">
        Responderemos em até <strong>15 dias corridos</strong> (Art. 19 §1º LGPD). Em casos
        complexos, podemos estender por mais 15 dias com justificativa.
      </p>

      <h2>Casos especiais</h2>
      <p>
        <strong>Aluno que recebeu certificado:</strong> seus dados foram fornecidos pela escola que
        emitiu o certificado. Para alterar/remover, entre em contato primeiro com a instituição
        emissora. Se ela não atender em 15 dias, escale para o DPO da UniverCert.
      </p>

      <h2>Incidentes de segurança</h2>
      <p>
        Em caso de incidente que possa acarretar risco aos titulares, comunicaremos:
      </p>
      <ul>
        <li>ANPD (Autoridade Nacional de Proteção de Dados) em prazo razoável.</li>
        <li>Titulares afetados, descrevendo natureza, dados envolvidos e medidas tomadas.</li>
      </ul>

      <h2>Sub-operadores que processam dados pessoais</h2>
      <ul>
        <li><strong>Cloudflare, Inc.</strong> — hospedagem · contrato com cláusulas de transferência internacional</li>
        <li><strong>Mercado Pago LTDA</strong> — pagamentos · servidores no Brasil</li>
        <li><strong>Resend, Inc.</strong> — e-mail transacional · contrato DPA</li>
        <li><strong>Meta Platforms, Inc.</strong> — WhatsApp Cloud API · termos da Meta</li>
      </ul>

      <h2>Reclamações</h2>
      <p>
        Você sempre pode reclamar diretamente à <strong>ANPD</strong>:{' '}
        <a className="text-primary" href="https://www.gov.br/anpd" target="_blank" rel="noopener noreferrer">gov.br/anpd</a>
      </p>
    </>
  );
}
