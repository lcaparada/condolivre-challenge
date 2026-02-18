import { FastifyReply, FastifyRequest } from 'fastify';
import type { z } from 'zod';
import { createLoanSchema } from '../schemas';
import { CreateLoanUseCase } from '@/application';

type CreateLoanBody = z.infer<typeof createLoanSchema>;

export class LoanController {
  constructor(private readonly createLoanUseCase: CreateLoanUseCase) {}

  createLoan = async (req: FastifyRequest<{ Body: CreateLoanBody }>, rep: FastifyReply) => {
    const loan = await this.createLoanUseCase.execute(req.body);
    return rep.status(201).send(loan);
  };
}
