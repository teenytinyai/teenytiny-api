import { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { APIError } from '../types/errors.js';

export function createErrorHandler() {
  return async (err: Error, c: Context) => {
    console.error('Request error:', err);

    // Handle APIError instances
    if (err instanceof APIError) {
      return c.json(err.toErrorResponse(), err.statusCode as any);
    }

    // Handle Hono HTTP exceptions
    if (err instanceof HTTPException) {
      return c.json(
        {
          error: {
            message: err.message,
            type: 'api_error',
          },
        },
        err.status
      );
    }

    // Handle unknown errors
    return c.json(
      {
        error: {
          message: 'Internal server error',
          type: 'api_error',
        },
      },
      500
    );
  };
}