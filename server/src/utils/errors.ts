export class HttpError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code: string = "INTERNAL_SERVER_ERROR"
  ) {
    super(message);
  }
}

export function isHttpError(error: unknown): error is HttpError {
  return error instanceof HttpError;
}
