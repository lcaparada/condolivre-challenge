import { FastifyInstance } from 'fastify';
import { loanRoutes } from './loan.routes';
import { UseCases } from '@/factories';

export const registerRoutes = async (app: FastifyInstance, useCases: UseCases) => {
  await app.register(loanRoutes, {
    createLoanUseCase: useCases.createLoanUseCase,
    prefix: 'api/v1/loans',
  });
};
