import { Hono } from 'hono';

// Define types for Hono context variables
type Variables = {
  requestId: string;
};
import { stream } from 'hono/streaming';
import type {
  ChatCompletionRequest,
} from './openai-protocol/types.js';
import { InvalidRequestError, NotFoundError } from './openai-protocol/errors.js';
import { ModelRegistry } from './models/model-registry.js';
import { OpenAIModelRegistry } from './openai-protocol/openai-model-registry.js';
import { EchoModel } from './models/echo-model.js';
import { ElizaModel } from './models/eliza-model.js';
import { ParryModel } from './models/parry-model.js';
import { RacterModel } from './models/racter-model.js';
import { DelayModelware } from './modelware/delay-modelware.js';
import { StreamSplitModelware } from './modelware/stream-split-modelware.js';
import { createAuthMiddleware, type AuthConfig } from './middleware/auth.js';
import { corsMiddleware } from './middleware/cors.js';
import { createLoggingMiddleware } from './middleware/logging.js';
import { createErrorHandler } from './middleware/errors.js';

export interface AppConfig {
  auth: AuthConfig;
}

export function createApp(config: AppConfig) {
  const app = new Hono<{ Variables: Variables }>();

  // Initialize model registries
  const coreRegistry = new ModelRegistry();
  const openaiRegistry = new OpenAIModelRegistry(coreRegistry);
  
  // Create models with composition
  const echoModel = new EchoModel();
  const streamSplitEcho = new StreamSplitModelware(echoModel, StreamSplitModelware.WORDS);
  const delayedEchoModel = new DelayModelware(streamSplitEcho, 50);
  
  const elizaModel = new ElizaModel();
  const streamSplitEliza = new StreamSplitModelware(elizaModel, StreamSplitModelware.WORDS);
  const delayedElizaModel = new DelayModelware(streamSplitEliza, 100);
  
  const parryModel = new ParryModel();
  const streamSplitParry = new StreamSplitModelware(parryModel, StreamSplitModelware.WORDS);
  const delayedParryModel = new DelayModelware(streamSplitParry, 120);
  
  const racterModel = new RacterModel();
  const streamSplitRacter = new StreamSplitModelware(racterModel, StreamSplitModelware.WORDS);
  const delayedRacterModel = new DelayModelware(streamSplitRacter, 80);
  
  openaiRegistry.register('echo', delayedEchoModel);
  openaiRegistry.register('eliza', delayedElizaModel);
  openaiRegistry.register('parry', delayedParryModel);
  openaiRegistry.register('racter', delayedRacterModel);

  // Middleware
  app.use('*', corsMiddleware());
  app.use('*', createLoggingMiddleware());
  app.use('*', createAuthMiddleware(config.auth));

  // Error handler
  app.onError(createErrorHandler());

  // Health check endpoint
  app.get('/health', (c) => {
    return c.json({
      status: 'ok',
      service: 'teenytiny-api',
      timestamp: new Date().toISOString(),
    });
  });

  // Models endpoint
  app.get('/v1/models', (c) => {
    const response = openaiRegistry.listAsResponse();

    console.log(JSON.stringify({
      level: 'info',
      message: 'Models listed',
      request_id: c.get('requestId'),
      model_count: response.data.length,
    }));

    return c.json(response);
  });

  // Chat completions endpoint
  app.post('/v1/chat/completions', async (c) => {
    const requestId = c.get('requestId') as string;
    
    // Parse and validate request
    let request: ChatCompletionRequest;
    try {
      request = await c.req.json<ChatCompletionRequest>();
    } catch (error) {
      throw new InvalidRequestError('Invalid JSON in request body');
    }

    // Validate required fields
    if (!request.model) {
      throw new InvalidRequestError('Missing required parameter: model', 'model');
    }

    if (!request.messages || request.messages.length === 0) {
      throw new InvalidRequestError('Missing required parameter: messages', 'messages');
    }

    // Validate message structure
    for (let i = 0; i < request.messages.length; i++) {
      const message = request.messages[i];
      
      if (!message || typeof message !== 'object') {
        throw new InvalidRequestError(`Invalid message at index ${i}: must be an object`, 'messages');
      }
      
      if (!message.role) {
        throw new InvalidRequestError(`Invalid message at index ${i}: missing required field 'role'`, 'messages');
      }
      
      if (typeof message.role !== 'string' || !['system', 'user', 'assistant'].includes(message.role)) {
        throw new InvalidRequestError(`Invalid message at index ${i}: 'role' must be one of 'system', 'user', or 'assistant'`, 'messages');
      }
      
      if (message.content === undefined || message.content === null) {
        throw new InvalidRequestError(`Invalid message at index ${i}: missing required field 'content'`, 'messages');
      }
      
      if (typeof message.content !== 'string') {
        throw new InvalidRequestError(`Invalid message at index ${i}: 'content' must be a string`, 'messages');
      }
    }

    // Get model adapter
    const adapter = openaiRegistry.get(request.model);
    if (!adapter) {
      throw new InvalidRequestError(`Model not found: ${request.model}`, 'model');
    }

    const isStreaming = request.stream === true;

    console.log(JSON.stringify({
      level: 'info',
      message: 'Chat completion request',
      request_id: requestId,
      model: request.model,
      message_count: request.messages.length,
      streaming: isStreaming,
    }));

    if (isStreaming) {
      // Streaming response
      return stream(c, async (stream) => {
        c.header('Content-Type', 'text/event-stream');
        c.header('Cache-Control', 'no-cache');
        c.header('Connection', 'keep-alive');

        let totalTokens = 0;

        try {
          for await (const chunk of adapter.completeStream(request)) {
            // Track token usage from final chunk
            if (chunk.usage) {
              totalTokens = chunk.usage.total_tokens;
            }

            await stream.write(`data: ${JSON.stringify(chunk)}\n\n`);
          }

          await stream.write('data: [DONE]\n\n');

          console.log(JSON.stringify({
            level: 'info',
            message: 'Streaming completion finished',
            request_id: requestId,
            model: request.model,
            total_tokens: totalTokens,
          }));
        } catch (error) {
          console.error(JSON.stringify({
            level: 'error',
            message: 'Streaming completion failed',
            request_id: requestId,
            error: error instanceof Error ? error.message : String(error),
          }));
          
          await stream.write(`data: ${JSON.stringify({
            error: {
              message: 'Streaming failed',
              type: 'api_error',
            },
          })}\n\n`);
        }
      });
    } else {
      // Non-streaming response
      const response = await adapter.complete(request);

      console.log(JSON.stringify({
        level: 'info',
        message: 'Chat completion completed',
        request_id: requestId,
        model: request.model,
        prompt_tokens: response.usage.prompt_tokens,
        completion_tokens: response.usage.completion_tokens,
      }));

      return c.json(response);
    }
  });

  // 404 handler
  app.notFound((c) => {
    throw new NotFoundError(`Not found: ${c.req.method} ${c.req.path}`);
  });

  return app;
}