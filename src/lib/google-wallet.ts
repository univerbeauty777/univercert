// UniverCert · Google Wallet pass JWT signer (S56)
// RS256 JWT real via crypto.subtle (edge-compatible).
// Setup:
//   1. Google Cloud project + Wallet API habilitada
//   2. Service Account com scope wallet_object.issuer
//   3. Issuer ID em https://pay.google.com/business/console
//   4. Env: GOOGLE_WALLET_ISSUER_ID, GOOGLE_WALLET_SA_EMAIL, GOOGLE_WALLET_SA_PRIVATE_KEY (PEM PKCS8)

function base64UrlEncode(input: ArrayBuffer | Uint8Array | string): string {
  let bytes: Uint8Array;
  if (typeof input === 'string') {
    bytes = new TextEncoder().encode(input);
  } else if (input instanceof Uint8Array) {
    bytes = input;
  } else {
    bytes = new Uint8Array(input);
  }
  let str = '';
  for (let i = 0; i < bytes.length; i++) str += String.fromCharCode(bytes[i]);
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Importa private key PEM PKCS8 (RSA) */
async function importPrivateKey(pemPkcs8: string): Promise<CryptoKey> {
  const pem = pemPkcs8
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s+/g, '');
  const der = Uint8Array.from(atob(pem), (c) => c.charCodeAt(0));
  return crypto.subtle.importKey(
    'pkcs8',
    der.buffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  );
}

/**
 * Cria JWT RS256 pra Google Wallet "Save to Google Wallet" link.
 * payload deve conter genericObjects ou genericClasses
 */
export async function signGoogleWalletJwt(args: {
  saEmail: string;
  privateKeyPem: string;
  issuerId: string;
  classId: string;          // "{issuer_id}.{class_suffix}"
  objectId: string;         // "{issuer_id}.{object_suffix}"
  cert: {
    recipientName: string;
    courseName: string;
    issueDateISO: string;
    issuerName: string;
    verifyUrl: string;
    credentialId: string;
    hours?: number;
  };
}): Promise<string> {
  const header = { alg: 'RS256', typ: 'JWT' };

  const genericObject = {
    id: args.objectId,
    classId: args.classId,
    state: 'ACTIVE',
    cardTitle: { defaultValue: { language: 'pt-BR', value: args.cert.issuerName } },
    header: { defaultValue: { language: 'pt-BR', value: 'Certificado' } },
    subheader: { defaultValue: { language: 'pt-BR', value: args.cert.courseName } },
    textModulesData: [
      { header: 'Aluno', body: args.cert.recipientName, id: 'recipient' },
      { header: 'Emitido em', body: args.cert.issueDateISO, id: 'issued' },
      ...(args.cert.hours ? [{ header: 'Horas', body: `${args.cert.hours}h`, id: 'hours' }] : []),
    ],
    barcode: { type: 'QR_CODE', value: args.cert.verifyUrl, alternateText: args.cert.credentialId },
    linksModuleData: {
      uris: [{ uri: args.cert.verifyUrl, description: 'Verificar autenticidade', id: 'verify' }],
    },
    hexBackgroundColor: '#1B2D5E',
  };

  const payload = {
    iss: args.saEmail,
    aud: 'google',
    typ: 'savetowallet',
    iat: Math.floor(Date.now() / 1000),
    payload: { genericObjects: [genericObject] },
    origins: ['https://univercert.net'],
  };

  const headerEncoded = base64UrlEncode(JSON.stringify(header));
  const payloadEncoded = base64UrlEncode(JSON.stringify(payload));
  const signingInput = `${headerEncoded}.${payloadEncoded}`;

  const key = await importPrivateKey(args.privateKeyPem);
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(signingInput));
  const sigEncoded = base64UrlEncode(new Uint8Array(sig));

  return `${signingInput}.${sigEncoded}`;
}

export function googleWalletSaveUrl(jwt: string): string {
  return `https://pay.google.com/gp/v/save/${jwt}`;
}
