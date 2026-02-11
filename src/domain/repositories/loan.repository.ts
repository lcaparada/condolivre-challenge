import type { LoanEntity } from '../entities/loan.entity';

export interface LoanRepository {
  save(loan: LoanEntity): Promise<LoanEntity>;
  getTotalAmount(): Promise<number>;
  getAmountByState(): Promise<Record<string, number>>;
}
