// UniverCert · Render PDF a partir de HTML
// 3 caminhos (em ordem):
//   1. Cloudflare Browser Rendering binding (env.BROWSER) — só funciona em Workers, NÃO em Pages
//   2. Cloudflare Browser Rendering REST API (CF_ACCOUNT_ID + CF_BROWSER_API_TOKEN) — funciona em Pages
//   3. Browserless.io fallback (BROWSERLESS_API_KEY) — third-party, último recurso
// Se nenhum disponível, throw — endpoint do PDF cai no fallback HTML.

import { getRequestContext } from '@cloudflare/next-on-pages';

export async function renderPdfFromHtml(html: string): Promise<ArrayBuffer> {
  const { env } = getRequestContext();

  // 1) Tenta Browser Rendering binding (Workers only; Pages ignora [browser] no wrangler.toml)
  // @ts-expect-error - BROWSER binding pode não estar configurado ainda
  const browserBinding = env.BROWSER as Fetcher | undefined;
  if (browserBinding) {
    try {
      const resp = await browserBinding.fetch('https://browser/pdf', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ html }),
      });
      if (resp.ok) {
        return await resp.arrayBuffer();
      }
      console.warn('Browser Rendering binding retornou', resp.status, '- tentando REST API');
    } catch (e) {
      console.warn('Browser Rendering binding falhou, tentando REST API:', e);
    }
  }

  // 2) Cloudflare Browser Rendering REST API — caminho oficial pra Pages
  // Doc: https://developers.cloudflare.com/browser-rendering/rest-api/pdf-endpoint/
  // @ts-expect-error - vars podem não estar definidas
  const cfAccountId = env.CF_ACCOUNT_ID as string | undefined;
  // @ts-expect-error
  const cfBrowserToken = env.CF_BROWSER_API_TOKEN as string | undefined;
  if (cfAccountId && cfBrowserToken) {
    const resp = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/browser-rendering/pdf`,
      {
        method: 'POST',
        headers: {
          'authorization': `Bearer ${cfBrowserToken}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          html,
          viewport: { width: 1240, height: 1754 }, // ~A4 landscape em pixels
          addStyleTag: [{ content: '@page { margin: 0; size: A4 landscape; }' }],
        }),
      }
    );
    if (resp.ok) {
      return await resp.arrayBuffer();
    }
    const errText = await resp.text().catch(() => '');
    console.warn('CF REST API falhou:', resp.status, errText.substring(0, 200));
    // não throw — tenta browserless
  }

  // 3) Browserless.io fallback (precisa BROWSERLESS_API_KEY env)
  // @ts-expect-error - var pode não estar definida
  const browserlessKey = env.BROWSERLESS_API_KEY as string | undefined;
  if (browserlessKey) {
    const resp = await fetch(`https://chrome.browserless.io/pdf?token=${browserlessKey}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        html,
        options: { format: 'A4', landscape: true, printBackground: true, margin: { top: 0, bottom: 0, left: 0, right: 0 } },
      }),
    });
    if (!resp.ok) throw new Error(`browserless ${resp.status}`);
    return await resp.arrayBuffer();
  }

  // 4) Sem nenhuma opção — throw pra cair no fallback HTML do endpoint
  throw new Error('NO_PDF_RENDERER_CONFIGURED');
}
