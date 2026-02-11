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
    await repository.ensureIndexes();
  });

  describe('ensureIndexes', () => {
    it('creates indexes on uf field', async () => {
      await repository.ensureIndexes();

      const indexes = await db.collection('loans').indexes();
      const ufIndex = indexes.find((idx) => idx.key.uf === 1 && Object.keys(idx.key).length === 1);

      expect(ufIndex).toBeDefined();
    });

    it('creates compound index on uf and amount', async () => {
      await repository.ensureIndexes();

      const indexes = await db.collection('loans').indexes();
      const compoundIndex = indexes.find((idx) => idx.name === 'uf_amount_idx');

      expect(compoundIndex).toBeDefined();
      expect(compoundIndex?.key).toEqual({ uf: 1, amount: 1 });
    });
  });

  describe('save', () => {
    it('saves a loan to the database', async () => {
      const loan = new LoanEntity({ amount: 10_000, uf: BrazilianStateCode.SP });

      const savedLoan = await repository.save(loan);

      expect(savedLoan).toBeInstanceOf(LoanEntity);
      expect(savedLoan.amount).toBe(10_000);
      expect(savedLoan.uf).toBe(BrazilianStateCode.SP);
      expect(savedLoan.id).toBeDefined();

      const count = await db.collection('loans').countDocuments({});
      expect(count).toBe(1);
    });

    it('saves multiple loans', async () => {
      const loan1 = new LoanEntity({ amount: 5_000, uf: BrazilianStateCode.RJ });
      const loan2 = new LoanEntity({ amount: 8_000, uf: BrazilianStateCode.SP });

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
      await repository.save(new LoanEntity({ amount: 10_000, uf: BrazilianStateCode.SP }));
      await repository.save(new LoanEntity({ amount: 5_000, uf: BrazilianStateCode.RJ }));
      await repository.save(new LoanEntity({ amount: 3_000, uf: BrazilianStateCode.MG }));

      const total = await repository.getTotalAmount();

      expect(total).toBe(18_000);
    });
  });

  describe('getAmountByState', () => {
    it('returns empty object when there are no loans', async () => {
      const amountByState = await repository.getAmountByState();

      expect(amountByState).toEqual({});
    });

    it('returns amounts grouped by state', async () => {
      await repository.save(new LoanEntity({ amount: 10_000, uf: BrazilianStateCode.SP }));
      await repository.save(new LoanEntity({ amount: 5_000, uf: BrazilianStateCode.RJ }));
      await repository.save(new LoanEntity({ amount: 3_000, uf: BrazilianStateCode.SP }));

      const amountByState = await repository.getAmountByState();

      expect(amountByState).toEqual({
        SP: 13_000,
        RJ: 5_000,
      });
    });

    it('handles multiple states correctly', async () => {
      await repository.save(new LoanEntity({ amount: 1_000, uf: BrazilianStateCode.AC }));
      await repository.save(new LoanEntity({ amount: 2_000, uf: BrazilianStateCode.BA }));
      await repository.save(new LoanEntity({ amount: 3_000, uf: BrazilianStateCode.CE }));
      await repository.save(new LoanEntity({ amount: 4_000, uf: BrazilianStateCode.BA }));

      const amountByState = await repository.getAmountByState();

      expect(amountByState).toEqual({
        AC: 1_000,
        BA: 6_000,
        CE: 3_000,
      });
    });
  });
});
