import type { UF } from '../../domain/constants/brazilian-states';

export interface CreateLoanInput {
  amountInCents: number;
  uf: string;
}

export interface CreateLoanOutput {
  id: string;
  amountInCents: number;
  uf: UF;
  createdAt: Date;
}
