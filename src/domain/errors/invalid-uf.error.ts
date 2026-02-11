import type { HttpError } from './http-error.interface';

export class InvalidUFError extends Error implements HttpError {
  public readonly statusCode = 400;

  constructor(public readonly uf: string) {
    super(`Invalid UF: ${uf}`);
    this.name = 'InvalidUFError';
  }

  toJSON() {
    return {
      error: 'Bad Request',
      message: this.message,
      details: {
        uf: this.uf,
      },
    };
  }
}
