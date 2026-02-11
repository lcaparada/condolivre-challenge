import { FastifyInstance } from 'fastify';
import Fastify from 'fastify';
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod';
import { BrazilianStateCode } from '@/domain';
import { CreateLoanUseCase } from '@/application';
import { ConcentrationLimitExceededError } from '@/domain/errors/concentration-limit-exceeded.error';
import { errorHandlerPlugin } from '../../plugins/error-handler.plugin';
import { loanRoutes } from '../loan.routes';

describe('Loan Routes', () => {
  let app: FastifyInstance;
  let mockCreateLoanUseCase: jest.Mocked<CreateLoanUseCase>;

  beforeEach(async () => {
    mockCreateLoanUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<CreateLoanUseCase>;

    app = Fastify({
      logger: false,
    }).withTypeProvider<ZodTypeProvider>();

    app.setValidatorCompiler(validatorCompiler);
    app.setSerializerCompiler(serializerCompiler);

    await app.register(errorHandlerPlugin);
    await app.register(loanRoutes, {
      createLoanUseCase: mockCreateLoanUseCase,
    });
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /', () => {
    it('returns 201 and loan when request is valid', async () => {
      const createdLoan = {
        id: 'loan-123',
        amountInCents: 1_000_000,
        uf: BrazilianStateCode.SP,
        createdAt: new Date('2024-01-15T10:00:00Z'),
      };

      mockCreateLoanUseCase.execute.mockResolvedValue(createdLoan);

      const response = await app.inject({
        method: 'POST',
        url: '/',
        payload: {
          amountInCents: 1_000_000,
          uf: 'SP',
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body).toMatchObject({
        id: 'loan-123',
        amountInCents: 1_000_000,
        uf: 'SP',
      });
      expect(body).toHaveProperty('createdAt');
      expect(mockCreateLoanUseCase.execute).toHaveBeenCalledWith({
        amountInCents: 1_000_000,
        uf: 'SP',
      });
    });

    it('returns 400 when amountInCents is missing', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/',
        payload: {
          uf: 'SP',
        },
      });

      expect(response.statusCode).toBe(400);
      expect(mockCreateLoanUseCase.execute).not.toHaveBeenCalled();
    });

    it('returns 400 when uf is missing', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/',
        payload: {
          amountInCents: 1_000_000,
        },
      });

      expect(response.statusCode).toBe(400);
      expect(mockCreateLoanUseCase.execute).not.toHaveBeenCalled();
    });

    it('returns 400 when amountInCents is negative', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/',
        payload: {
          amountInCents: -100,
          uf: 'SP',
        },
      });

      expect(response.statusCode).toBe(400);
      expect(mockCreateLoanUseCase.execute).not.toHaveBeenCalled();
    });

    it('returns 400 when uf is invalid', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/',
        payload: {
          amountInCents: 1_000_000,
          uf: 'XX',
        },
      });

      expect(response.statusCode).toBe(400);
      expect(mockCreateLoanUseCase.execute).not.toHaveBeenCalled();
    });

    it('returns 422 when concentration limit is exceeded', async () => {
      mockCreateLoanUseCase.execute.mockRejectedValue(
        new ConcentrationLimitExceededError('Concentration limit exceeded for RJ', 'RJ', 0.12, 0.1)
      );

      const response = await app.inject({
        method: 'POST',
        url: '/',
        payload: {
          amountInCents: 5_000_000,
          uf: 'RJ',
        },
      });

      expect(response.statusCode).toBe(422);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('error', 'Unprocessable Entity');
      expect(body).toHaveProperty('message');
      if (body.details) {
        expect(body.details).toHaveProperty('uf', 'RJ');
      }
    });

    it('returns 500 when use case throws unexpected error', async () => {
      mockCreateLoanUseCase.execute.mockRejectedValue(new Error('Database connection failed'));

      const response = await app.inject({
        method: 'POST',
        url: '/',
        payload: {
          amountInCents: 1_000_000,
          uf: 'SP',
        },
      });

      expect(response.statusCode).toBe(500);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('error', 'Internal Server Error');
      expect(body).toHaveProperty('message');
    });

    it('accepts all valid Brazilian state codes', async () => {
      mockCreateLoanUseCase.execute.mockResolvedValue({
        id: 'loan-id',
        amountInCents: 100_000,
        uf: BrazilianStateCode.MG,
        createdAt: new Date(),
      });

      const response = await app.inject({
        method: 'POST',
        url: '/',
        payload: {
          amountInCents: 100_000,
          uf: 'MG',
        },
      });

      expect(response.statusCode).toBe(201);
      expect(mockCreateLoanUseCase.execute).toHaveBeenCalledWith({
        amountInCents: 100_000,
        uf: 'MG',
      });
    });
  });
});
