// UniverCert · Termos de Uso

export const runtime = 'edge';

export const metadata = {
  title: 'Termos de Uso · UniverCert',
  description: 'Termos e condições de uso da plataforma UniverCert.',
};

export default function TermosPage() {
  return (
    <>
      <p className="text-xs uppercase tracking-widest text-primary font-bold mb-2">Legal</p>
      <h1>Termos de Uso</h1>
      <p className="text-xs text-gray-500">Última atualização: 8 de maio de 2026</p>

      <h2>1. Aceitação</h2>
      <p>
        Ao acessar ou utilizar a plataforma UniverCert (<strong>univercert.net</strong>), operada
        por <strong>DXPRO Univerbeauty Tecnologia LTDA</strong>, você concorda com estes Termos de
        Uso e com a nossa Política de Privacidade.
      </p>

      <h2>2. Descrição do serviço</h2>
      <p>
        UniverCert é uma plataforma SaaS de emissão, gestão e verificação de certificados digitais.
        Oferecemos integração com plataformas de cursos online (Hotmart, Memberkit, Fluent
        Community, Kiwify, Eduzz, Hubla), envio por WhatsApp e e-mail, geração de PDF, página de
        verificação pública e Open Badges 3.0.
      </p>

      <h2>3. Cadastro e conta</h2>
      <ul>
        <li>Você deve fornecer informações verdadeiras e mantê-las atualizadas.</li>
        <li>Você é responsável pela segurança da sua conta e senha.</li>
        <li>Não nos responsabilizamos por uso indevido decorrente de credenciais compartilhadas.</li>
      </ul>

      <h2>4. Planos e cobrança</h2>
      <ul>
        <li>O plano Free permite até 50 certificados/mês sem custo.</li>
        <li>Planos pagos (Starter, Pro, Enterprise) são cobrados mensalmente via Mercado Pago.</li>
        <li>Você pode cancelar a qualquer momento. Não há reembolso pro-rata em meses já iniciados.</li>
        <li>Valores podem ser reajustados com aviso prévio de 30 dias.</li>
      </ul>

      <h2>5. Conteúdo do usuário</h2>
      <p>
        Você é o único responsável pelo conteúdo dos certificados emitidos (nomes, dados dos
        alunos, descrição de cursos). Você declara ter direito sobre esses dados e ter obtido
        consentimento dos titulares conforme a LGPD.
      </p>

      <h2>6. Uso aceitável</h2>
      <p>É proibido usar a plataforma para:</p>
      <ul>
        <li>Emitir certificados falsos, fraudulentos ou que induzam terceiros a erro.</li>
        <li>Violar direitos autorais, marcas ou propriedade intelectual.</li>
        <li>Realizar spam ou envios em massa não autorizados pelos destinatários.</li>
        <li>Tentar acessar dados de outros clientes ou comprometer a infraestrutura.</li>
      </ul>

      <h2>7. Disponibilidade</h2>
      <p>
        Nos esforçamos para manter o serviço com SLA de 99,5% (Free/Starter) e 99,9% (Pro/Enterprise).
        Não garantimos ausência total de interrupções, mas comunicaremos manutenções programadas com
        antecedência.
      </p>

      <h2>8. Limitação de responsabilidade</h2>
      <p>
        Em nenhuma hipótese a UniverCert será responsável por lucros cessantes, danos indiretos ou
        consequenciais. Nossa responsabilidade total não excederá o valor pago pelo cliente nos
        últimos 12 meses.
      </p>

      <h2>9. Alterações</h2>
      <p>
        Podemos atualizar estes termos a qualquer momento. Alterações significativas serão
        notificadas por e-mail com 15 dias de antecedência.
      </p>

      <h2>10. Lei aplicável e foro</h2>
      <p>
        Estes termos são regidos pela legislação brasileira. Fica eleito o foro da Comarca de São
        Paulo/SP para dirimir quaisquer controvérsias.
      </p>

      <h2>11. Contato</h2>
      <p>
        Dúvidas sobre estes termos? Email: <a className="text-primary" href="mailto:diegoxp12@me.com">diegoxp12@me.com</a>
      </p>
    </>
  );
}
