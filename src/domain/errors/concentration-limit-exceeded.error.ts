export class ConcentrationLimitExceededError extends Error {
  constructor(
    message: string,
    public readonly uf: string,
    public readonly currentShare: number,
    public readonly limit: number
  ) {
    super(message);
    this.name = 'ConcentrationLimitExceededError';
  }
}
