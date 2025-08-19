import { Context, Next } from 'hono';
import { AuthenticationError } from '../openai-protocol/errors.js';
import type { Authenticator } from '../auth/authenticator.js';

export function createAuthMiddleware(authenticator: Authenticator) {
  return async (c: Context, next: Next) => {
    // Skip auth for health check
    if (c.req.path === '/health') {
      await next();
      return;
    }

    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      throw new AuthenticationError('No authorization header provided');
    }

    const bearerPrefix = 'Bearer ';
    if (!authHeader.startsWith(bearerPrefix)) {
      throw new AuthenticationError('Invalid authorization header format. Expected "Bearer <token>"');
    }

    const token = authHeader.slice(bearerPrefix.length);
    const isValid = await authenticator.validateApiKey(token);
    if (!isValid) {
      throw new AuthenticationError('Invalid API key');
    }

    await next();
  };
}