import { BrazilianStateCode } from '@/domain/constants/brazilian-states';
import { createLoanSchema, createLoanResponseSchema } from '../loan.schemas';

describe('Loan Schemas', () => {
  describe('createLoanSchema', () => {
    it('validates valid loan input', () => {
      const validInput = {
        amount: 10_000,
        uf: BrazilianStateCode.SP,
      };

      const result = createLoanSchema.safeParse(validInput);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.amount).toBe(10_000);
        expect(result.data.uf).toBe(BrazilianStateCode.SP);
      }
    });

    it('validates all valid UFs', () => {
      Object.values(BrazilianStateCode).forEach((uf) => {
        const result = createLoanSchema.safeParse({
          amount: 1_000,
          uf,
        });
        expect(result.success).toBe(true);
      });
    });

    it('rejects invalid UF', () => {
      const invalidInput = {
        amount: 10_000,
        uf: 'XX',
      };

      const result = createLoanSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it('rejects negative amount', () => {
      const invalidInput = {
        amount: -100,
        uf: BrazilianStateCode.RJ,
      };

      const result = createLoanSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it('rejects zero amount', () => {
      const invalidInput = {
        amount: 0,
        uf: BrazilianStateCode.SP,
      };

      const result = createLoanSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it('rejects missing amount', () => {
      const invalidInput = {
        uf: BrazilianStateCode.SP,
      };

      const result = createLoanSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it('rejects missing uf', () => {
      const invalidInput = {
        amount: 10_000,
      };

      const result = createLoanSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it('rejects non-number amount', () => {
      const invalidInput = {
        amount: '10000',
        uf: BrazilianStateCode.SP,
      };

      const result = createLoanSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it('accepts decimal amounts', () => {
      const validInput = {
        amount: 10_000.50,
        uf: BrazilianStateCode.MG,
      };

      const result = createLoanSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });
  });

  describe('createLoanResponseSchema', () => {
    it('validates valid loan response', () => {
      const validResponse = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        amount: 10_000,
        uf: BrazilianStateCode.SP,
      };

      const result = createLoanResponseSchema.safeParse(validResponse);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe('550e8400-e29b-41d4-a716-446655440000');
        expect(result.data.amount).toBe(10_000);
        expect(result.data.uf).toBe(BrazilianStateCode.SP);
      }
    });

    it('validates all valid UFs in response', () => {
      Object.values(BrazilianStateCode).forEach((uf) => {
        const result = createLoanResponseSchema.safeParse({
          id: 'test-id',
          amount: 1_000,
          uf,
        });
        expect(result.success).toBe(true);
      });
    });

    it('rejects missing id', () => {
      const invalidResponse = {
        amount: 10_000,
        uf: BrazilianStateCode.SP,
      };

      const result = createLoanResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });

    it('rejects missing amount', () => {
      const invalidResponse = {
        id: 'test-id',
        uf: BrazilianStateCode.SP,
      };

      const result = createLoanResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });

    it('rejects missing uf', () => {
      const invalidResponse = {
        id: 'test-id',
        amount: 10_000,
      };

      const result = createLoanResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });

    it('rejects invalid UF in response', () => {
      const invalidResponse = {
        id: 'test-id',
        amount: 10_000,
        uf: 'INVALID',
      };

      const result = createLoanResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });

    it('accepts any string as id', () => {
      const responses = [
        { id: 'uuid-format', amount: 100, uf: BrazilianStateCode.AC },
        { id: '123', amount: 100, uf: BrazilianStateCode.AL },
        { id: 'custom-id-123', amount: 100, uf: BrazilianStateCode.AM },
      ];

      responses.forEach((response) => {
        const result = createLoanResponseSchema.safeParse(response);
        expect(result.success).toBe(true);
      });
    });
  });
});
