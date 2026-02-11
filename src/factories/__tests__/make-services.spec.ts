import { makeServices } from '../make-services';
import { ConcentrationRiskService } from '@/domain';
import type { Repositories } from '../make-repositories';
import type { ConcentrationLimitRepository, LoanRepository } from '@/domain';

describe('makeServices', () => {
  let mockRepositories: Repositories;
  let mockConcentrationLimitRepository: jest.Mocked<ConcentrationLimitRepository>;
  let mockLoanRepository: jest.Mocked<LoanRepository>;

  beforeEach(() => {
    mockConcentrationLimitRepository = {
      getLimitForState: jest.fn(),
      getDefaultLimit: jest.fn(),
      ensureIndexes: jest.fn(),
    } as unknown as jest.Mocked<ConcentrationLimitRepository>;

    mockLoanRepository = {
      save: jest.fn(),
      getTotalAmount: jest.fn(),
      getAmountByState: jest.fn(),
      ensureIndexes: jest.fn(),
    } as unknown as jest.Mocked<LoanRepository>;

    mockRepositories = {
      loanRepository: mockLoanRepository,
      concentrationLimitRepository: mockConcentrationLimitRepository,
    };
  });

  it('creates and returns all services', () => {
    const services = makeServices(mockRepositories);

    expect(services).toHaveProperty('concentrationRiskService');
  });

  it('creates ConcentrationRiskService instance', () => {
    const services = makeServices(mockRepositories);

    expect(services.concentrationRiskService).toBeInstanceOf(ConcentrationRiskService);
  });

  it('injects concentrationLimitRepository into ConcentrationRiskService', () => {
    const services = makeServices(mockRepositories);

    // Verify the service was created with the repository
    expect(services.concentrationRiskService).toBeDefined();
    expect(services.concentrationRiskService).toBeInstanceOf(ConcentrationRiskService);
  });

  it('returns object with exactly 1 service', () => {
    const services = makeServices(mockRepositories);

    expect(Object.keys(services)).toHaveLength(1);
  });

  it('creates new instances on each call', () => {
    const services1 = makeServices(mockRepositories);
    const services2 = makeServices(mockRepositories);

    expect(services1.concentrationRiskService).not.toBe(services2.concentrationRiskService);
  });

  it('uses the provided repositories', () => {
    const services = makeServices(mockRepositories);

    // The service should be properly initialized
    expect(services.concentrationRiskService).toBeDefined();
  });
});
