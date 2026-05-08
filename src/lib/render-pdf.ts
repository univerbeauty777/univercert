// UniverCert · Render PDF a partir de HTML
// Tenta Cloudflare Browser Rendering API binding; se não tiver, usa Browserless.io HTTP API.
// Se nenhum disponível, throw — endpoint do PDF cai no fallback HTML.

import { getRequestContext } from '@cloudflare/next-on-pages';

export async function renderPdfFromHtml(html: string): Promise<ArrayBuffer> {
  const { env } = getRequestContext();

  // 1) Tenta Browser Rendering binding (precisa adicionar `browser = { binding = "BROWSER" }` no wrangler.toml)
  // @ts-expect-error - BROWSER binding pode não estar configurado ainda
  const browserBinding = env.BROWSER as Fetcher | undefined;
  if (browserBinding) {
    try {
      // Usa a REST-style invoke. Cloudflare Browser Rendering aceita /pdf via HTTP no binding.
      const resp = await browserBinding.fetch('https://browser/pdf', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ html }),
      });
      if (resp.ok) {
        return await resp.arrayBuffer();
      }
    } catch (e) {
      console.warn('Browser Rendering binding falhou, tentando Browserless:', e);
    }
  }

  // 2) Browserless.io fallback (precisa BROWSERLESS_API_KEY env)
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

  // 3) Sem nenhuma opção — throw pra cair no fallback HTML do endpoint
  throw new Error('NO_PDF_RENDERER_CONFIGURED');
}
