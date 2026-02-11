import { makeRepositories } from '../make-repositories';
import { MongoLoanRepository } from '@/infrastructure/repositories/mongo-loan.repository';
import { MongoConcentrationLimitRepository } from '@/infrastructure/repositories/mongo-concentration-limit.repository';
import type { Db } from 'mongodb';

describe('makeRepositories', () => {
  let mockDb: Db;

  beforeEach(() => {
    mockDb = {
      collection: jest.fn().mockReturnValue({
        createIndex: jest.fn(),
        insertOne: jest.fn(),
        find: jest.fn(),
        aggregate: jest.fn(),
      }),
    } as unknown as Db;
  });

  it('creates and returns all repositories', () => {
    const repositories = makeRepositories(mockDb);

    expect(repositories).toHaveProperty('loanRepository');
    expect(repositories).toHaveProperty('concentrationLimitRepository');
  });

  it('creates LoanRepository instance', () => {
    const repositories = makeRepositories(mockDb);

    expect(repositories.loanRepository).toBeInstanceOf(MongoLoanRepository);
  });

  it('creates ConcentrationLimitRepository instance', () => {
    const repositories = makeRepositories(mockDb);

    expect(repositories.concentrationLimitRepository).toBeInstanceOf(
      MongoConcentrationLimitRepository
    );
  });

  it('passes db to repositories', () => {
    makeRepositories(mockDb);

    expect(mockDb.collection).toHaveBeenCalled();
  });

  it('returns object with exactly 2 repositories', () => {
    const repositories = makeRepositories(mockDb);

    expect(Object.keys(repositories)).toHaveLength(2);
  });

  it('creates new instances on each call', () => {
    const repositories1 = makeRepositories(mockDb);
    const repositories2 = makeRepositories(mockDb);

    expect(repositories1.loanRepository).not.toBe(repositories2.loanRepository);
    expect(repositories1.concentrationLimitRepository).not.toBe(
      repositories2.concentrationLimitRepository
    );
  });
});
