import { Context, Next } from 'hono';
import { AuthenticationError } from '../openai-protocol/errors.js';

export interface AuthConfig {
  apiKey: string;
}

export function createAuthMiddleware(config: AuthConfig) {
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
    if (token !== config.apiKey) {
      throw new AuthenticationError('Invalid API key');
    }

    await next();
  };
}