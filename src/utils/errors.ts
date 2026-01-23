export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 500,
    public readonly code?: string
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

export class FigmaApiError extends AppError {
  constructor(message: string, statusCode: number = 500, public readonly retryAfter?: number) {
    super(message, statusCode, 'FIGMA_API_ERROR');
  }
}

export class RateLimitError extends AppError {
  constructor(message: string, public readonly retryAfter?: number) {
    super(message, 429, 'RATE_LIMIT_ERROR');
  }
}

export class ConfigurationError extends AppError {
  constructor(message: string) {
    super(message, 500, 'CONFIGURATION_ERROR');
  }
}

export function handleError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    return new AppError(error.message, 500, 'INTERNAL_ERROR');
  }

  return new AppError('An unknown error occurred', 500, 'UNKNOWN_ERROR');
}


