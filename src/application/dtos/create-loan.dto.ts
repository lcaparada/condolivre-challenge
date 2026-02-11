import type { UF } from '../../domain/constants/brazilian-states';

export interface CreateLoanInput {
  amount: number;
  uf: string;
}

export interface CreateLoanOutput {
  id: string;
  amount: number;
  uf: UF;
}
