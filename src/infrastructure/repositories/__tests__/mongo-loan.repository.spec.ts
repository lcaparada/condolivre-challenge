import { Db } from 'mongodb';
import { MongoLoanRepository } from '../mongo-loan.repository';
import {
  connectToDatabase,
  disconnectFromDatabase,
} from '@/infrastructure/database/mongodb/mongo-connection';
import { BrazilianStateCode, LoanEntity } from '@/domain';

describe('MongoLoanRepository', () => {
  let db: Db;
  let repository: MongoLoanRepository;

  beforeAll(async () => {
    db = await connectToDatabase();
  }, 15000);

  afterAll(async () => {
    await disconnectFromDatabase();
  });

  beforeEach(async () => {
    repository = new MongoLoanRepository(db);
    await db.collection('loans').deleteMany({});

    try {
      await db.collection('loans').dropIndexes();
    } catch {
      // Ignore error if collection doesn't exist yet
    }

    await repository.ensureIndexes();
  });

  describe('ensureIndexes', () => {
    it('creates compound index on uf and amountInCents', async () => {
      await repository.ensureIndexes();

      const indexes = await db.collection('loans').indexes();
      const compoundIndex = indexes.find((idx) => idx.name === 'uf_amount_idx');

      expect(compoundIndex).toBeDefined();
      expect(compoundIndex?.key).toEqual({ uf: 1, amountInCents: 1 });
    });

    it('creates index on createdAt field', async () => {
      await repository.ensureIndexes();

      const indexes = await db.collection('loans').indexes();
      const createdAtIndex = indexes.find(
        (idx) => idx.key.createdAt === 1 && Object.keys(idx.key).length === 1
      );

      expect(createdAtIndex).toBeDefined();
    });

    it('is idempotent - can be called multiple times without error', async () => {
      await repository.ensureIndexes();

      await expect(repository.ensureIndexes()).resolves.not.toThrow();

      await expect(repository.ensureIndexes()).resolves.not.toThrow();
    });

    it('removes old index with conflicting name and creates new one', async () => {
      try {
        await db.collection('loans').dropIndexes();
      } catch {
        // Ignora se não existir
      }

      await db.collection('loans').createIndex({ uf: 1, amount: 1 }, { name: 'uf_amount_idx' });

      let indexes = await db.collection('loans').indexes();
      const oldIndex = indexes.find((idx) => idx.name === 'uf_amount_idx');
      expect(oldIndex?.key).toHaveProperty('amount');

      await repository.ensureIndexes();

      indexes = await db.collection('loans').indexes();
      const newIndex = indexes.find((idx) => idx.name === 'uf_amount_idx');
      expect(newIndex?.key).toEqual({ uf: 1, amountInCents: 1 });
      expect(newIndex?.key).not.toHaveProperty('amount');
    });
  });

  describe('save', () => {
    it('saves a loan to the database', async () => {
      const loan = new LoanEntity({ amountInCents: 1_000_000, uf: BrazilianStateCode.SP });

      const savedLoan = await repository.save(loan);

      expect(savedLoan).toBeInstanceOf(LoanEntity);
      expect(savedLoan.amountInCents).toBe(1_000_000);
      expect(savedLoan.uf).toBe(BrazilianStateCode.SP);
      expect(savedLoan.id).toBeDefined();
      expect(savedLoan.createdAt).toBeInstanceOf(Date);

      const count = await db.collection('loans').countDocuments({});
      expect(count).toBe(1);
    });

    it('saves multiple loans', async () => {
      const loan1 = new LoanEntity({ amountInCents: 500_000, uf: BrazilianStateCode.RJ });
      const loan2 = new LoanEntity({ amountInCents: 800_000, uf: BrazilianStateCode.SP });

      await repository.save(loan1);
      await repository.save(loan2);

      const count = await db.collection('loans').countDocuments({});
      expect(count).toBe(2);
    });
  });

  describe('getTotalAmount', () => {
    it('returns 0 when there are no loans', async () => {
      const total = await repository.getTotalAmount();

      expect(total).toBe(0);
    });

    it('returns the sum of all loan amounts', async () => {
      await repository.save(
        new LoanEntity({ amountInCents: 1_000_000, uf: BrazilianStateCode.SP })
      );
      await repository.save(new LoanEntity({ amountInCents: 500_000, uf: BrazilianStateCode.RJ }));
      await repository.save(new LoanEntity({ amountInCents: 300_000, uf: BrazilianStateCode.MG }));

      const total = await repository.getTotalAmount();

      expect(total).toBe(1_800_000);
    });
  });

  describe('getAmountByState', () => {
    it('returns empty object when there are no loans', async () => {
      const amountByState = await repository.getAmountByState();

      expect(amountByState).toEqual({});
    });

    it('returns amounts grouped by state', async () => {
      await repository.save(
        new LoanEntity({ amountInCents: 1_000_000, uf: BrazilianStateCode.SP })
      );
      await repository.save(new LoanEntity({ amountInCents: 500_000, uf: BrazilianStateCode.RJ }));
      await repository.save(new LoanEntity({ amountInCents: 300_000, uf: BrazilianStateCode.SP }));

      const amountByState = await repository.getAmountByState();

      expect(amountByState).toEqual({
        SP: 1_300_000,
        RJ: 500_000,
      });
    });

    it('handles multiple states correctly', async () => {
      await repository.save(new LoanEntity({ amountInCents: 100_000, uf: BrazilianStateCode.AC }));
      await repository.save(new LoanEntity({ amountInCents: 200_000, uf: BrazilianStateCode.BA }));
      await repository.save(new LoanEntity({ amountInCents: 300_000, uf: BrazilianStateCode.CE }));
      await repository.save(new LoanEntity({ amountInCents: 400_000, uf: BrazilianStateCode.BA }));

      const amountByState = await repository.getAmountByState();

      expect(amountByState).toEqual({
        AC: 100_000,
        BA: 600_000,
        CE: 300_000,
      });
    });
  });
});
