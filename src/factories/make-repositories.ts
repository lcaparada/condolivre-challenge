import { MongoConcentrationLimitRepository, MongoLoanRepository } from '@/infrastructure';
import type { Db } from 'mongodb';

export function makeRepositories(db: Db) {
  const loanRepository = new MongoLoanRepository(db);
  const concentrationLimitRepository = new MongoConcentrationLimitRepository(db);

  return {
    loanRepository,
    concentrationLimitRepository,
  };
}

export type Repositories = ReturnType<typeof makeRepositories>;
