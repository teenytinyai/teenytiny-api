import { test, describe, expect } from 'vitest';
import OpenAI from 'openai';

// Configuration
const TEENYTINY_URL = process.env.TEENYTINY_URL || 'http://localhost:8080';
const TEENYTINY_API_KEY = process.env.TEENYTINY_API_KEY || 'testkey';

// Create OpenAI client configured for TeenyTiny AI
const openai = new OpenAI({
  apiKey: TEENYTINY_API_KEY,
  baseURL: `${TEENYTINY_URL}/v1`,
});

describe('Streaming Integration', () => {
  test('basic streaming completion', async () => {
    const stream = await openai.chat.completions.create({
      model: 'echo',
      messages: [{ role: 'user', content: 'Hello streaming world' }],
      stream: true,
    });

    let fullContent = '';
    let chunkCount = 0;
    
    for await (const chunk of stream) {
      chunkCount++;
      const content = chunk.choices[0]?.delta?.content || '';
      fullContent += content;
    }

    expect(fullContent).toBe('Hello streaming world');
    expect(chunkCount).toBeGreaterThan(0);
  });

  test('streaming vs non-streaming returns same content', async () => {
    const testMessage = 'Compare streaming modes';

    // Non-streaming
    const regular = await openai.chat.completions.create({
      model: 'echo',
      messages: [{ role: 'user', content: testMessage }],
      stream: false,
    });

    // Streaming
    const stream = await openai.chat.completions.create({
      model: 'echo',
      messages: [{ role: 'user', content: testMessage }],
      stream: true,
    });

    let streamContent = '';
    for await (const chunk of stream) {
      streamContent += chunk.choices[0]?.delta?.content || '';
    }

    expect(regular.choices[0].message.content).toBe(streamContent);
    expect(streamContent).toBe(testMessage);
  });

  test('streaming with system prompt', async () => {
    const stream = await openai.chat.completions.create({
      model: 'echo',
      messages: [
        { role: 'system', content: 'You are helpful' },
        { role: 'user', content: 'Streaming system test' }
      ],
      stream: true,
    });

    let fullContent = '';
    for await (const chunk of stream) {
      fullContent += chunk.choices[0]?.delta?.content || '';
    }

    // Echo model should return the user message part
    expect(fullContent).toBe('Streaming system test');
  });

  test('streaming chunk structure', async () => {
    const stream = await openai.chat.completions.create({
      model: 'echo',
      messages: [{ role: 'user', content: 'Structure test' }],
      stream: true,
    });

    const chunks = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }

    expect(chunks.length).toBeGreaterThan(0);

    // Check first chunk structure
    const firstChunk = chunks[0];
    expect(firstChunk.id).toBeTruthy();
    expect(firstChunk.object).toBe('chat.completion.chunk');
    expect(firstChunk.created).toBeTruthy();
    expect(firstChunk.model).toBe('echo');
    expect(Array.isArray(firstChunk.choices)).toBe(true);

    // Check that we get content chunks
    const contentChunks = chunks.filter(c => 
      c.choices[0]?.delta?.content && c.choices[0].delta.content.length > 0
    );
    expect(contentChunks.length).toBeGreaterThan(0);

    // Check last chunk has finish_reason
    const lastChunk = chunks[chunks.length - 1];
    if (lastChunk.choices[0]?.finish_reason) {
      expect(lastChunk.choices[0].finish_reason).toBe('stop');
    }
  });

  test('streaming empty message', async () => {
    const stream = await openai.chat.completions.create({
      model: 'echo',
      messages: [{ role: 'user', content: '' }],
      stream: true,
    });

    let fullContent = '';
    for await (const chunk of stream) {
      fullContent += chunk.choices[0]?.delta?.content || '';
    }

    // Should handle empty input gracefully
    expect(typeof fullContent).toBe('string');
  });

  test('streaming longer message', async () => {
    // Note: Echo model streams word-by-word with 50ms delay, so keep message reasonable
    const longerMessage = 'This is a longer message with multiple words to test streaming behavior properly';
    
    const stream = await openai.chat.completions.create({
      model: 'echo',
      messages: [{ role: 'user', content: longerMessage }],
      stream: true,
    });

    let fullContent = '';
    for await (const chunk of stream) {
      fullContent += chunk.choices[0]?.delta?.content || '';
    }

    expect(fullContent).toBe(longerMessage);
  });

  test('streaming multiline content', async () => {
    const multilineMessage = `Line 1
Line 2 with more content
Line 3
Final line`;

    const stream = await openai.chat.completions.create({
      model: 'echo',
      messages: [{ role: 'user', content: multilineMessage }],
      stream: true,
    });

    let fullContent = '';
    for await (const chunk of stream) {
      fullContent += chunk.choices[0]?.delta?.content || '';
    }

    expect(fullContent).toBe(multilineMessage);
  });

  test('streaming error handling', async () => {
    // This test ensures streaming properly handles and throws errors
    await expect(async () => {
      const stream = await openai.chat.completions.create({
        model: 'nonexistent-model',
        messages: [{ role: 'user', content: 'Test' }],
        stream: true,
      });

      // Try to consume the stream - this should throw
      for await (const chunk of stream) {
        // Should not reach here
      }
    }).rejects.toThrow();
  });
});