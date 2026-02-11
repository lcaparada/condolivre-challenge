export interface HttpError extends Error {
  statusCode: number;
  toJSON(): {
    error: string;
    message: string;
    details?: unknown;
  };
}

export function isHttpError(error: unknown): error is HttpError {
  return (
    error instanceof Error &&
    'statusCode' in error &&
    'toJSON' in error &&
    typeof (error as Record<string, unknown>).statusCode === 'number' &&
    typeof (error as Record<string, unknown>).toJSON === 'function'
  );
}
