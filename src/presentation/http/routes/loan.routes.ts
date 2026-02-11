import { FastifyInstance } from 'fastify';
import { LoanController } from '../controllers/loan.controllers';
import { CreateLoanUseCase } from '@/application/use-cases/create-loan.use-case';
import { createLoanResponseSchema, createLoanSchema, errorResponseSchema } from '../schemas';

interface LoanRoutesOptions {
  createLoanUseCase: CreateLoanUseCase;
}

export async function loanRoutes(app: FastifyInstance, options: LoanRoutesOptions) {
  const LOAN_TAG = 'Loans';

  const { createLoanUseCase } = options;
  const loanController = new LoanController(createLoanUseCase);

  app.post(
    '/',
    {
      schema: {
        body: createLoanSchema,
        tags: [LOAN_TAG],
        summary: 'Criar novo empréstimo',
        description:
          'Cria um novo empréstimo com o valor e a UF fornecidos. O empréstimo será validado contra as regras de risco de concentração.',
        response: {
          201: createLoanResponseSchema.describe('Loan created successfully'),
          400: errorResponseSchema.describe('Bad Request - Invalid input data'),
          422: errorResponseSchema.describe('Unprocessable Entity - Concentration limit exceeded'),
          500: errorResponseSchema.describe('Internal Server Error'),
        },
      },
    },
    loanController.createLoan
  );
}
