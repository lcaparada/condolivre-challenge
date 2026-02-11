import type { HttpError } from './http-error.interface';

export class ConcentrationLimitExceededError extends Error implements HttpError {
  public readonly statusCode = 422;

  constructor(
    message: string,
    public readonly uf: string,
    public readonly currentShare: number,
    public readonly limit: number
  ) {
    super(message);
    this.name = 'ConcentrationLimitExceededError';
  }

  toJSON() {
    return {
      error: 'Unprocessable Entity',
      message: this.message,
      details: {
        uf: this.uf,
        currentShare: `${(this.currentShare * 100).toFixed(2)}%`,
        limit: `${(this.limit * 100).toFixed(2)}%`,
      },
    };
  }
}
