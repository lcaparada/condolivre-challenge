import { FastifyInstance } from 'fastify';
import { loanRoutes } from './loan.routes';
import { healthRoutes } from './health.routes';
import { UseCases } from '@/factories';

export const registerRoutes = async (app: FastifyInstance, useCases: UseCases) => {
  // Health check (sem prefixo)
  await app.register(healthRoutes);

  // Rotas da API
  await app.register(loanRoutes, {
    createLoanUseCase: useCases.createLoanUseCase,
    prefix: '/api/v1/loans',
  });
};
