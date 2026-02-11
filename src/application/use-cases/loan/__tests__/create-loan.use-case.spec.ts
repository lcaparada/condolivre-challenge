import {
  LoanEntity,
  LoanRepository,
  ConcentrationRiskService,
  ConcentrationLimitExceededError,
} from '@/domain';
import { CreateLoanUseCase } from '../create-loan.use-case';

type MockConcentrationRiskService = {
  validateConcentration: jest.MockedFunction<ConcentrationRiskService['validateConcentration']>;
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
      mockLoanRepository.getTotalAmount.mockResolvedValue(10_000_000);
      mockLoanRepository.getAmountByState.mockResolvedValue({ RJ: 500_000 });
      mockLoanRepository.save.mockImplementation(async (loan) => loan);

      const result = await useCase.execute({ amountInCents: 1_000_000, uf: 'SP' });

      expect(result).toMatchObject({
        id: expect.any(String),
        amountInCents: 1_000_000,
        uf: 'SP',
        createdAt: expect.any(Date),
      });
      expect(mockLoanRepository.save).toHaveBeenCalledWith(expect.any(LoanEntity));
    });

    it('calls getTotalAmount and getAmountByState', async () => {
      mockLoanRepository.getTotalAmount.mockResolvedValue(5_000_000);
      mockLoanRepository.getAmountByState.mockResolvedValue({ SP: 800_000 });
      mockLoanRepository.save.mockImplementation(async (loan) => loan);

      await useCase.execute({ amountInCents: 500_000, uf: 'RJ' });

      expect(mockLoanRepository.getTotalAmount).toHaveBeenCalledTimes(1);
      expect(mockLoanRepository.getAmountByState).toHaveBeenCalledTimes(1);
    });

    it('validates concentration with correct parameters', async () => {
      mockLoanRepository.getTotalAmount.mockResolvedValue(10_000_000);
      mockLoanRepository.getAmountByState.mockResolvedValue({ SP: 1_500_000, RJ: 500_000 });
      mockLoanRepository.save.mockImplementation(async (loan) => loan);

      await useCase.execute({ amountInCents: 300_000, uf: 'MG' });

      expect(mockConcentrationRiskService.validateConcentration).toHaveBeenCalledWith({
        totalPortfolioAmount: 10_000_000,
        amountByState: { SP: 1_500_000, RJ: 500_000 },
        newLoanAmount: 300_000,
        newLoanUf: 'MG',
      });
    });

    it('normalizes uf to uppercase', async () => {
      mockLoanRepository.getTotalAmount.mockResolvedValue(5_000_000);
      mockLoanRepository.getAmountByState.mockResolvedValue({});
      mockLoanRepository.save.mockImplementation(async (loan) => loan);

      const result = await useCase.execute({ amountInCents: 500_000, uf: 'sp' });

      expect(result.uf).toBe('SP');
    });
  });

  describe('when concentration limit is exceeded', () => {
    it('throws ConcentrationLimitExceededError', async () => {
      mockLoanRepository.getTotalAmount.mockResolvedValue(10_000_000);
      mockLoanRepository.getAmountByState.mockResolvedValue({ RJ: 900_000 });
      mockConcentrationRiskService.validateConcentration.mockRejectedValue(
        new ConcentrationLimitExceededError('Limit exceeded', 'RJ', 0.12, 0.1)
      );

      await expect(useCase.execute({ amountInCents: 500_000, uf: 'RJ' })).rejects.toThrow(
        ConcentrationLimitExceededError
      );

      expect(mockLoanRepository.save).not.toHaveBeenCalled();
    });

    it('does not save loan when concentration validation fails', async () => {
      mockLoanRepository.getTotalAmount.mockResolvedValue(10_000_000);
      mockLoanRepository.getAmountByState.mockResolvedValue({ SP: 1_800_000 });
      mockConcentrationRiskService.validateConcentration.mockRejectedValue(
        new ConcentrationLimitExceededError('Limit exceeded', 'SP', 0.22, 0.2)
      );

      await expect(useCase.execute({ amountInCents: 1_000_000, uf: 'SP' })).rejects.toThrow();

      expect(mockLoanRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('when entity validation fails', () => {
    it('throws when uf is invalid', async () => {
      await expect(useCase.execute({ amountInCents: 500_000, uf: 'XX' })).rejects.toThrow(
        'Invalid UF'
      );

      expect(mockLoanRepository.getTotalAmount).not.toHaveBeenCalled();
      expect(mockLoanRepository.getAmountByState).not.toHaveBeenCalled();
      expect(mockLoanRepository.save).not.toHaveBeenCalled();
    });

    it('throws when amount is zero', async () => {
      await expect(useCase.execute({ amountInCents: 0, uf: 'SP' })).rejects.toThrow(
        'Amount must be greater than 0'
      );

      expect(mockLoanRepository.getTotalAmount).not.toHaveBeenCalled();
      expect(mockLoanRepository.getAmountByState).not.toHaveBeenCalled();
      expect(mockLoanRepository.save).not.toHaveBeenCalled();
    });

    it('throws when amount is negative', async () => {
      await expect(useCase.execute({ amountInCents: -100, uf: 'RJ' })).rejects.toThrow(
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
        return 10_000_000;
      });

      mockLoanRepository.getAmountByState.mockImplementation(async () => {
        callOrder.push('getAmountByState');
        return { SP: 1_000_000 };
      });

      mockConcentrationRiskService.validateConcentration.mockImplementation(async () => {
        callOrder.push('validateConcentration');
      });

      mockLoanRepository.save.mockImplementation(async (loan) => {
        callOrder.push('save');
        return loan;
      });

      await useCase.execute({ amountInCents: 500_000, uf: 'RJ' });

      expect(callOrder).toEqual([
        'getTotalAmount',
        'getAmountByState',
        'validateConcentration',
        'save',
      ]);
    });
  });
});
