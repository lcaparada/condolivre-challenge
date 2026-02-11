import type { UF } from '../constants/brazilian-states';
import { ConcentrationLimitExceededError } from '../errors/concentration-limit-exceeded.error';
import type { ConcentrationLimitRepository } from '../repositories/concentration-limit.repository';

export interface ConcentrationValidationInput {
  totalPortfolioAmount: number;
  amountByState: Record<string, number>;
  newLoanAmount: number;
  newLoanUf: UF | string;
}

export class ConcentrationRiskService {
  constructor(private limitRepository: ConcentrationLimitRepository) {}

  async validateConcentration({
    newLoanUf,
    newLoanAmount,
    amountByState,
    totalPortfolioAmount,
  }: ConcentrationValidationInput): Promise<void> {
    const newTotal = totalPortfolioAmount + newLoanAmount;

    if (newTotal <= 0) {
      return;
    }

    if (totalPortfolioAmount === 0) {
      return;
    }

    const uf = newLoanUf.toUpperCase() as UF;
    const stateLimit = await this.limitRepository.getLimitForState(uf);
    const limit = stateLimit ?? (await this.limitRepository.getDefaultLimit());

    const currentStateAmount = amountByState[uf] ?? 0;
    const newStateAmount = currentStateAmount + newLoanAmount;
    const newShare = newStateAmount / newTotal;

    if (newShare > limit) {
      throw new ConcentrationLimitExceededError(
        `Concentration limit exceeded for ${uf}: ${(newShare * 100).toFixed(2)}% would exceed ${limit * 100}% limit`,
        uf,
        newShare,
        limit
      );
    }
  }
}
