import { test, describe, expect } from 'vitest';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { generateText } from 'ai';

// Configuration
const TEENYTINY_URL = process.env.TEENYTINY_URL || 'http://localhost:8080';
const TEENYTINY_API_KEY = process.env.TEENYTINY_API_KEY || 'testkey';

// Create OpenAI-compatible provider for TeenyTiny AI
const provider = createOpenAICompatible({
  name: 'teenytiny',
  apiKey: TEENYTINY_API_KEY,
  baseURL: `${TEENYTINY_URL}/v1`,
});

const model = provider('echo');

describe('Basic Vercel AI SDK v5 Integration', () => {
  test('generateText with echo model', async () => {
    const { text } = await generateText({
      model: model,
      prompt: 'Hello World',
    });

    expect(text).toBe('Hello World');
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
    expect(text).toBe('Test message');
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

    expect(text).toBe('Last message');
  });

  test('generateText with system-only messages (returns default)', async () => {
    const { text } = await generateText({
      model: model,
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' }
      ],
    });

    // Should get the default echo model greeting
    expect(text).toContain('Echo model');
  });

  test('response includes usage information', async () => {
    const result = await generateText({
      model: model,
      prompt: 'Usage test',
    });

    expect(result.text).toBe('Usage test');
    expect(result.usage).toBeTruthy();
    // v5 uses different property names
    expect(typeof result.usage.inputTokens).toBe('number');
    expect(typeof result.usage.outputTokens).toBe('number');
    expect(typeof result.usage.totalTokens).toBe('number');
    expect(result.usage.totalTokens).toBeGreaterThan(0);
  });

  test('response includes finish reason', async () => {
    const result = await generateText({
      model: model,
      prompt: 'Finish reason test',
    });

    expect(result.text).toBe('Finish reason test');
    expect(result.finishReason).toBe('stop');
  });

  test('empty prompt handling', async () => {
    const { text } = await generateText({
      model: model,
      prompt: '',
    });

    // Should handle empty input gracefully
    expect(typeof text).toBe('string');
  });

  test('special characters and unicode', async () => {
    const testMessage = 'Hello! 🌟 Special chars: @#$%^&*()_+-={}[]|\\:;"\'<>?,./ 中文';
    
    const { text } = await generateText({
      model: model,
      prompt: testMessage,
    });

    expect(text).toBe(testMessage);
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

    expect(text).toBe(multilineMessage);
  });

  test('generateText with parameters', async () => {
    const { text } = await generateText({
      model: model,
      prompt: 'Parameter test',
      temperature: 0.7,
      maxTokens: 100,
      topP: 0.9,
    });

    expect(text).toBe('Parameter test');
  });
});