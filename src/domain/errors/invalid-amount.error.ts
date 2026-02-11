import type { HttpError } from './http-error.interface';

export class InvalidAmountError extends Error implements HttpError {
  public readonly statusCode = 400;

  constructor(public readonly amount: number) {
    super(`Amount must be greater than 0, received: ${amount}`);
    this.name = 'InvalidAmountError';
  }

  toJSON() {
    return {
      error: 'Bad Request',
      message: this.message,
      details: {
        amount: this.amount,
      },
    };
  }
}
