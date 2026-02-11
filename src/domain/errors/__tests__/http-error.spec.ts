import { isHttpError } from '../http-error.interface';
import { ConcentrationLimitExceededError } from '../concentration-limit-exceeded.error';
import { InvalidUFError } from '../invalid-uf.error';
import { InvalidAmountError } from '../invalid-amount.error';

describe('HttpError Interface', () => {
  describe('isHttpError', () => {
    it('returns true for ConcentrationLimitExceededError', () => {
      const error = new ConcentrationLimitExceededError(
        'Concentration limit exceeded',
        'SP',
        0.25,
        0.2
      );
      expect(isHttpError(error)).toBe(true);
    });

    it('returns true for InvalidUFError', () => {
      const error = new InvalidUFError('XX');
      expect(isHttpError(error)).toBe(true);
    });

    it('returns true for InvalidAmountError', () => {
      const error = new InvalidAmountError(-100);
      expect(isHttpError(error)).toBe(true);
    });

    it('returns false for generic Error', () => {
      const error = new Error('Generic error');
      expect(isHttpError(error)).toBe(false);
    });

    it('returns false for non-error objects', () => {
      expect(isHttpError({})).toBe(false);
      expect(isHttpError(null)).toBe(false);
      expect(isHttpError(undefined)).toBe(false);
      expect(isHttpError('error')).toBe(false);
    });
  });

  describe('ConcentrationLimitExceededError', () => {
    it('has correct statusCode', () => {
      const error = new ConcentrationLimitExceededError('Test', 'SP', 0.25, 0.2);
      expect(error.statusCode).toBe(422);
    });

    it('toJSON returns correct format', () => {
      const error = new ConcentrationLimitExceededError(
        'Concentration limit exceeded for SP',
        'SP',
        0.25,
        0.2
      );
      const json = error.toJSON();

      expect(json).toEqual({
        error: 'Unprocessable Entity',
        message: 'Concentration limit exceeded for SP',
        details: {
          uf: 'SP',
          currentShare: '25.00%',
          limit: '20.00%',
        },
      });
    });
  });

  describe('InvalidUFError', () => {
    it('has correct statusCode', () => {
      const error = new InvalidUFError('XX');
      expect(error.statusCode).toBe(400);
    });

    it('toJSON returns correct format', () => {
      const error = new InvalidUFError('XX');
      const json = error.toJSON();

      expect(json).toEqual({
        error: 'Bad Request',
        message: 'Invalid UF: XX',
        details: {
          uf: 'XX',
        },
      });
    });
  });

  describe('InvalidAmountError', () => {
    it('has correct statusCode', () => {
      const error = new InvalidAmountError(-100);
      expect(error.statusCode).toBe(400);
    });

    it('toJSON returns correct format', () => {
      const error = new InvalidAmountError(0);
      const json = error.toJSON();

      expect(json).toEqual({
        error: 'Bad Request',
        message: 'Amount must be greater than 0, received: 0',
        details: {
          amount: 0,
        },
      });
    });
  });
});
