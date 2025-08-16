import type { ErrorResponse } from './openai.js';

// Error types matching OpenAI's format
export const ErrorTypes = {
  INVALID_REQUEST: 'invalid_request_error',
  AUTHENTICATION: 'authentication_error',
  PERMISSION: 'permission_error',
  NOT_FOUND: 'not_found_error',
  RATE_LIMIT: 'rate_limit_error',
  API_ERROR: 'api_error',
  OVERLOADED: 'overloaded_error',
} as const;

export type ErrorType = typeof ErrorTypes[keyof typeof ErrorTypes];

export class APIError extends Error {
  public readonly type: ErrorType;
  public readonly param?: string | undefined;
  public readonly code?: string | undefined;
  public readonly statusCode: number;

  constructor(
    message: string,
    type: ErrorType,
    statusCode: number = 400,
    param?: string | undefined,
    code?: string | undefined
  ) {
    super(message);
    this.name = 'APIError';
    this.type = type;
    this.param = param;
    this.code = code;
    this.statusCode = statusCode;
  }

  toErrorResponse(): ErrorResponse {
    const error: any = {
      message: this.message,
      type: this.type,
    };
    
    if (this.param !== undefined) {
      error.param = this.param;
    }
    
    if (this.code !== undefined) {
      error.code = this.code;
    }
    
    return { error };
  }
}

// Specific error classes
export class InvalidRequestError extends APIError {
  constructor(message: string, param?: string) {
    super(message, ErrorTypes.INVALID_REQUEST, 400, param);
  }
}

export class AuthenticationError extends APIError {
  constructor(message: string = 'Invalid API key') {
    super(message, ErrorTypes.AUTHENTICATION, 401);
  }
}

export class NotFoundError extends APIError {
  constructor(message: string) {
    super(message, ErrorTypes.NOT_FOUND, 404);
  }
}

export class InternalServerError extends APIError {
  constructor(message: string = 'Internal server error') {
    super(message, ErrorTypes.API_ERROR, 500);
  }
}