export const BRAZILIAN_STATE_CODES = [
  'AC',
  'AL',
  'AP',
  'AM',
  'BA',
  'CE',
  'DF',
  'ES',
  'GO',
  'MA',
  'MT',
  'MS',
  'MG',
  'PA',
  'PB',
  'PR',
  'PE',
  'PI',
  'RJ',
  'RN',
  'RS',
  'RO',
  'RR',
  'SC',
  'SP',
  'SE',
  'TO',
] as const;

export type UF = (typeof BRAZILIAN_STATE_CODES)[number];

const VALID_UFS = new Set<string>(BRAZILIAN_STATE_CODES);

export function isValidUF(value: string): value is UF {
  return VALID_UFS.has(value.toUpperCase());
}

export function assertValidUF(value: string): asserts value is UF {
  if (!isValidUF(value)) {
    throw new Error(`Invalid UF: "${value}". Must be one of: ${BRAZILIAN_STATE_CODES.join(', ')}`);
  }
}
