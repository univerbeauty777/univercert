// UniverCert · Política de Privacidade

export const runtime = 'edge';

export const metadata = {
  title: 'Privacidade · UniverCert',
  description: 'Como a UniverCert coleta, armazena e trata dados pessoais conforme a LGPD.',
};

export default function PrivacidadePage() {
  return (
    <>
      <p className="text-xs uppercase tracking-widest text-primary font-bold mb-2">Legal</p>
      <h1>Política de Privacidade</h1>
      <p className="text-xs text-gray-500">Última atualização: 8 de maio de 2026</p>

      <h2>1. Quem somos</h2>
      <p>
        <strong>DXPRO Univerbeauty Tecnologia LTDA</strong> (operadora da plataforma UniverCert) é
        a controladora dos dados pessoais quando você é nosso cliente direto. Quando emitimos
        certificados em nome de uma escola-cliente, atuamos como <strong>operadora</strong> dos
        dados dos alunos.
      </p>

      <h2>2. Dados que coletamos</h2>
      <ul>
        <li><strong>Cliente (escola/professor):</strong> nome, e-mail, CNPJ/CPF, telefone, dados de pagamento (processados pelo Mercado Pago).</li>
        <li><strong>Aluno (titular do certificado):</strong> nome completo, CPF, e-mail, WhatsApp, curso concluído, data, carga horária.</li>
        <li><strong>Uso da plataforma:</strong> logs de acesso, IP, user-agent, ações executadas (audit log).</li>
      </ul>

      <h2>3. Bases legais (Art. 7º LGPD)</h2>
      <ul>
        <li><strong>Execução de contrato</strong> — para entregar o serviço ao cliente.</li>
        <li><strong>Consentimento</strong> — quando o aluno preenche o formulário público de solicitação.</li>
        <li><strong>Legítimo interesse</strong> — segurança, prevenção a fraudes, melhoria do serviço.</li>
        <li><strong>Cumprimento de obrigação legal</strong> — emissão de NF-e, retenção fiscal.</li>
      </ul>

      <h2>4. Como usamos os dados</h2>
      <ul>
        <li>Emitir e entregar certificados (PDF, página de verificação pública, Open Badge).</li>
        <li>Enviar notificações por e-mail (via Resend) e WhatsApp (via Meta WhatsApp Cloud API).</li>
        <li>Processar pagamentos (Mercado Pago).</li>
        <li>Cobrança, suporte e comunicação operacional.</li>
        <li>NPS automático D+7 (após primeiro certificado emitido), opcional.</li>
      </ul>

      <h2>5. Compartilhamento</h2>
      <p>Compartilhamos dados apenas com sub-operadores necessários:</p>
      <ul>
        <li><strong>Cloudflare</strong> — hospedagem (D1 + R2 + Workers + Pages).</li>
        <li><strong>Mercado Pago</strong> — processamento de pagamentos.</li>
        <li><strong>Resend</strong> — envio de e-mail transacional.</li>
        <li><strong>Meta (WhatsApp Cloud API)</strong> — envio de WhatsApp.</li>
        <li>Autoridades, mediante ordem judicial.</li>
      </ul>
      <p>Não vendemos seus dados. Nunca.</p>

      <h2>6. Página de verificação pública</h2>
      <p>
        A página <code>/v/&#123;id&#125;</code> é pública por padrão (é o objetivo do certificado: ser
        verificável). Ela exibe nome do aluno, curso e data — informações intencionalmente públicas.
        O CPF é parcialmente mascarado (3 primeiros dígitos visíveis).
      </p>

      <h2>7. Retenção</h2>
      <ul>
        <li>Dados ativos: enquanto a conta estiver ativa.</li>
        <li>Após cancelamento: 90 dias para suporte/disputa, depois anonimização.</li>
        <li>Certificados emitidos: mantidos enquanto o cliente tiver plano ativo (são prova de conclusão).</li>
        <li>Logs de auditoria: 24 meses.</li>
      </ul>

      <h2>8. Seus direitos (Art. 18 LGPD)</h2>
      <p>Você pode, a qualquer momento, solicitar:</p>
      <ul>
        <li>Confirmação da existência de tratamento.</li>
        <li>Acesso aos dados (portabilidade em formato estruturado).</li>
        <li>Correção de dados incorretos.</li>
        <li>Anonimização ou eliminação.</li>
        <li>Revogação de consentimento.</li>
      </ul>
      <p>
        Solicitações: <a className="text-primary" href="mailto:diegoxp12@me.com">diegoxp12@me.com</a> · resposta em até 15 dias.
      </p>

      <h2>9. Segurança</h2>
      <ul>
        <li>TLS em todo o tráfego (HTTPS forçado pela Cloudflare).</li>
        <li>Senhas com hash bcrypt + salt.</li>
        <li>HMAC SHA-256 em todos os webhooks.</li>
        <li>Audit log de ações críticas.</li>
        <li>Rate limiting em endpoints públicos.</li>
      </ul>

      <h2>10. Cookies</h2>
      <p>
        Usamos apenas cookies estritamente necessários (sessão de autenticação). Sem trackers
        publicitários. Sem Google Analytics que dispare opt-in obrigatório (usamos PostHog
        self-hosted quando o usuário consente).
      </p>

      <h2>11. Alterações</h2>
      <p>
        Atualizações materiais serão notificadas por e-mail com 15 dias de antecedência. Versões
        anteriores ficam arquivadas mediante solicitação.
      </p>

      <h2>12. Encarregado de Dados (DPO)</h2>
      <p>
        Diego Pereira · <a className="text-primary" href="mailto:diegoxp12@me.com">diegoxp12@me.com</a>
      </p>
    </>
  );
}
