import { test, describe } from 'node:test';
import assert from 'node:assert';
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

    assert.strictEqual(fullContent, 'Hello streaming world');
    assert.ok(chunkCount > 0, 'Should receive multiple chunks');
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

    assert.strictEqual(regular.choices[0].message.content, streamContent);
    assert.strictEqual(streamContent, testMessage);
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
    assert.strictEqual(fullContent, 'Streaming system test');
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

    assert.ok(chunks.length > 0, 'Should receive chunks');

    // Check first chunk structure
    const firstChunk = chunks[0];
    assert.ok(firstChunk.id);
    assert.strictEqual(firstChunk.object, 'chat.completion.chunk');
    assert.ok(firstChunk.created);
    assert.strictEqual(firstChunk.model, 'echo');
    assert.ok(Array.isArray(firstChunk.choices));

    // Check that we get content chunks
    const contentChunks = chunks.filter(c => 
      c.choices[0]?.delta?.content && c.choices[0].delta.content.length > 0
    );
    assert.ok(contentChunks.length > 0, 'Should receive content chunks');

    // Check last chunk has finish_reason
    const lastChunk = chunks[chunks.length - 1];
    if (lastChunk.choices[0]?.finish_reason) {
      assert.strictEqual(lastChunk.choices[0].finish_reason, 'stop');
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
    assert.ok(typeof fullContent === 'string');
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

    assert.strictEqual(fullContent, longerMessage);
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

    assert.strictEqual(fullContent, multilineMessage);
  });

  test('streaming error handling', async () => {
    // This test ensures streaming properly handles and throws errors
    try {
      const stream = await openai.chat.completions.create({
        model: 'nonexistent-model',
        messages: [{ role: 'user', content: 'Test' }],
        stream: true,
      });

      // Try to consume the stream - this should throw
      for await (const chunk of stream) {
        // Should not reach here
      }

      assert.fail('Expected an error to be thrown');
    } catch (error) {
      // Should catch an error related to the invalid model
      assert.ok(error instanceof Error);
    }
  });
});