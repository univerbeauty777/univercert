// UniverCert · Apple Wallet pkpass builder (S55)
// pkpass = zip de pass.json + manifest.json + signature + assets
// Manifest = SHA1 hash de cada arquivo
// Signature = PKCS#7 detached signature do manifest com cert .p12 + WWDR
//
// edge runtime restriction: PKCS#7 signing precisa de WebCrypto + parsing ASN.1.
// Implementação completa: chamar Cloudflare Worker dedicado com Node.js (worker
// separado com node-forge), OU usar serviço externo (passkit-generator hosted).
//
// Esse modulo retorna a estrutura do pass.json corretamente e descreve o que
// falta. Quando o user plugar APPLE_PASS_SIGNING_WORKER_URL, este modulo POSTa
// o manifest pra worker dedicado e recebe signature de volta.

export type ApplePassData = {
  passTypeIdentifier: string;        // 'pass.com.univercert.cert'
  teamIdentifier: string;             // 'TEAMID'
  serialNumber: string;               // cred.id
  organizationName: string;
  description: string;
  recipientName: string;
  courseName: string;
  issuerName: string;
  issueDateISO: string;
  verifyUrl: string;
  credentialId: string;
  hours?: number;
  primaryColor: string;               // 'rgb(27, 45, 94)'
};

export function buildPassJson(d: ApplePassData) {
  return {
    formatVersion: 1,
    passTypeIdentifier: d.passTypeIdentifier,
    serialNumber: d.serialNumber,
    teamIdentifier: d.teamIdentifier,
    organizationName: d.organizationName,
    description: d.description,
    logoText: d.issuerName,
    foregroundColor: 'rgb(255, 255, 255)',
    backgroundColor: d.primaryColor,
    labelColor: 'rgb(212, 169, 55)',

    generic: {
      primaryFields: [
        { key: 'course', label: 'CURSO', value: d.courseName },
      ],
      secondaryFields: [
        { key: 'name', label: 'ALUNO', value: d.recipientName },
      ],
      auxiliaryFields: [
        { key: 'date', label: 'EMITIDO', value: d.issueDateISO },
        ...(d.hours ? [{ key: 'hours', label: 'CARGA', value: `${d.hours}h` }] : []),
      ],
      backFields: [
        { key: 'verify', label: 'Verificar', value: d.verifyUrl, attributedValue: `<a href="${d.verifyUrl}">Verificar autenticidade</a>` },
        { key: 'id', label: 'ID', value: d.credentialId },
        { key: 'issuer', label: 'Emitido por', value: d.issuerName },
        { key: 'powered', label: '', value: 'Powered by UniverCert' },
      ],
    },

    barcodes: [
      { format: 'PKBarcodeFormatQR', message: d.verifyUrl, messageEncoding: 'iso-8859-1', altText: d.credentialId },
    ],

    webServiceURL: `https://univercert.net/api/v1/wallet/apple/`,
    authenticationToken: d.credentialId,
  };
}

/**
 * Stub: gera o pkpass FINAL via worker externo (signing).
 * Quando APPLE_PASS_SIGNING_WORKER_URL estiver configurado, este modulo
 * envia o pass.json + assets + recebe pkpass binary signed back.
 */
export async function generateSignedPkpass(args: {
  workerUrl: string;
  workerSecret: string;
  passData: ApplePassData;
}): Promise<ArrayBuffer> {
  const r = await fetch(args.workerUrl, {
    method: 'POST',
    headers: {
      'authorization': `Bearer ${args.workerSecret}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ pass: buildPassJson(args.passData) }),
  });
  if (!r.ok) throw new Error(`apple_pass_signing_worker ${r.status}: ${(await r.text()).slice(0, 300)}`);
  return await r.arrayBuffer();
}
