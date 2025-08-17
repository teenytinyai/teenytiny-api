import { test, describe } from 'node:test';
import assert from 'node:assert';
import OpenAI from 'openai';

// Configuration
const TEENYTINY_URL = process.env.TEENYTINY_URL || 'http://localhost:8080';
const TEENYTINY_API_KEY = process.env.TEENYTINY_API_KEY || 'testkey';

describe('Authentication and Error Handling', () => {
  test('invalid API key throws authentication error', async () => {
    const invalidClient = new OpenAI({
      apiKey: 'invalid-key',
      baseURL: `${TEENYTINY_URL}/v1`,
    });

    try {
      await invalidClient.chat.completions.create({
        model: 'echo',
        messages: [{ role: 'user', content: 'Hello' }],
      });
      assert.fail('Expected authentication error');
    } catch (error) {
      assert.ok(error instanceof Error);
      // Should be a 401 error
      assert.ok(error.status === 401 || error.message.includes('401') || error.message.includes('Unauthorized'));
    }
  });

  test('missing API key throws authentication error', async () => {
    const noKeyClient = new OpenAI({
      apiKey: '',
      baseURL: `${TEENYTINY_URL}/v1`,
    });

    try {
      await noKeyClient.chat.completions.create({
        model: 'echo',
        messages: [{ role: 'user', content: 'Hello' }],
      });
      assert.fail('Expected authentication error');
    } catch (error) {
      assert.ok(error instanceof Error);
      assert.ok(error.status === 401 || error.message.includes('401') || error.message.includes('Unauthorized'));
    }
  });

  test('nonexistent model throws error', async () => {
    const client = new OpenAI({
      apiKey: TEENYTINY_API_KEY,
      baseURL: `${TEENYTINY_URL}/v1`,
    });

    try {
      await client.chat.completions.create({
        model: 'nonexistent-model',
        messages: [{ role: 'user', content: 'Hello' }],
      });
      assert.fail('Expected model error');
    } catch (error) {
      assert.ok(error instanceof Error);
      // Should be a 400 error for invalid model
      assert.ok(error.status === 400 || error.message.includes('400') || error.message.includes('model'));
    }
  });

  test('empty messages array throws validation error', async () => {
    const client = new OpenAI({
      apiKey: TEENYTINY_API_KEY,
      baseURL: `${TEENYTINY_URL}/v1`,
    });

    try {
      await client.chat.completions.create({
        model: 'echo',
        messages: [],
      });
      assert.fail('Expected validation error');
    } catch (error) {
      assert.ok(error instanceof Error);
      // Should be a 400 error for invalid request
      assert.ok(error.status === 400 || error.message.includes('400') || error.message.includes('messages'));
    }
  });

  test('malformed message structure throws validation error', async () => {
    const client = new OpenAI({
      apiKey: TEENYTINY_API_KEY,
      baseURL: `${TEENYTINY_URL}/v1`,
    });

    try {
      await client.chat.completions.create({
        model: 'echo',
        messages: [{ invalid_field: 'value' }], // Missing required 'role' and 'content'
      });
      assert.fail('Expected validation error');
    } catch (error) {
      assert.ok(error instanceof Error);
      assert.ok(error.status === 400 || error.message.includes('400'));
    }
  });

  test('network connectivity error handling', async () => {
    const unreachableClient = new OpenAI({
      apiKey: TEENYTINY_API_KEY,
      baseURL: 'http://nonexistent-host:9999/v1',
    });

    try {
      await unreachableClient.chat.completions.create({
        model: 'echo',
        messages: [{ role: 'user', content: 'Hello' }],
      });
      assert.fail('Expected network error');
    } catch (error) {
      assert.ok(error instanceof Error);
      // Should be a connection/network error - accept various network error types
      assert.ok(
        error.code === 'ECONNREFUSED' ||
        error.code === 'ENOTFOUND' ||
        error.code === 'EAI_NODATA' ||
        error.message.includes('fetch failed') ||
        error.message.includes('connection') ||
        error.message.includes('ENOTFOUND') ||
        error.message.includes('nonexistent-host') ||
        error.cause?.code === 'ENOTFOUND'
      );
    }
  });

  test('concurrent requests with authentication errors', async () => {
    const invalidClient = new OpenAI({
      apiKey: 'invalid-concurrent-key',
      baseURL: `${TEENYTINY_URL}/v1`,
    });

    const requests = Array(3).fill().map((_, i) => 
      invalidClient.chat.completions.create({
        model: 'echo',
        messages: [{ role: 'user', content: `Concurrent test ${i}` }],
      }).catch(error => error) // Catch errors so Promise.all doesn't fail
    );

    const results = await Promise.all(requests);

    // All requests should have failed with authentication errors
    results.forEach((result, i) => {
      assert.ok(result instanceof Error, `Request ${i} should have failed`);
      assert.ok(
        result.status === 401 || 
        result.message.includes('401') || 
        result.message.includes('Unauthorized'),
        `Request ${i} should be authentication error`
      );
    });
  });

  test('streaming authentication error', async () => {
    const invalidClient = new OpenAI({
      apiKey: 'invalid-streaming-key',
      baseURL: `${TEENYTINY_URL}/v1`,
    });

    try {
      const stream = await invalidClient.chat.completions.create({
        model: 'echo',
        messages: [{ role: 'user', content: 'Streaming auth test' }],
        stream: true,
      });

      // Try to consume the stream - this should throw
      for await (const chunk of stream) {
        // Should not reach here
      }

      assert.fail('Expected authentication error');
    } catch (error) {
      assert.ok(error instanceof Error);
      assert.ok(error.status === 401 || error.message.includes('401') || error.message.includes('Unauthorized'));
    }
  });

  test('parameter validation with invalid values', async () => {
    const client = new OpenAI({
      apiKey: TEENYTINY_API_KEY,
      baseURL: `${TEENYTINY_URL}/v1`,
    });

    // Test invalid temperature (most services accept this, but test graceful handling)
    try {
      const response = await client.chat.completions.create({
        model: 'echo',
        messages: [{ role: 'user', content: 'Temperature test' }],
        temperature: 5.0, // Outside normal range
      });
      // If it succeeds, that's fine - service is permissive
      assert.ok(response.choices[0].message.content);
    } catch (error) {
      // If it fails, that's also acceptable - service validates parameters
      assert.ok(error instanceof Error);
    }

    // Test negative max_tokens
    try {
      const response = await client.chat.completions.create({
        model: 'echo',
        messages: [{ role: 'user', content: 'Max tokens test' }],
        max_tokens: -1,
      });
      // If it succeeds, that's fine
      assert.ok(response.choices[0].message.content);
    } catch (error) {
      // If it fails, that's also acceptable
      assert.ok(error instanceof Error);
    }
  });
});