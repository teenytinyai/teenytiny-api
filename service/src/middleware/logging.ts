import { Context, Next } from 'hono';

type Variables = {
  requestId: string;
};

export function createLoggingMiddleware() {
  return async (c: Context<{ Variables: Variables }>, next: Next) => {
    const start = Date.now();
    
    // Generate request ID (compatible with both Node.js and CF Workers)
    const requestId = globalThis.crypto?.randomUUID?.() || 
      Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    // Add request ID to context
    c.set('requestId', requestId);
    
    // Add request ID to response headers
    c.header('X-Request-ID', requestId);

    console.log(JSON.stringify({
      level: 'info',
      message: 'Request started',
      request_id: requestId,
      method: c.req.method,
      path: c.req.path,
      user_agent: c.req.header('User-Agent'),
    }));

    await next();

    const duration = Date.now() - start;
    console.log(JSON.stringify({
      level: 'info',
      message: 'Request completed',
      request_id: requestId,
      method: c.req.method,
      path: c.req.path,
      status: c.res.status,
      duration_ms: duration,
    }));
  };
}