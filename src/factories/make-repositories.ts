import type { Db } from 'mongodb';
import { MongoLoanRepository } from '@/infrastructure/repositories/mongo-loan.repository';
import { MongoConcentrationLimitRepository } from '@/infrastructure/repositories/mongo-concentration-limit.repository';

export function makeRepositories(db: Db) {
  const loanRepository = new MongoLoanRepository(db);
  const concentrationLimitRepository = new MongoConcentrationLimitRepository(db);

  return {
    loanRepository,
    concentrationLimitRepository,
  };
}

export type Repositories = ReturnType<typeof makeRepositories>;
