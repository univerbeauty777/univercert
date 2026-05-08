// UniverCert · validador de CPF brasileiro
// Algoritmo oficial — calcula os 2 dígitos verificadores

export function cleanCPF(cpf: string): string {
  return cpf.replace(/\D/g, '');
}

export function maskCPF(cpf: string): string {
  const c = cleanCPF(cpf);
  if (c.length !== 11) return cpf;
  return `${c.slice(0, 3)}.${c.slice(3, 6)}.${c.slice(6, 9)}-${c.slice(9)}`;
}

/**
 * Valida CPF usando o algoritmo oficial dos dígitos verificadores.
 * Não checa se existe na Receita Federal — só valida a estrutura.
 */
export function isValidCPF(cpf: string): boolean {
  const c = cleanCPF(cpf);

  // Comprimento errado ou todos os dígitos iguais (000.000.000-00, etc)
  if (c.length !== 11 || /^(\d)\1+$/.test(c)) return false;

  // Primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(c[i], 10) * (10 - i);
  let dv1 = 11 - (sum % 11);
  if (dv1 >= 10) dv1 = 0;
  if (dv1 !== parseInt(c[9], 10)) return false;

  // Segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(c[i], 10) * (11 - i);
  let dv2 = 11 - (sum % 11);
  if (dv2 >= 10) dv2 = 0;
  if (dv2 !== parseInt(c[10], 10)) return false;

  return true;
}

/**
 * Validação Zod-friendly (use com z.custom ou refine).
 */
export const cpfRefinement = (cpf: string) => isValidCPF(cpf);
export const cpfErrorMessage = 'CPF inválido';
