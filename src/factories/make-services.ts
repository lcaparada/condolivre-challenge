import { ConcentrationRiskService } from '@/domain/services/concentration-risk.service';
import type { Repositories } from './make-repositories';

export function makeServices(repositories: Repositories) {
  const concentrationRiskService = new ConcentrationRiskService(
    repositories.concentrationLimitRepository
  );

  return {
    concentrationRiskService,
  };
}

export type Services = ReturnType<typeof makeServices>;
