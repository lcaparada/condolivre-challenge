import { ConcentrationLimitExceededError } from '../../errors';
import { validateConcentration } from '../concentration-risk.service';

function makeInput(overrides: Partial<Parameters<typeof validateConcentration>[0]> = {}) {
  return {
    totalPortfolioAmount: 100_000,
    amountByState: {} as Record<string, number>,
    newLoanAmount: 5_000,
    newLoanUf: 'RJ' as const,
    ...overrides,
  };
}

describe('validateConcentration', () => {
  describe('when portfolio is empty', () => {
    it('throws because new loan would be 100% in one state (exceeds any limit)', () => {
      expect(() =>
        validateConcentration(
          makeInput({ totalPortfolioAmount: 0, amountByState: {}, newLoanAmount: 50_000, newLoanUf: 'SP' })
        )
      ).toThrow(ConcentrationLimitExceededError);
    });
  });

  describe('when newTotal <= 0', () => {
    it('does not throw', () => {
      expect(() =>
        validateConcentration(
          makeInput({ totalPortfolioAmount: 0, newLoanAmount: 0 })
        )
      ).not.toThrow();
    });
  });

  describe('non-SP state (10% limit)', () => {
    it('does not throw when state share stays at or below 10%', () => {
      expect(() =>
        validateConcentration(
          makeInput({ amountByState: { RJ: 5_000 }, newLoanAmount: 4_000, newLoanUf: 'RJ' })
        )
      ).not.toThrow();
    });

    it('does not throw when state share equals 10%', () => {
      expect(() =>
        validateConcentration(
          makeInput({ amountByState: { RJ: 0 }, newLoanAmount: 11_111.11, newLoanUf: 'RJ' })
        )
      ).not.toThrow();
    });

    it('throws when state share would exceed 10%', () => {
      expect(() =>
        validateConcentration(
          makeInput({ amountByState: { RJ: 5_000 }, newLoanAmount: 6_000, newLoanUf: 'RJ' })
        )
      ).toThrow(ConcentrationLimitExceededError);
    });
  });

  describe('São Paulo (20% limit)', () => {
    it('does not throw when SP share stays at or below 20%', () => {
      expect(() =>
        validateConcentration(
          makeInput({ amountByState: { SP: 15_000 }, newLoanAmount: 4_000, newLoanUf: 'SP' })
        )
      ).not.toThrow();
    });

    it('does not throw when SP share equals 20%', () => {
      expect(() =>
        validateConcentration(
          makeInput({ amountByState: { SP: 15_000 }, newLoanAmount: 5_000, newLoanUf: 'SP' })
        )
      ).not.toThrow();
    });

    it('throws when SP share would exceed 20%', () => {
      expect(() =>
        validateConcentration(
          makeInput({ amountByState: { SP: 15_000 }, newLoanAmount: 10_000, newLoanUf: 'SP' })
        )
      ).toThrow(ConcentrationLimitExceededError);
    });

    it('accepts uf in lowercase', () => {
      expect(() =>
        validateConcentration(
          makeInput({ amountByState: { SP: 10_000 }, newLoanAmount: 5_000, newLoanUf: 'sp' })
        )
      ).not.toThrow();
    });
  });

  describe('ConcentrationLimitExceededError', () => {
    it('exposes uf, currentShare and limit', () => {
      try {
        validateConcentration(
          makeInput({ amountByState: { RJ: 10_000 }, newLoanAmount: 2_000, newLoanUf: 'RJ' })
        );
      } catch (err) {
        expect(err).toBeInstanceOf(ConcentrationLimitExceededError);
        const e = err as ConcentrationLimitExceededError;
        expect(e.uf).toBe('RJ');
        expect(e.limit).toBe(0.1);
        expect(e.currentShare).toBeGreaterThan(0.1);
      }
    });
  });
});
