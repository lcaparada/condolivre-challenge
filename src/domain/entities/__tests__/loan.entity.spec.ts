import { BrazilianStateCode } from '@/domain/constants/brazilian-states';
import { LoanEntity } from '../loan.entity';

describe('LoanEntity', () => {
  describe('when created with valid props', () => {
    it('creates entity with amountInCents and uf', () => {
      const loan = new LoanEntity({ amountInCents: 1_000_000, uf: BrazilianStateCode.SP });

      expect(loan.amountInCents).toBe(1_000_000);
      expect(loan.uf).toBe('SP');
    });

    it('exposes id', () => {
      const loan = new LoanEntity({ amountInCents: 100_000, uf: BrazilianStateCode.RJ });

      expect(loan.id).toBeDefined();
      expect(typeof loan.id).toBe('string');
    });

    it('accepts optional id', () => {
      const loan = new LoanEntity({ amountInCents: 100_000, uf: BrazilianStateCode.MG }, 'custom-id');

      expect(loan.id).toBe('custom-id');
    });

    it('generates createdAt automatically if not provided', () => {
      const before = new Date();
      const loan = new LoanEntity({ amountInCents: 1_500_000, uf: BrazilianStateCode.PR });
      const after = new Date();

      expect(loan.createdAt).toBeInstanceOf(Date);
      expect(loan.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(loan.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('accepts provided createdAt', () => {
      const customDate = new Date('2024-01-15T10:00:00Z');
      const loan = new LoanEntity({
        amountInCents: 1_000_000,
        uf: BrazilianStateCode.SP,
        createdAt: customDate,
      });

      expect(loan.createdAt).toEqual(customDate);
    });

    it('toJSON returns id, amountInCents, uf and createdAt', () => {
      const customDate = new Date('2024-01-15T10:00:00Z');
      const loan = new LoanEntity(
        {
          amountInCents: 1_500_000,
          uf: BrazilianStateCode.PR,
          createdAt: customDate,
        },
        'loan-123'
      );

      expect(loan.toJSON()).toEqual({
        id: 'loan-123',
        amountInCents: 1_500_000,
        uf: 'PR',
        createdAt: customDate,
      });
    });
  });

  describe('when created with invalid amount', () => {
    it('throws when amount is zero', () => {
      expect(() => new LoanEntity({ amountInCents: 0, uf: BrazilianStateCode.SP })).toThrow(
        'Amount must be greater than 0, received: 0'
      );
    });

    it('throws when amount is negative', () => {
      expect(() => new LoanEntity({ amountInCents: -100, uf: BrazilianStateCode.RJ })).toThrow(
        'Amount must be greater than 0, received: -100'
      );
    });

    it('throws when amount is not an integer', () => {
      expect(() => new LoanEntity({ amountInCents: 100.50, uf: BrazilianStateCode.RJ })).toThrow(
        'Amount must be greater than 0, received: 100.5'
      );
    });
  });

  describe('when created with invalid UF', () => {
    it('throws for invalid state code', () => {
      expect(() => new LoanEntity({ amountInCents: 100_000, uf: 'XX' } as never)).toThrow(
        'Invalid UF: XX'
      );
    });

    it('throws for empty string', () => {
      expect(() => new LoanEntity({ amountInCents: 100_000, uf: '' } as never)).toThrow(
        'Invalid UF'
      );
    });
  });
});
