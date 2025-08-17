import { test, describe } from 'node:test';
import assert from 'node:assert';
import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';

// Configuration
const TEENYTINY_URL = process.env.TEENYTINY_URL || 'http://localhost:8080';
const TEENYTINY_API_KEY = process.env.TEENYTINY_API_KEY || 'testkey';

// Create OpenAI provider configured for TeenyTiny AI
const provider = createOpenAI({
  apiKey: TEENYTINY_API_KEY,
  baseURL: `${TEENYTINY_URL}/v1`,
});

const model = provider('echo');

describe('Streaming Vercel AI SDK Integration', () => {
  test('basic streaming completion', async () => {
    const { textStream } = await streamText({
      model: model,
      prompt: 'Hello streaming world',
    });

    let fullContent = '';
    for await (const chunk of textStream) {
      fullContent += chunk;
    }

    assert.strictEqual(fullContent, 'Hello streaming world');
  });

  test('streaming with messages', async () => {
    const { textStream } = await streamText({
      model: model,
      messages: [
        { role: 'system', content: 'You are helpful' },
        { role: 'user', content: 'Streaming system test' }
      ],
    });

    let fullContent = '';
    for await (const chunk of textStream) {
      fullContent += chunk;
    }

    // Echo model should return the user message
    assert.strictEqual(fullContent, 'Streaming system test');
  });

  test('streaming usage information', async () => {
    const result = await streamText({
      model: model,
      prompt: 'Usage test stream',
    });

    // Consume the stream
    let fullContent = '';
    for await (const chunk of result.textStream) {
      fullContent += chunk;
    }

    // Check final result
    const finalResult = await result.finishReason;
    assert.strictEqual(finalResult, 'stop');

    // Check usage (available after streaming completes)
    const usage = await result.usage;
    assert.ok(usage);
    assert.ok(typeof usage.promptTokens === 'number');
    assert.ok(typeof usage.completionTokens === 'number');
    assert.ok(typeof usage.totalTokens === 'number');
    assert.ok(usage.totalTokens > 0);

    assert.strictEqual(fullContent, 'Usage test stream');
  });

  test('streaming with parameters', async () => {
    const { textStream } = await streamText({
      model: model,
      prompt: 'Parameter stream test',
      temperature: 0.7,
      maxTokens: 100,
      topP: 0.9,
    });

    let fullContent = '';
    for await (const chunk of textStream) {
      fullContent += chunk;
    }

    assert.strictEqual(fullContent, 'Parameter stream test');
  });

  test('streaming empty message', async () => {
    const { textStream } = await streamText({
      model: model,
      prompt: '',
    });

    let fullContent = '';
    for await (const chunk of textStream) {
      fullContent += chunk;
    }

    // Should handle empty input gracefully
    assert.ok(typeof fullContent === 'string');
  });

  test('streaming longer message', async () => {
    // Note: Echo model streams word-by-word with 50ms delay, so keep message reasonable
    const longerMessage = 'This is a longer message with multiple words to test streaming behavior properly';
    
    const { textStream } = await streamText({
      model: model,
      prompt: longerMessage,
    });

    let fullContent = '';
    for await (const chunk of textStream) {
      fullContent += chunk;
    }

    assert.strictEqual(fullContent, longerMessage);
  });

  test('streaming multiline content', async () => {
    const multilineMessage = `Line 1
Line 2 with more content
Line 3
Final line`;

    const { textStream } = await streamText({
      model: model,
      prompt: multilineMessage,
    });

    let fullContent = '';
    for await (const chunk of textStream) {
      fullContent += chunk;
    }

    assert.strictEqual(fullContent, multilineMessage);
  });

  test('streaming special characters and unicode', async () => {
    const testMessage = 'Hello! 🌟 Special chars: @#$%^&*()_+-={}[]|\\:;"\'<>?,./ 中文';
    
    const { textStream } = await streamText({
      model: model,
      prompt: testMessage,
    });

    let fullContent = '';
    for await (const chunk of textStream) {
      fullContent += chunk;
    }

    assert.strictEqual(fullContent, testMessage);
  });

  test('streaming multiple user messages (returns last)', async () => {
    const { textStream } = await streamText({
      model: model,
      messages: [
        { role: 'user', content: 'First message' },
        { role: 'assistant', content: 'First response' },
        { role: 'user', content: 'Last message' }
      ],
    });

    let fullContent = '';
    for await (const chunk of textStream) {
      fullContent += chunk;
    }

    assert.strictEqual(fullContent, 'Last message');
  });

  test('streaming system-only messages (returns default)', async () => {
    const { textStream } = await streamText({
      model: model,
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' }
      ],
    });

    let fullContent = '';
    for await (const chunk of textStream) {
      fullContent += chunk;
    }

    // Should get the default echo model greeting
    assert.ok(fullContent.includes('Echo model'), `Expected default response, got: ${fullContent}`);
  });
});