import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createApp } from '../src/app.js';
import type { ChatCompletionRequest } from '../src/types/openai.js';

const testAPIKey = 'tt-test-key-123';

describe('TeenyTiny API Integration Tests', () => {
  let app: ReturnType<typeof createApp>;

  beforeAll(() => {
    app = createApp({
      auth: {
        apiKey: testAPIKey,
      },
    });
  });

  describe('Health Check', () => {
    it('should return healthy status', async () => {
      const res = await app.request('/health');
      expect(res.status).toBe(200);
      
      const data = await res.json();
      expect(data).toMatchObject({
        status: 'ok',
        service: 'teenytiny-api',
      });
      expect(data.timestamp).toBeDefined();
    });
  });

  describe('Models Endpoint', () => {
    it('should list available models', async () => {
      const res = await app.request('/v1/models', {
        headers: {
          'Authorization': `Bearer ${testAPIKey}`,
        },
      });
      
      expect(res.status).toBe(200);
      const data = await res.json();
      
      expect(data).toMatchObject({
        object: 'list',
        data: expect.arrayContaining([
          expect.objectContaining({
            id: 'echo',
            object: 'model',
            owned_by: 'teenytiny-ai',
          }),
        ]),
      });
    });

    it('should require authentication', async () => {
      const res = await app.request('/v1/models');
      expect(res.status).toBe(401);
      
      const data = await res.json();
      expect(data.error.type).toBe('authentication_error');
    });

    it('should reject invalid API key', async () => {
      const res = await app.request('/v1/models', {
        headers: {
          'Authorization': 'Bearer invalid-key',
        },
      });
      
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error.type).toBe('authentication_error');
    });
  });

  describe('Chat Completions', () => {
    const validRequest: ChatCompletionRequest = {
      model: 'echo',
      messages: [
        { role: 'user', content: 'Hello, Echo!' },
      ],
    };

    it('should generate non-streaming completion', async () => {
      const res = await app.request('/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testAPIKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validRequest),
      });

      expect(res.status).toBe(200);
      const data = await res.json();

      expect(data).toMatchObject({
        object: 'chat.completion',
        model: 'echo',
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: 'Hello, Echo!',
            },
            finish_reason: 'stop',
          },
        ],
        usage: {
          prompt_tokens: expect.any(Number),
          completion_tokens: expect.any(Number),
          total_tokens: expect.any(Number),
        },
      });

      expect(data.id).toMatch(/^chatcmpl-/);
      expect(data.created).toBeTypeOf('number');
    });

    it('should generate streaming completion', async () => {
      const streamingRequest: ChatCompletionRequest = {
        ...validRequest,
        stream: true,
      };

      const res = await app.request('/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testAPIKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(streamingRequest),
      });

      expect(res.status).toBe(200);
      expect(res.headers.get('content-type')).toContain('text/event-stream');

      const text = await res.text();
      const lines = text.split('\n').filter(line => line.startsWith('data: '));
      
      expect(lines.length).toBeGreaterThan(0);
      expect(lines[lines.length - 1]).toBe('data: [DONE]');

      // Parse chunks (excluding [DONE])
      const chunks = lines.slice(0, -1).map(line => {
        const data = line.replace('data: ', '');
        return JSON.parse(data);
      });

      expect(chunks.length).toBeGreaterThan(0);

      // First chunk should have role
      expect(chunks[0]).toMatchObject({
        object: 'chat.completion.chunk',
        model: 'echo',
        choices: [
          {
            index: 0,
            delta: { role: 'assistant' },
          },
        ],
      });

      // Last chunk should have finish_reason and usage
      const lastChunk = chunks[chunks.length - 1];
      expect(lastChunk.choices[0]).toMatchObject({
        index: 0,
        finish_reason: 'stop',
      });
      expect(lastChunk.usage).toBeDefined();
    });

    it('should require authentication', async () => {
      const res = await app.request('/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validRequest),
      });

      expect(res.status).toBe(401);
    });

    it('should validate required fields', async () => {
      const invalidRequest = {
        messages: [{ role: 'user', content: 'Hello!' }],
        // Missing model field
      };

      const res = await app.request('/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testAPIKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidRequest),
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error.type).toBe('invalid_request_error');
      expect(data.error.param).toBe('model');
    });

    it('should validate model exists', async () => {
      const invalidRequest: ChatCompletionRequest = {
        model: 'nonexistent-model',
        messages: [{ role: 'user', content: 'Hello!' }],
      };

      const res = await app.request('/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testAPIKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidRequest),
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error.type).toBe('invalid_request_error');
      expect(data.error.param).toBe('model');
    });

    it('should handle empty messages array', async () => {
      const invalidRequest: ChatCompletionRequest = {
        model: 'echo',
        messages: [],
      };

      const res = await app.request('/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testAPIKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidRequest),
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error.type).toBe('invalid_request_error');
      expect(data.error.param).toBe('messages');
    });
  });

  describe('Echo Model Behavior', () => {
    it('should echo the last user message', async () => {
      const request: ChatCompletionRequest = {
        model: 'echo',
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: 'First message' },
          { role: 'assistant', content: 'First response' },
          { role: 'user', content: 'Second message' },
        ],
      };

      const res = await app.request('/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testAPIKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.choices[0].message.content).toBe('Second message');
    });

    it('should provide default response when no user messages', async () => {
      const request: ChatCompletionRequest = {
        model: 'echo',
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
        ],
      };

      const res = await app.request('/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testAPIKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.choices[0].message.content).toContain('Echo model');
    });
  });

  describe('CORS', () => {
    it('should handle OPTIONS requests', async () => {
      const res = await app.request('/v1/chat/completions', {
        method: 'OPTIONS',
      });

      expect(res.status).toBe(200);
      expect(res.headers.get('access-control-allow-origin')).toBe('*');
      expect(res.headers.get('access-control-allow-methods')).toContain('POST');
      expect(res.headers.get('access-control-allow-headers')).toContain('Authorization');
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 for unknown routes', async () => {
      const res = await app.request('/unknown-route', {
        headers: {
          'Authorization': `Bearer ${testAPIKey}`,
        },
      });

      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data.error.type).toBe('not_found_error');
    });

    it('should handle malformed JSON', async () => {
      const res = await app.request('/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testAPIKey}`,
          'Content-Type': 'application/json',
        },
        body: 'invalid json',
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error.type).toBe('invalid_request_error');
    });
  });
});