import { LoanController } from '../loan.controllers';
import { CreateLoanUseCase } from '@/application';
import { BrazilianStateCode } from '@/domain';
import type { FastifyReply, FastifyRequest } from 'fastify';

describe('LoanController', () => {
  let controller: LoanController;
  let mockCreateLoanUseCase: jest.Mocked<CreateLoanUseCase>;
  let mockRequest: Partial<FastifyRequest>;
  let mockReply: Partial<FastifyReply>;

  beforeEach(() => {
    mockCreateLoanUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<CreateLoanUseCase>;

    controller = new LoanController(mockCreateLoanUseCase);

    mockReply = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };
  });

  describe('createLoan', () => {
    it('calls use case with correct parameters', async () => {
      mockRequest = {
        body: {
          amountInCents: 1_000_000,
          uf: BrazilianStateCode.SP,
        },
      };

      mockCreateLoanUseCase.execute.mockResolvedValue({
        id: 'test-id',
        amountInCents: 1_000_000,
        uf: BrazilianStateCode.SP,
        createdAt: new Date(),
      });

      await controller.createLoan(mockRequest as FastifyRequest, mockReply as FastifyReply);

      expect(mockCreateLoanUseCase.execute).toHaveBeenCalledWith({
        amountInCents: 1_000_000,
        uf: BrazilianStateCode.SP,
      });
      expect(mockCreateLoanUseCase.execute).toHaveBeenCalledTimes(1);
    });

    it('returns status 201 on success', async () => {
      mockRequest = {
        body: {
          amountInCents: 500_000,
          uf: BrazilianStateCode.RJ,
        },
      };

      mockCreateLoanUseCase.execute.mockResolvedValue({
        id: 'loan-123',
        amountInCents: 500_000,
        uf: BrazilianStateCode.RJ,
        createdAt: new Date(),
      });

      await controller.createLoan(mockRequest as FastifyRequest, mockReply as FastifyReply);

      expect(mockReply.status).toHaveBeenCalledWith(201);
    });

    it('sends the use case result', async () => {
      const expectedResult = {
        id: 'loan-456',
        amountInCents: 1_500_000,
        uf: BrazilianStateCode.MG,
        createdAt: new Date(),
      };

      mockRequest = {
        body: {
          amountInCents: 1_500_000,
          uf: BrazilianStateCode.MG,
        },
      };

      mockCreateLoanUseCase.execute.mockResolvedValue(expectedResult);

      await controller.createLoan(mockRequest as FastifyRequest, mockReply as FastifyReply);

      expect(mockReply.send).toHaveBeenCalledWith(expectedResult);
    });

    it('validates request body with schema', async () => {
      mockRequest = {
        body: {
          amountInCents: -100,
          uf: BrazilianStateCode.SP,
        },
      };

      await expect(
        controller.createLoan(mockRequest as FastifyRequest, mockReply as FastifyReply)
      ).rejects.toThrow();

      expect(mockCreateLoanUseCase.execute).not.toHaveBeenCalled();
    });

    it('rejects invalid UF through schema validation', async () => {
      mockRequest = {
        body: {
          amountInCents: 1_000_000,
          uf: 'INVALID_UF',
        },
      };

      await expect(
        controller.createLoan(mockRequest as FastifyRequest, mockReply as FastifyReply)
      ).rejects.toThrow();

      expect(mockCreateLoanUseCase.execute).not.toHaveBeenCalled();
    });

    it('rejects missing amount', async () => {
      mockRequest = {
        body: {
          uf: BrazilianStateCode.SP,
        },
      };

      await expect(
        controller.createLoan(mockRequest as FastifyRequest, mockReply as FastifyReply)
      ).rejects.toThrow();

      expect(mockCreateLoanUseCase.execute).not.toHaveBeenCalled();
    });

    it('rejects missing uf', async () => {
      mockRequest = {
        body: {
          amountInCents: 1_000_000,
        },
      };

      await expect(
        controller.createLoan(mockRequest as FastifyRequest, mockReply as FastifyReply)
      ).rejects.toThrow();

      expect(mockCreateLoanUseCase.execute).not.toHaveBeenCalled();
    });

    it('propagates use case errors', async () => {
      mockRequest = {
        body: {
          amountInCents: 1_000_000,
          uf: BrazilianStateCode.SP,
        },
      };

      const error = new Error('Use case error');
      mockCreateLoanUseCase.execute.mockRejectedValue(error);

      await expect(
        controller.createLoan(mockRequest as FastifyRequest, mockReply as FastifyReply)
      ).rejects.toThrow('Use case error');
    });
  });
});
