import { BrazilianStateCode } from '@/domain';
import { z } from 'zod';

export const createLoanSchema = z.object({
  amountInCents: z.number().int().positive(),
  uf: z.nativeEnum(BrazilianStateCode),
});

export const createLoanResponseSchema = z.object({
  id: z.string(),
  amountInCents: z.number().int(),
  uf: z.nativeEnum(BrazilianStateCode),
  createdAt: z.date(),
});
