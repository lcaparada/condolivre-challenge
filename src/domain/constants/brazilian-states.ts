import { InvalidUFError } from '../errors/invalid-uf.error';

export enum BrazilianStateCode {
  AC = 'AC',
  AL = 'AL',
  AP = 'AP',
  AM = 'AM',
  BA = 'BA',
  CE = 'CE',
  DF = 'DF',
  ES = 'ES',
  GO = 'GO',
  MA = 'MA',
  MT = 'MT',
  MS = 'MS',
  MG = 'MG',
  PA = 'PA',
  PB = 'PB',
  PR = 'PR',
  PE = 'PE',
  PI = 'PI',
  RJ = 'RJ',
  RN = 'RN',
  RS = 'RS',
  RO = 'RO',
  RR = 'RR',
  SC = 'SC',
  SP = 'SP',
  SE = 'SE',
  TO = 'TO',
}

export type UF = BrazilianStateCode;

const VALID_UFS = new Set<string>(Object.values(BrazilianStateCode));

export function isValidUF(value: string): value is UF {
  return VALID_UFS.has(value.toUpperCase());
}

export function assertValidUF(value: string): asserts value is UF {
  if (!isValidUF(value)) {
    throw new InvalidUFError(value);
  }
}
