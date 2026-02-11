import { Db } from 'mongodb';
import { LoanEntity } from '../../../domain/entities/loan.entity';
import { connectToDatabase, disconnectFromDatabase } from '../../database/mongodb/mongo-connection';
import { MongoLoanRepository } from '../mongo-loan.repository';

describe('MongoLoanRepository', () => {
  let db: Db;
  let repository: MongoLoanRepository;

  beforeAll(async () => {
    db = await connectToDatabase();
  });

  afterAll(async () => {
    await disconnectFromDatabase();
  });

  beforeEach(async () => {
    repository = new MongoLoanRepository(db);
    await db.collection('loans').deleteMany({});
  });

  describe('save', () => {
    it('saves a loan to the database', async () => {
      const loan = new LoanEntity({ amount: 10_000, uf: 'SP' });

      const savedLoan = await repository.save(loan);

      expect(savedLoan).toBeInstanceOf(LoanEntity);
      expect(savedLoan.amount).toBe(10_000);
      expect(savedLoan.uf).toBe('SP');
      expect(savedLoan.id).toBeDefined();

      const count = await db.collection('loans').countDocuments({});
      expect(count).toBe(1);
    });

    it('saves multiple loans', async () => {
      const loan1 = new LoanEntity({ amount: 5_000, uf: 'RJ' });
      const loan2 = new LoanEntity({ amount: 8_000, uf: 'SP' });

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
      await repository.save(new LoanEntity({ amount: 10_000, uf: 'SP' }));
      await repository.save(new LoanEntity({ amount: 5_000, uf: 'RJ' }));
      await repository.save(new LoanEntity({ amount: 3_000, uf: 'MG' }));

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
      await repository.save(new LoanEntity({ amount: 10_000, uf: 'SP' }));
      await repository.save(new LoanEntity({ amount: 5_000, uf: 'RJ' }));
      await repository.save(new LoanEntity({ amount: 3_000, uf: 'SP' }));

      const amountByState = await repository.getAmountByState();

      expect(amountByState).toEqual({
        SP: 13_000,
        RJ: 5_000,
      });
    });

    it('handles multiple states correctly', async () => {
      await repository.save(new LoanEntity({ amount: 1_000, uf: 'AC' }));
      await repository.save(new LoanEntity({ amount: 2_000, uf: 'BA' }));
      await repository.save(new LoanEntity({ amount: 3_000, uf: 'CE' }));
      await repository.save(new LoanEntity({ amount: 4_000, uf: 'BA' }));

      const amountByState = await repository.getAmountByState();

      expect(amountByState).toEqual({
        AC: 1_000,
        BA: 6_000,
        CE: 3_000,
      });
    });
  });
});
