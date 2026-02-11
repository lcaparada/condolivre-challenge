import { CreateLoanUseCase } from '@/application/use-cases/create-loan.use-case';
import type { Repositories } from './make-repositories';
import type { Services } from './make-services';

export function makeUseCases(repositories: Repositories, services: Services) {
  const createLoanUseCase = new CreateLoanUseCase(
    repositories.loanRepository,
    services.concentrationRiskService
  );

  return {
    createLoanUseCase,
  };
}

export type UseCases = ReturnType<typeof makeUseCases>;
