import { makeUseCases } from '../make-use-cases';
import { CreateLoanUseCase } from '@/application';
import type { Repositories } from '../make-repositories';
import type { Services } from '../make-services';
import type {
  ConcentrationRiskService,
  LoanRepository,
  ConcentrationLimitRepository,
} from '@/domain';

describe('makeUseCases', () => {
  let mockRepositories: Repositories;
  let mockServices: Services;
  let mockLoanRepository: jest.Mocked<LoanRepository>;
  let mockConcentrationLimitRepository: jest.Mocked<ConcentrationLimitRepository>;
  let mockConcentrationRiskService: jest.Mocked<ConcentrationRiskService>;

  beforeEach(() => {
    mockLoanRepository = {
      save: jest.fn(),
      getTotalAmount: jest.fn(),
      getAmountByState: jest.fn(),
      ensureIndexes: jest.fn(),
    } as unknown as jest.Mocked<LoanRepository>;

    mockConcentrationLimitRepository = {
      getLimitForState: jest.fn(),
      getDefaultLimit: jest.fn(),
      ensureIndexes: jest.fn(),
    } as unknown as jest.Mocked<ConcentrationLimitRepository>;

    mockConcentrationRiskService = {
      validateConcentration: jest.fn(),
    } as unknown as jest.Mocked<ConcentrationRiskService>;

    mockRepositories = {
      loanRepository: mockLoanRepository,
      concentrationLimitRepository: mockConcentrationLimitRepository,
    } as unknown as Repositories;

    mockServices = {
      concentrationRiskService: mockConcentrationRiskService,
    };
  });

  it('creates and returns all use cases', () => {
    const useCases = makeUseCases(mockRepositories, mockServices);

    expect(useCases).toHaveProperty('createLoanUseCase');
  });

  it('creates CreateLoanUseCase instance', () => {
    const useCases = makeUseCases(mockRepositories, mockServices);

    expect(useCases.createLoanUseCase).toBeInstanceOf(CreateLoanUseCase);
  });

  it('injects loanRepository and concentrationRiskService into CreateLoanUseCase', () => {
    const useCases = makeUseCases(mockRepositories, mockServices);

    expect(useCases.createLoanUseCase).toBeDefined();
    expect(useCases.createLoanUseCase).toBeInstanceOf(CreateLoanUseCase);
  });

  it('returns object with exactly 1 use case', () => {
    const useCases = makeUseCases(mockRepositories, mockServices);

    expect(Object.keys(useCases)).toHaveLength(1);
  });

  it('creates new instances on each call', () => {
    const useCases1 = makeUseCases(mockRepositories, mockServices);
    const useCases2 = makeUseCases(mockRepositories, mockServices);

    expect(useCases1.createLoanUseCase).not.toBe(useCases2.createLoanUseCase);
  });

  it('uses the provided repositories and services', () => {
    const useCases = makeUseCases(mockRepositories, mockServices);

    expect(useCases.createLoanUseCase).toBeDefined();
  });

  it('correctly wires dependencies for CreateLoanUseCase', async () => {
    const useCases = makeUseCases(mockRepositories, mockServices);

    mockLoanRepository.getTotalAmount.mockResolvedValue(10_000_000);
    mockLoanRepository.getAmountByState.mockResolvedValue({ SP: 1_000_000 });
    mockLoanRepository.save.mockImplementation(async (loan) => loan);
    mockConcentrationRiskService.validateConcentration.mockResolvedValue(undefined);

    const result = await useCases.createLoanUseCase.execute({
      amountInCents: 500_000,
      uf: 'RJ',
    });

    expect(mockLoanRepository.getTotalAmount).toHaveBeenCalled();
    expect(mockLoanRepository.getAmountByState).toHaveBeenCalled();
    expect(mockConcentrationRiskService.validateConcentration).toHaveBeenCalled();
    expect(mockLoanRepository.save).toHaveBeenCalled();
    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('amountInCents', 500_000);
    expect(result).toHaveProperty('uf', 'RJ');
    expect(result).toHaveProperty('createdAt');
  });
});
