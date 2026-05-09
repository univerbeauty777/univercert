// UniverCert · PDF → PNG converter (client-side, S21)
// Carrega pdf.js dinamicamente do CDN (so quando user solta PDF), renderiza
// pagina 1 num canvas A4 em alta DPI, exporta como PNG blob.
//
// Resultado: PDF importado vira IMAGE background no layoutV2 — render funciona
// tanto no editor quanto no PDF final (browser-rendering).

const PDFJS_VERSION = '4.0.379';
const PDFJS_CDN = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/build/pdf.min.mjs`;
const PDFJS_WORKER = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/build/pdf.worker.min.mjs`;

let pdfjsPromise: Promise<any> | null = null;

async function loadPdfJs(): Promise<any> {
  if (typeof window === 'undefined') {
    throw new Error('pdf.js so funciona no client');
  }
  if (!pdfjsPromise) {
    pdfjsPromise = (async () => {
      // @ts-expect-error - dynamic import de URL externa
      const mod = await import(/* webpackIgnore: true */ PDFJS_CDN);
      mod.GlobalWorkerOptions.workerSrc = PDFJS_WORKER;
      return mod;
    })();
  }
  return pdfjsPromise;
}

export type PdfConvertResult = {
  blob: Blob;
  width: number;        // px
  height: number;       // px
  pageCount: number;
};

/**
 * Converte um File (PDF) em PNG blob da pagina 1.
 * @param scale  fator de DPI. 2 = ~144dpi (qualidade impressao). 3 = ~216dpi.
 */
export async function pdfFileToPngBlob(file: File, scale = 2.5): Promise<PdfConvertResult> {
  if (file.type !== 'application/pdf') {
    throw new Error('arquivo nao eh PDF (' + file.type + ')');
  }
  const pdfjs = await loadPdfJs();
  const arrayBuffer = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: arrayBuffer }).promise;
  const page = await doc.getPage(1);
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement('canvas');
  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas 2d context indisponivel');

  // Fundo branco (PDFs sem background dao transparente)
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  await page.render({ canvasContext: ctx, viewport }).promise;

  const blob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('toBlob retornou null'))),
      'image/png',
      0.95,
    );
  });

  return {
    blob,
    width: canvas.width,
    height: canvas.height,
    pageCount: doc.numPages,
  };
}

/**
 * Wrapper conveniente: detecta orientacao A4 (landscape vs portrait) baseada nas dimensoes.
 */
export function detectOrientation(width: number, height: number): 'landscape' | 'portrait' {
  return width >= height ? 'landscape' : 'portrait';
}
