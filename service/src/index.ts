// Cloudflare Worker entry point
import { createApp } from './app.js';

// Environment interface for Cloudflare Workers
export interface Env {
  API_KEY?: string;
}

// Create the app instance
const app = createApp({
  auth: {
    apiKey: 'will-be-replaced-by-env', // This will be replaced by the actual handler
  },
});

// Export the fetch handler for Cloudflare Workers
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // Update the auth config with the environment variable
    const appWithEnv = createApp({
      auth: {
        apiKey: env.API_KEY || 'tt-1234567890abcdef',
      },
    });

    return appWithEnv.fetch(request, env, ctx);
  },
};

// Export the app for other use cases
export { app };