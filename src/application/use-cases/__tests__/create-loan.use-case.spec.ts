import { CreateLoanUseCase } from '../create-loan.use-case';
import type { LoanRepository } from '../../../domain/repositories/loan.repository';
import { ConcentrationRiskService } from '../../../domain/services/concentration-risk.service';
import { LoanEntity } from '../../../domain/entities/loan.entity';
import { ConcentrationLimitExceededError } from '../../../domain/errors';

type MockConcentrationRiskService = {
  validateConcentration: jest.MockedFunction<
    ConcentrationRiskService['validateConcentration']
  >;
};

describe('CreateLoanUseCase', () => {
  let useCase: CreateLoanUseCase;
  let mockLoanRepository: jest.Mocked<LoanRepository>;
  let mockConcentrationRiskService: MockConcentrationRiskService;

  beforeEach(() => {
    mockLoanRepository = {
      save: jest.fn(),
      getTotalAmount: jest.fn(),
      getAmountByState: jest.fn(),
    };

    mockConcentrationRiskService = {
      validateConcentration: jest.fn(),
    };

    useCase = new CreateLoanUseCase(
      mockLoanRepository,
      mockConcentrationRiskService as unknown as ConcentrationRiskService
    );
  });

  describe('when loan is valid and concentration is within limits', () => {
    it('creates and saves the loan', async () => {
      mockLoanRepository.getTotalAmount.mockResolvedValue(100_000);
      mockLoanRepository.getAmountByState.mockResolvedValue({ RJ: 5_000 });
      mockLoanRepository.save.mockImplementation(async (loan) => loan);

      const result = await useCase.execute({ amount: 10_000, uf: 'SP' });

      expect(result).toMatchObject({
        id: expect.any(String),
        amount: 10_000,
        uf: 'SP',
      });
      expect(mockLoanRepository.save).toHaveBeenCalledWith(expect.any(LoanEntity));
    });

    it('calls getTotalAmount and getAmountByState', async () => {
      mockLoanRepository.getTotalAmount.mockResolvedValue(50_000);
      mockLoanRepository.getAmountByState.mockResolvedValue({ SP: 8_000 });
      mockLoanRepository.save.mockImplementation(async (loan) => loan);

      await useCase.execute({ amount: 5_000, uf: 'RJ' });

      expect(mockLoanRepository.getTotalAmount).toHaveBeenCalledTimes(1);
      expect(mockLoanRepository.getAmountByState).toHaveBeenCalledTimes(1);
    });

    it('validates concentration with correct parameters', async () => {
      mockLoanRepository.getTotalAmount.mockResolvedValue(100_000);
      mockLoanRepository.getAmountByState.mockResolvedValue({ SP: 15_000, RJ: 5_000 });
      mockLoanRepository.save.mockImplementation(async (loan) => loan);

      await useCase.execute({ amount: 3_000, uf: 'MG' });

      expect(mockConcentrationRiskService.validateConcentration).toHaveBeenCalledWith({
        totalPortfolioAmount: 100_000,
        amountByState: { SP: 15_000, RJ: 5_000 },
        newLoanAmount: 3_000,
        newLoanUf: 'MG',
      });
    });

    it('normalizes uf to uppercase', async () => {
      mockLoanRepository.getTotalAmount.mockResolvedValue(50_000);
      mockLoanRepository.getAmountByState.mockResolvedValue({});
      mockLoanRepository.save.mockImplementation(async (loan) => loan);

      const result = await useCase.execute({ amount: 5_000, uf: 'sp' });

      expect(result.uf).toBe('SP');
    });
  });

  describe('when concentration limit is exceeded', () => {
    it('throws ConcentrationLimitExceededError', async () => {
      mockLoanRepository.getTotalAmount.mockResolvedValue(100_000);
      mockLoanRepository.getAmountByState.mockResolvedValue({ RJ: 9_000 });
      mockConcentrationRiskService.validateConcentration.mockRejectedValue(
        new ConcentrationLimitExceededError('Limit exceeded', 'RJ', 0.12, 0.1)
      );

      await expect(useCase.execute({ amount: 5_000, uf: 'RJ' })).rejects.toThrow(
        ConcentrationLimitExceededError
      );

      expect(mockLoanRepository.save).not.toHaveBeenCalled();
    });

    it('does not save loan when concentration validation fails', async () => {
      mockLoanRepository.getTotalAmount.mockResolvedValue(100_000);
      mockLoanRepository.getAmountByState.mockResolvedValue({ SP: 18_000 });
      mockConcentrationRiskService.validateConcentration.mockRejectedValue(
        new ConcentrationLimitExceededError('Limit exceeded', 'SP', 0.22, 0.2)
      );

      await expect(useCase.execute({ amount: 10_000, uf: 'SP' })).rejects.toThrow();

      expect(mockLoanRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('when entity validation fails', () => {
    it('throws when uf is invalid', async () => {
      await expect(useCase.execute({ amount: 5_000, uf: 'XX' })).rejects.toThrow('Invalid UF');

      expect(mockLoanRepository.getTotalAmount).not.toHaveBeenCalled();
      expect(mockLoanRepository.getAmountByState).not.toHaveBeenCalled();
      expect(mockLoanRepository.save).not.toHaveBeenCalled();
    });

    it('throws when amount is zero', async () => {
      await expect(useCase.execute({ amount: 0, uf: 'SP' })).rejects.toThrow(
        'Amount must be greater than 0'
      );

      expect(mockLoanRepository.getTotalAmount).not.toHaveBeenCalled();
      expect(mockLoanRepository.getAmountByState).not.toHaveBeenCalled();
      expect(mockLoanRepository.save).not.toHaveBeenCalled();
    });

    it('throws when amount is negative', async () => {
      await expect(useCase.execute({ amount: -100, uf: 'RJ' })).rejects.toThrow(
        'Amount must be greater than 0'
      );

      expect(mockLoanRepository.getTotalAmount).not.toHaveBeenCalled();
    });
  });

  describe('flow integration', () => {
    it('executes the complete flow in correct order', async () => {
      const callOrder: string[] = [];

      mockLoanRepository.getTotalAmount.mockImplementation(async () => {
        callOrder.push('getTotalAmount');
        return 100_000;
      });

      mockLoanRepository.getAmountByState.mockImplementation(async () => {
        callOrder.push('getAmountByState');
        return { SP: 10_000 };
      });

      mockConcentrationRiskService.validateConcentration.mockImplementation(async () => {
        callOrder.push('validateConcentration');
      });

      mockLoanRepository.save.mockImplementation(async (loan) => {
        callOrder.push('save');
        return loan;
      });

      await useCase.execute({ amount: 5_000, uf: 'RJ' });

      expect(callOrder).toEqual([
        'getTotalAmount',
        'getAmountByState',
        'validateConcentration',
        'save',
      ]);
    });
  });
});
