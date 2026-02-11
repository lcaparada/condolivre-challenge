import { BrazilianStateCode } from '@/domain';
import { z } from 'zod';

export const createLoanSchema = z.object({
  amount: z.number().positive(),
  uf: z.enum(BrazilianStateCode),
});

export const createLoanResponseSchema = z.object({
  id: z.string(),
  amount: z.number(),
  uf: z.enum(BrazilianStateCode),
});
