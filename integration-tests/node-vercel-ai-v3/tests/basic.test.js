import { test, describe } from 'node:test';
import assert from 'node:assert';
import { createOpenAI } from '@ai-sdk/openai';
import { generateText, streamText } from 'ai';

// Configuration
const TEENYTINY_URL = process.env.TEENYTINY_URL || 'http://localhost:8080';
const TEENYTINY_API_KEY = process.env.TEENYTINY_API_KEY || 'testkey';

// Create OpenAI provider configured for TeenyTiny AI
const provider = createOpenAI({
  apiKey: TEENYTINY_API_KEY,
  baseURL: `${TEENYTINY_URL}/v1`,
});

const model = provider('echo');

describe('Basic Vercel AI SDK Integration', () => {
  test('generateText with echo model', async () => {
    const { text } = await generateText({
      model: model,
      prompt: 'Hello World',
    });

    assert.strictEqual(text, 'Hello World');
  });

  test('generateText with messages', async () => {
    const { text } = await generateText({
      model: model,
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Test message' }
      ],
    });

    // Echo model should return the user message
    assert.strictEqual(text, 'Test message');
  });

  test('generateText with multiple messages (returns last user message)', async () => {
    const { text } = await generateText({
      model: model,
      messages: [
        { role: 'user', content: 'First message' },
        { role: 'assistant', content: 'First response' },
        { role: 'user', content: 'Last message' }
      ],
    });

    assert.strictEqual(text, 'Last message');
  });

  test('generateText with system-only messages (returns default)', async () => {
    const { text } = await generateText({
      model: model,
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' }
      ],
    });

    // Should get the default echo model greeting
    assert.ok(text.includes('Echo model'), `Expected default response, got: ${text}`);
  });

  test('response includes usage information', async () => {
    const result = await generateText({
      model: model,
      prompt: 'Usage test',
    });

    assert.strictEqual(result.text, 'Usage test');
    assert.ok(result.usage);
    assert.ok(typeof result.usage.promptTokens === 'number');
    assert.ok(typeof result.usage.completionTokens === 'number');
    assert.ok(typeof result.usage.totalTokens === 'number');
    assert.ok(result.usage.totalTokens > 0);
  });

  test('response includes finish reason', async () => {
    const result = await generateText({
      model: model,
      prompt: 'Finish reason test',
    });

    assert.strictEqual(result.text, 'Finish reason test');
    assert.strictEqual(result.finishReason, 'stop');
  });

  test('empty prompt handling', async () => {
    const { text } = await generateText({
      model: model,
      prompt: '',
    });

    // Should handle empty input gracefully
    assert.ok(typeof text === 'string');
  });

  test('special characters and unicode', async () => {
    const testMessage = 'Hello! 🌟 Special chars: @#$%^&*()_+-={}[]|\\:;"\'<>?,./ 中文';
    
    const { text } = await generateText({
      model: model,
      prompt: testMessage,
    });

    assert.strictEqual(text, testMessage);
  });

  test('multiline content', async () => {
    const multilineMessage = `Line 1
Line 2
Line 3 with more content
Final line`;

    const { text } = await generateText({
      model: model,
      prompt: multilineMessage,
    });

    assert.strictEqual(text, multilineMessage);
  });

  test('generateText with parameters', async () => {
    const { text } = await generateText({
      model: model,
      prompt: 'Parameter test',
      temperature: 0.7,
      maxTokens: 100,
      topP: 0.9,
    });

    assert.strictEqual(text, 'Parameter test');
  });
});