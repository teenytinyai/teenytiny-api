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

describe('Parameter Options with Vercel AI SDK', () => {
  test('temperature parameter', async () => {
    const { text } = await generateText({
      model: model,
      prompt: 'Temperature test',
      temperature: 0.7,
    });

    assert.strictEqual(text, 'Temperature test');
  });

  test('maxTokens parameter', async () => {
    const { text } = await generateText({
      model: model,
      prompt: 'Max tokens test',
      maxTokens: 100,
    });

    assert.strictEqual(text, 'Max tokens test');
  });

  test('topP parameter', async () => {
    const { text } = await generateText({
      model: model,
      prompt: 'Top P test',
      topP: 0.9,
    });

    assert.strictEqual(text, 'Top P test');
  });

  test('multiple parameters together', async () => {
    const { text } = await generateText({
      model: model,
      prompt: 'Multiple params test',
      temperature: 0.8,
      maxTokens: 150,
      topP: 0.95,
    });

    assert.strictEqual(text, 'Multiple params test');
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

    assert.strictEqual(fullContent, 'Streaming with params');
  });

  test('presencePenalty parameter', async () => {
    const { text } = await generateText({
      model: model,
      prompt: 'Presence penalty test',
      presencePenalty: 0.5,
    });

    // Echo model should still return the input regardless of penalty
    assert.strictEqual(text, 'Presence penalty test');
  });

  test('frequencyPenalty parameter', async () => {
    const { text } = await generateText({
      model: model,
      prompt: 'Frequency penalty test',
      frequencyPenalty: 0.3,
    });

    assert.strictEqual(text, 'Frequency penalty test');
  });

  test('stopSequences parameter', async () => {
    // Test stop sequences - echo model may not implement this fully but should handle gracefully
    const { text } = await generateText({
      model: model,
      prompt: 'Stop sequence test',
      stopSequences: ['\n', '.'],
    });

    assert.strictEqual(text, 'Stop sequence test');
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
    assert.strictEqual(result1.text, result2.text);
    assert.strictEqual(result1.text, 'Seed test');
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
    assert.strictEqual(text, 'System with params test');
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

    assert.strictEqual(fullContent, 'Streaming messages with params');
  });

  test('empty parameters object handling', async () => {
    // Test that the function works even with minimal parameters
    const { text } = await generateText({
      model: model,
      prompt: 'Minimal params test',
      // Only required parameters, no optional ones
    });

    assert.strictEqual(text, 'Minimal params test');
  });

  test('usage information with parameters', async () => {
    const result = await generateText({
      model: model,
      prompt: 'Usage with params test',
      temperature: 0.7,
      maxTokens: 50,
    });

    assert.strictEqual(result.text, 'Usage with params test');
    assert.ok(result.usage);
    assert.ok(typeof result.usage.promptTokens === 'number');
    assert.ok(typeof result.usage.completionTokens === 'number');
    assert.ok(typeof result.usage.totalTokens === 'number');
    assert.ok(result.usage.totalTokens > 0);
  });

  test('finish reason with parameters', async () => {
    const result = await generateText({
      model: model,
      prompt: 'Finish reason with params test',
      temperature: 0.3,
      maxTokens: 200,
    });

    assert.strictEqual(result.text, 'Finish reason with params test');
    assert.strictEqual(result.finishReason, 'stop');
  });
});