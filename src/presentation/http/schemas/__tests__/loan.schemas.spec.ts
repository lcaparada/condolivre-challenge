import { BrazilianStateCode } from '@/domain/constants/brazilian-states';
import { createLoanSchema, createLoanResponseSchema } from '../loan.schemas';

describe('Loan Schemas', () => {
  describe('createLoanSchema', () => {
    it('validates valid loan input', () => {
      const validInput = {
        amountInCents: 1_000_000,
        uf: BrazilianStateCode.SP,
      };

      const result = createLoanSchema.safeParse(validInput);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.amountInCents).toBe(1_000_000);
        expect(result.data.uf).toBe(BrazilianStateCode.SP);
      }
    });

    it('validates all valid UFs', () => {
      Object.values(BrazilianStateCode).forEach((uf) => {
        const result = createLoanSchema.safeParse({
          amountInCents: 100_000,
          uf,
        });
        expect(result.success).toBe(true);
      });
    });

    it('rejects invalid UF', () => {
      const invalidInput = {
        amountInCents: 1_000_000,
        uf: 'XX',
      };

      const result = createLoanSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it('rejects negative amount', () => {
      const invalidInput = {
        amountInCents: -100,
        uf: BrazilianStateCode.RJ,
      };

      const result = createLoanSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it('rejects zero amount', () => {
      const invalidInput = {
        amountInCents: 0,
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
        amountInCents: 1_000_000,
      };

      const result = createLoanSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it('rejects non-number amount', () => {
      const invalidInput = {
        amountInCents: '10000',
        uf: BrazilianStateCode.SP,
      };

      const result = createLoanSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it('rejects decimal amounts', () => {
      const invalidInput = {
        amountInCents: 10_000.50,
        uf: BrazilianStateCode.MG,
      };

      const result = createLoanSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });
  });

  describe('createLoanResponseSchema', () => {
    it('validates valid loan response', () => {
      const validResponse = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        amountInCents: 1_000_000,
        uf: BrazilianStateCode.SP,
        createdAt: new Date('2024-01-15T10:00:00Z'),
      };

      const result = createLoanResponseSchema.safeParse(validResponse);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe('550e8400-e29b-41d4-a716-446655440000');
        expect(result.data.amountInCents).toBe(1_000_000);
        expect(result.data.uf).toBe(BrazilianStateCode.SP);
        expect(result.data.createdAt).toBeInstanceOf(Date);
      }
    });

    it('validates all valid UFs in response', () => {
      Object.values(BrazilianStateCode).forEach((uf) => {
        const result = createLoanResponseSchema.safeParse({
          id: 'test-id',
          amountInCents: 100_000,
          uf,
          createdAt: new Date(),
        });
        expect(result.success).toBe(true);
      });
    });

    it('rejects missing id', () => {
      const invalidResponse = {
        amountInCents: 1_000_000,
        uf: BrazilianStateCode.SP,
        createdAt: new Date(),
      };

      const result = createLoanResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });

    it('rejects missing amount', () => {
      const invalidResponse = {
        id: 'test-id',
        uf: BrazilianStateCode.SP,
        createdAt: new Date(),
      };

      const result = createLoanResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });

    it('rejects missing uf', () => {
      const invalidResponse = {
        id: 'test-id',
        amountInCents: 1_000_000,
        createdAt: new Date(),
      };

      const result = createLoanResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });

    it('rejects missing createdAt', () => {
      const invalidResponse = {
        id: 'test-id',
        amountInCents: 1_000_000,
        uf: BrazilianStateCode.SP,
      };

      const result = createLoanResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });

    it('rejects invalid UF in response', () => {
      const invalidResponse = {
        id: 'test-id',
        amountInCents: 1_000_000,
        uf: 'INVALID',
        createdAt: new Date(),
      };

      const result = createLoanResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });

    it('rejects decimal amounts in response', () => {
      const invalidResponse = {
        id: 'test-id',
        amountInCents: 100.50,
        uf: BrazilianStateCode.SP,
        createdAt: new Date(),
      };

      const result = createLoanResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });

    it('accepts any string as id', () => {
      const createdAt = new Date();
      const responses = [
        { id: 'uuid-format', amountInCents: 10_000, uf: BrazilianStateCode.AC, createdAt },
        { id: '123', amountInCents: 10_000, uf: BrazilianStateCode.AL, createdAt },
        { id: 'custom-id-123', amountInCents: 10_000, uf: BrazilianStateCode.AM, createdAt },
      ];

      responses.forEach((response) => {
        const result = createLoanResponseSchema.safeParse(response);
        expect(result.success).toBe(true);
      });
    });
  });
});
