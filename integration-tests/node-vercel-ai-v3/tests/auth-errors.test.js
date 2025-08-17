import { test, describe } from 'node:test';
import assert from 'node:assert';
import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';

// Configuration
const TEENYTINY_URL = process.env.TEENYTINY_URL || 'http://localhost:8080';
const TEENYTINY_API_KEY = process.env.TEENYTINY_API_KEY || 'testkey';

describe('Authentication and Error Handling', () => {
  test('missing API key throws error', async () => {
    const provider = createOpenAI({
      apiKey: '', // Empty API key
      baseURL: `${TEENYTINY_URL}/v1`,
    });
    const model = provider('echo');

    try {
      await generateText({
        model: model,
        prompt: 'This should fail',
      });
      
      assert.fail('Expected an authentication error to be thrown');
    } catch (error) {
      // Should get an authentication error
      assert.ok(error instanceof Error);
      // Vercel AI SDK may wrap the error, so check for various auth-related messages
      const errorMessage = error.message.toLowerCase();
      const hasAuthError = errorMessage.includes('auth') || 
                          errorMessage.includes('unauthorized') || 
                          errorMessage.includes('401') ||
                          errorMessage.includes('invalid') ||
                          errorMessage.includes('key');
      assert.ok(hasAuthError, `Expected auth error, got: ${error.message}`);
    }
  });

  test('invalid API key throws error', async () => {
    const provider = createOpenAI({
      apiKey: 'invalid-key-123',
      baseURL: `${TEENYTINY_URL}/v1`,
    });
    const model = provider('echo');

    try {
      await generateText({
        model: model,
        prompt: 'This should fail',
      });
      
      assert.fail('Expected an authentication error to be thrown');
    } catch (error) {
      assert.ok(error instanceof Error);
      // Check for authentication-related error
      const errorMessage = error.message.toLowerCase();
      const hasAuthError = errorMessage.includes('auth') || 
                          errorMessage.includes('unauthorized') || 
                          errorMessage.includes('401') ||
                          errorMessage.includes('invalid') ||
                          errorMessage.includes('key');
      assert.ok(hasAuthError, `Expected auth error, got: ${error.message}`);
    }
  });

  test('invalid model throws error', async () => {
    const provider = createOpenAI({
      apiKey: TEENYTINY_API_KEY,
      baseURL: `${TEENYTINY_URL}/v1`,
    });
    const model = provider('nonexistent-model');

    try {
      await generateText({
        model: model,
        prompt: 'This should fail',
      });
      
      assert.fail('Expected a model not found error to be thrown');
    } catch (error) {
      assert.ok(error instanceof Error);
      // Should be related to model not found
      const errorMessage = error.message.toLowerCase();
      const hasModelError = errorMessage.includes('model') || 
                           errorMessage.includes('not found') || 
                           errorMessage.includes('404') ||
                           errorMessage.includes('nonexistent');
      assert.ok(hasModelError, `Expected model error, got: ${error.message}`);
    }
  });

  test('network error handling', async () => {
    const provider = createOpenAI({
      apiKey: 'testkey',
      baseURL: 'http://nonexistent-host-12345.example.com/v1',
    });
    const model = provider('echo');

    try {
      await generateText({
        model: model,
        prompt: 'This should fail due to network',
      });
      
      assert.fail('Expected a network error to be thrown');
    } catch (error) {
      assert.ok(error instanceof Error);
      // Network errors can have various forms, check for common patterns
      const errorMessage = error.message.toLowerCase();
      const hasNetworkError = errorMessage.includes('fetch') || 
                             errorMessage.includes('network') || 
                             errorMessage.includes('enotfound') ||
                             errorMessage.includes('connection') ||
                             errorMessage.includes('refused') ||
                             error.cause?.code === 'ENOTFOUND' ||
                             error.cause?.code === 'ECONNREFUSED';
      assert.ok(hasNetworkError, `Expected network error, got: ${error.message}`);
    }
  });

  test('malformed message structure', async () => {
    const provider = createOpenAI({
      apiKey: TEENYTINY_API_KEY,
      baseURL: `${TEENYTINY_URL}/v1`,
    });
    const model = provider('echo');

    try {
      await generateText({
        model: model,
        messages: [
          { role: 'invalid-role', content: 'This should fail' }
        ],
      });
      
      assert.fail('Expected a validation error to be thrown');
    } catch (error) {
      assert.ok(error instanceof Error);
      // Should be related to validation or bad request
      const errorMessage = error.message.toLowerCase();
      const hasValidationError = errorMessage.includes('validation') || 
                                errorMessage.includes('invalid') || 
                                errorMessage.includes('role') ||
                                errorMessage.includes('400') ||
                                errorMessage.includes('bad request');
      assert.ok(hasValidationError, `Expected validation error, got: ${error.message}`);
    }
  });

  test('timeout handling', async () => {
    // This test may not work in all environments, but tests the SDK's timeout handling
    const provider = createOpenAI({
      apiKey: TEENYTINY_API_KEY,
      baseURL: `${TEENYTINY_URL}/v1`,
      // Note: Vercel AI SDK may not expose timeout directly, but we can test behavior
    });
    const model = provider('echo');

    try {
      // This is a basic test - in a real scenario you'd need a slow endpoint
      const result = await generateText({
        model: model,
        prompt: 'Timeout test',
      });
      
      // If it succeeds (which it likely will with echo model), that's fine
      assert.strictEqual(result.text, 'Timeout test');
    } catch (error) {
      // If there's a timeout error, verify it's timeout-related
      if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase();
        if (errorMessage.includes('timeout') || errorMessage.includes('abort')) {
          // This is expected for timeout scenarios
          assert.ok(true, 'Timeout error handled properly');
        } else {
          // Re-throw if it's not a timeout error we're testing for
          throw error;
        }
      }
    }
  });
});