import { ConcentrationLimitExceededError } from '../../errors/concentration-limit-exceeded.error';
import {
  ConcentrationRiskService,
  type ConcentrationValidationInput,
} from '../concentration-risk.service';
import type { ConcentrationLimitRepository } from '../../repositories/concentration-limit.repository';
import type { UF } from '../../constants/brazilian-states';

class MockConcentrationLimitRepository implements ConcentrationLimitRepository {
  private limits: Map<string, number> = new Map([
    ['DEFAULT', 0.1],
    ['SP', 0.2],
  ]);

  async getLimitForState(uf: UF): Promise<number | null> {
    return this.limits.get(uf) ?? null;
  }

  async getDefaultLimit(): Promise<number> {
    return this.limits.get('DEFAULT') ?? 0.1;
  }

  setLimit(uf: UF | 'DEFAULT', limit: number): void {
    this.limits.set(uf, limit);
  }
}

function makeInput(overrides: Partial<ConcentrationValidationInput> = {}) {
  return {
    totalPortfolioAmount: 100_000,
    amountByState: {} as Record<string, number>,
    newLoanAmount: 5_000,
    newLoanUf: 'RJ' as const,
    ...overrides,
  };
}

describe('ConcentrationRiskService', () => {
  let service: ConcentrationRiskService;
  let mockRepo: MockConcentrationLimitRepository;

  beforeEach(() => {
    mockRepo = new MockConcentrationLimitRepository();
    service = new ConcentrationRiskService(mockRepo);
  });

  describe('when portfolio is empty (first loan)', () => {
    it('allows any loan because there is no existing concentration', async () => {
      await expect(
        service.validateConcentration(
          makeInput({
            totalPortfolioAmount: 0,
            amountByState: {},
            newLoanAmount: 50_000,
            newLoanUf: 'SP',
          })
        )
      ).resolves.not.toThrow();
    });

    it('allows first loan in any state', async () => {
      await expect(
        service.validateConcentration(
          makeInput({
            totalPortfolioAmount: 0,
            amountByState: {},
            newLoanAmount: 100_000,
            newLoanUf: 'RJ',
          })
        )
      ).resolves.not.toThrow();
    });
  });

  describe('when newTotal <= 0', () => {
    it('does not throw', async () => {
      await expect(
        service.validateConcentration(makeInput({ totalPortfolioAmount: 0, newLoanAmount: 0 }))
      ).resolves.not.toThrow();
    });
  });

  describe('non-SP state (10% limit)', () => {
    it('does not throw when state share stays at or below 10%', async () => {
      await expect(
        service.validateConcentration(
          makeInput({ amountByState: { RJ: 5_000 }, newLoanAmount: 4_000, newLoanUf: 'RJ' })
        )
      ).resolves.not.toThrow();
    });

    it('does not throw when state share equals 10%', async () => {
      await expect(
        service.validateConcentration(
          makeInput({ amountByState: { RJ: 0 }, newLoanAmount: 11_111.11, newLoanUf: 'RJ' })
        )
      ).resolves.not.toThrow();
    });

    it('throws when state share would exceed 10%', async () => {
      await expect(
        service.validateConcentration(
          makeInput({ amountByState: { RJ: 5_000 }, newLoanAmount: 6_000, newLoanUf: 'RJ' })
        )
      ).rejects.toThrow(ConcentrationLimitExceededError);
    });
  });

  describe('São Paulo (20% limit)', () => {
    it('does not throw when SP share stays at or below 20%', async () => {
      await expect(
        service.validateConcentration(
          makeInput({ amountByState: { SP: 15_000 }, newLoanAmount: 4_000, newLoanUf: 'SP' })
        )
      ).resolves.not.toThrow();
    });

    it('does not throw when SP share equals 20%', async () => {
      await expect(
        service.validateConcentration(
          makeInput({ amountByState: { SP: 15_000 }, newLoanAmount: 5_000, newLoanUf: 'SP' })
        )
      ).resolves.not.toThrow();
    });

    it('throws when SP share would exceed 20%', async () => {
      await expect(
        service.validateConcentration(
          makeInput({ amountByState: { SP: 15_000 }, newLoanAmount: 10_000, newLoanUf: 'SP' })
        )
      ).rejects.toThrow(ConcentrationLimitExceededError);
    });

    it('accepts uf in lowercase', async () => {
      await expect(
        service.validateConcentration(
          makeInput({ amountByState: { SP: 10_000 }, newLoanAmount: 5_000, newLoanUf: 'sp' })
        )
      ).resolves.not.toThrow();
    });
  });

  describe('ConcentrationLimitExceededError', () => {
    it('exposes uf, currentShare and limit', async () => {
      try {
        await service.validateConcentration(
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

  describe('dynamic limits from repository', () => {
    it('uses custom limit from repository', async () => {
      mockRepo.setLimit('MG', 0.15);

      await expect(
        service.validateConcentration(
          makeInput({
            totalPortfolioAmount: 100_000,
            amountByState: { MG: 10_000 },
            newLoanAmount: 5_000,
            newLoanUf: 'MG',
          })
        )
      ).resolves.not.toThrow();

      await expect(
        service.validateConcentration(
          makeInput({
            totalPortfolioAmount: 100_000,
            amountByState: { MG: 10_000 },
            newLoanAmount: 10_000,
            newLoanUf: 'MG',
          })
        )
      ).rejects.toThrow(ConcentrationLimitExceededError);
    });
  });
});
