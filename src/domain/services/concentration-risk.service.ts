import type { UF } from '../constants/brazilian-states';
import { DEFAULT_STATE_LIMIT, STATE_LIMITS } from '../constants/concentration-limits';
import { ConcentrationLimitExceededError } from '../errors';

const limitsByUf = new Map<string, number>(STATE_LIMITS.map((c) => [c.uf, c.limit]));

function getLimitForState(uf: string): number {
  return limitsByUf.get(uf.toUpperCase()) ?? DEFAULT_STATE_LIMIT;
}

export interface ConcentrationValidationInput {
  totalPortfolioAmount: number;
  amountByState: Record<string, number>;
  newLoanAmount: number;
  newLoanUf: UF | string;
}

export function validateConcentration({
  newLoanUf,
  newLoanAmount,
  amountByState,
  totalPortfolioAmount,
}: ConcentrationValidationInput): void {
  const newTotal = totalPortfolioAmount + newLoanAmount;

  if (newTotal <= 0) {
    return;
  }

  if (totalPortfolioAmount === 0) {
    return;
  }

  const uf = newLoanUf.toUpperCase();
  const limit = getLimitForState(uf);

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
