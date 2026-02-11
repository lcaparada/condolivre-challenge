import { LoanEntity } from '../loan.entity';

describe('LoanEntity', () => {
  describe('when created with valid props', () => {
    it('creates entity with amount and uf', () => {
      const loan = new LoanEntity({ amount: 10_000, uf: 'SP' });

      expect(loan.amount).toBe(10_000);
      expect(loan.uf).toBe('SP');
    });

    it('exposes id', () => {
      const loan = new LoanEntity({ amount: 1_000, uf: 'RJ' });

      expect(loan.id).toBeDefined();
      expect(typeof loan.id).toBe('string');
    });

    it('accepts optional id', () => {
      const loan = new LoanEntity({ amount: 1_000, uf: 'MG' }, 'custom-id');

      expect(loan.id).toBe('custom-id');
    });

    it('toJSON returns id, amount and uf', () => {
      const loan = new LoanEntity({ amount: 15_000, uf: 'PR' }, 'loan-123');

      expect(loan.toJSON()).toEqual({
        id: 'loan-123',
        amount: 15_000,
        uf: 'PR',
      });
    });
  });

  describe('when created with invalid amount', () => {
    it('throws when amount is zero', () => {
      expect(() => new LoanEntity({ amount: 0, uf: 'SP' })).toThrow(
        'Amount must be greater than 0'
      );
    });

    it('throws when amount is negative', () => {
      expect(() => new LoanEntity({ amount: -100, uf: 'RJ' })).toThrow(
        'Amount must be greater than 0'
      );
    });
  });

  describe('when created with invalid UF', () => {
    it('throws for invalid state code', () => {
      expect(() => new LoanEntity({ amount: 1_000, uf: 'XX' } as never)).toThrow(
        'Invalid UF: "XX"'
      );
    });

    it('throws for empty string', () => {
      expect(() => new LoanEntity({ amount: 1_000, uf: '' } as never)).toThrow('Invalid UF');
    });
  });
});
