import { test, describe, expect } from 'vitest';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { generateText, streamText } from 'ai';

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

describe('Parameter Options with Vercel AI SDK', () => {
  test('temperature parameter', async () => {
    const { text } = await generateText({
      model: model,
      prompt: 'Temperature test',
      temperature: 0.7,
    });

    expect(text).toBe('Temperature test');
  });

  test('maxTokens parameter', async () => {
    const { text } = await generateText({
      model: model,
      prompt: 'Max tokens test',
      maxTokens: 100,
    });

    expect(text).toBe('Max tokens test');
  });

  test('topP parameter', async () => {
    const { text } = await generateText({
      model: model,
      prompt: 'Top P test',
      topP: 0.9,
    });

    expect(text).toBe('Top P test');
  });

  test('multiple parameters together', async () => {
    const { text } = await generateText({
      model: model,
      prompt: 'Multiple params test',
      temperature: 0.8,
      maxTokens: 150,
      topP: 0.95,
    });

    expect(text).toBe('Multiple params test');
  });

  test('streaming with parameters', async () => {
    const { textStream } = await streamText({
      model: model,
      prompt: 'Streaming with params',
      temperature: 0.5,
      maxTokens: 50,
    });

    let fullContent = '';
    for await (const chunk of textStream) {
      fullContent += chunk;
    }

    expect(fullContent).toBe('Streaming with params');
  });

  test('presencePenalty parameter', async () => {
    const { text } = await generateText({
      model: model,
      prompt: 'Presence penalty test',
      presencePenalty: 0.5,
    });

    // Echo model should still return the input regardless of penalty
    expect(text).toBe('Presence penalty test');
  });

  test('frequencyPenalty parameter', async () => {
    const { text } = await generateText({
      model: model,
      prompt: 'Frequency penalty test',
      frequencyPenalty: 0.3,
    });

    expect(text).toBe('Frequency penalty test');
  });

  test('stopSequences parameter', async () => {
    // Test stop sequences - echo model may not implement this fully but should handle gracefully
    const { text } = await generateText({
      model: model,
      prompt: 'Stop sequence test',
      stopSequences: ['\n', '.'],
    });

    expect(text).toBe('Stop sequence test');
  });

  test('seed parameter for deterministic responses', async () => {
    // Test seed parameter - may not be implemented but should be handled gracefully
    const result1 = await generateText({
      model: model,
      prompt: 'Seed test',
      seed: 42,
    });

    const result2 = await generateText({
      model: model,
      prompt: 'Seed test',
      seed: 42,
    });

    // Both should return the same content (echo model behavior)
    expect(result1.text).toBe(result2.text);
    expect(result1.text).toBe('Seed test');
  });

  test('messages with system prompt and parameters', async () => {
    const { text } = await generateText({
      model: model,
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'System with params test' }
      ],
      temperature: 0.6,
      maxTokens: 80,
    });

    // Echo model should return the user message
    expect(text).toBe('System with params test');
  });

  test('streaming messages with parameters', async () => {
    const { textStream } = await streamText({
      model: model,
      messages: [
        { role: 'system', content: 'You are helpful.' },
        { role: 'user', content: 'Streaming messages with params' }
      ],
      temperature: 0.4,
      topP: 0.8,
    });

    let fullContent = '';
    for await (const chunk of textStream) {
      fullContent += chunk;
    }

    expect(fullContent).toBe('Streaming messages with params');
  });

  test('empty parameters object handling', async () => {
    // Test that the function works even with minimal parameters
    const { text } = await generateText({
      model: model,
      prompt: 'Minimal params test',
      // Only required parameters, no optional ones
    });

    expect(text).toBe('Minimal params test');
  });

  test('usage information with parameters', async () => {
    const result = await generateText({
      model: model,
      prompt: 'Usage with params test',
      temperature: 0.7,
      maxTokens: 50,
    });

    expect(result.text).toBe('Usage with params test');
    expect(result.usage).toBeTruthy();
    // v5 uses different property names  
    expect(typeof result.usage.inputTokens).toBe('number');
    expect(typeof result.usage.outputTokens).toBe('number');
    expect(typeof result.usage.totalTokens).toBe('number');
    expect(result.usage.totalTokens).toBeGreaterThan(0);
  });

  test('finish reason with parameters', async () => {
    const result = await generateText({
      model: model,
      prompt: 'Finish reason with params test',
      temperature: 0.3,
      maxTokens: 200,
    });

    expect(result.text).toBe('Finish reason with params test');
    expect(result.finishReason).toBe('stop');
  });
});