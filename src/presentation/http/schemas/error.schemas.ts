import { z } from 'zod';

export const errorResponseSchema = z.object({
  error: z.string().describe('Error type/category'),
  message: z.string().describe('Human-readable error message'),
  details: z.record(z.string(), z.unknown()).optional().describe('Additional error context'),
});
