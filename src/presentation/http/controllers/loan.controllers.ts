import { FastifyReply, FastifyRequest } from 'fastify';
import { createLoanSchema } from '../schemas';
import { CreateLoanUseCase } from '@/application';

export class LoanController {
  constructor(private readonly createLoanUseCase: CreateLoanUseCase) {}

  createLoan = async (req: FastifyRequest, rep: FastifyReply) => {
    const { amount, uf } = createLoanSchema.parse(req.body);
    const loan = await this.createLoanUseCase.execute({ amount, uf });
    return rep.status(201).send(loan);
  };
}
