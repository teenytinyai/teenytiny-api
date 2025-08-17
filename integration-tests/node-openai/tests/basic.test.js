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

describe('Basic OpenAI SDK Integration', () => {
  test('basic completion with echo model', async () => {
    const completion = await openai.chat.completions.create({
      model: 'echo',
      messages: [
        { role: 'user', content: 'Hello World' }
      ],
    });

    assert.strictEqual(completion.choices[0].message.content, 'Hello World');
    assert.strictEqual(completion.model, 'echo');
    assert.strictEqual(completion.object, 'chat.completion');
    assert.ok(completion.usage.total_tokens > 0);
  });

  test('multi-message conversation (should return last user message)', async () => {
    const completion = await openai.chat.completions.create({
      model: 'echo',
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'First message' },
        { role: 'assistant', content: 'First response' },
        { role: 'user', content: 'Last message' }
      ],
    });

    assert.strictEqual(completion.choices[0].message.content, 'Last message');
  });

  test('system prompt with user message', async () => {
    const completion = await openai.chat.completions.create({
      model: 'echo',
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Test message' }
      ],
    });

    // Echo model should return the user message, ignoring system prompt
    assert.strictEqual(completion.choices[0].message.content, 'Test message');
  });

  test('no user messages (system only) returns default response', async () => {
    const completion = await openai.chat.completions.create({
      model: 'echo',
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' }
      ],
    });

    // Should get the default echo model greeting
    const content = completion.choices[0].message.content;
    assert.ok(content.includes('Echo model'), `Expected default response, got: ${content}`);
  });

  test('response structure matches OpenAI format', async () => {
    const completion = await openai.chat.completions.create({
      model: 'echo',
      messages: [{ role: 'user', content: 'Structure test' }],
    });

    // Check required fields
    assert.ok(completion.id);
    assert.strictEqual(completion.object, 'chat.completion');
    assert.ok(completion.created);
    assert.strictEqual(completion.model, 'echo');
    assert.ok(Array.isArray(completion.choices));
    assert.ok(completion.usage);

    // Check choice structure
    const choice = completion.choices[0];
    assert.strictEqual(choice.index, 0);
    assert.ok(choice.message);
    assert.strictEqual(choice.finish_reason, 'stop');

    // Check message structure
    assert.strictEqual(choice.message.role, 'assistant');
    assert.strictEqual(choice.message.content, 'Structure test');

    // Check usage structure
    assert.ok(typeof completion.usage.prompt_tokens === 'number');
    assert.ok(typeof completion.usage.completion_tokens === 'number');
    assert.ok(typeof completion.usage.total_tokens === 'number');
  });

  test('empty message handling', async () => {
    const completion = await openai.chat.completions.create({
      model: 'echo',
      messages: [{ role: 'user', content: '' }],
    });

    // Empty input should be handled gracefully
    assert.ok(typeof completion.choices[0].message.content === 'string');
  });

  test('special characters and unicode', async () => {
    const testMessage = 'Hello! 🌟 Special chars: @#$%^&*()_+-={}[]|\\:;"\'<>?,./ 中文';
    
    const completion = await openai.chat.completions.create({
      model: 'echo',
      messages: [{ role: 'user', content: testMessage }],
    });

    assert.strictEqual(completion.choices[0].message.content, testMessage);
  });

  test('multiline content', async () => {
    const multilineMessage = `Line 1
Line 2
Line 3 with more content
Final line`;

    const completion = await openai.chat.completions.create({
      model: 'echo',
      messages: [{ role: 'user', content: multilineMessage }],
    });

    assert.strictEqual(completion.choices[0].message.content, multilineMessage);
  });
});