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

describe('Basic OpenAI SDK Integration', () => {
  test('basic completion with echo model', async () => {
    const completion = await openai.chat.completions.create({
      model: 'echo',
      messages: [
        { role: 'user', content: 'Hello World' }
      ],
    });

    expect(completion.choices[0].message.content).toBe('Hello World');
    expect(completion.model).toBe('echo');
    expect(completion.object).toBe('chat.completion');
    expect(completion.usage.total_tokens).toBeGreaterThan(0);
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

    expect(completion.choices[0].message.content).toBe('Last message');
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
    expect(completion.choices[0].message.content).toBe('Test message');
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
    expect(content).toContain('Echo model');
  });

  test('response structure matches OpenAI format', async () => {
    const completion = await openai.chat.completions.create({
      model: 'echo',
      messages: [{ role: 'user', content: 'Structure test' }],
    });

    // Check required fields
    expect(completion.id).toBeTruthy();
    expect(completion.object).toBe('chat.completion');
    expect(completion.created).toBeTruthy();
    expect(completion.model).toBe('echo');
    expect(Array.isArray(completion.choices)).toBe(true);
    expect(completion.usage).toBeTruthy();

    // Check choice structure
    const choice = completion.choices[0];
    expect(choice.index).toBe(0);
    expect(choice.message).toBeTruthy();
    expect(choice.finish_reason).toBe('stop');

    // Check message structure
    expect(choice.message.role).toBe('assistant');
    expect(choice.message.content).toBe('Structure test');

    // Check usage structure
    expect(typeof completion.usage.prompt_tokens).toBe('number');
    expect(typeof completion.usage.completion_tokens).toBe('number');
    expect(typeof completion.usage.total_tokens).toBe('number');
  });

  test('empty message handling', async () => {
    const completion = await openai.chat.completions.create({
      model: 'echo',
      messages: [{ role: 'user', content: '' }],
    });

    // Empty input should be handled gracefully
    expect(typeof completion.choices[0].message.content).toBe('string');
  });

  test('special characters and unicode', async () => {
    const testMessage = 'Hello! 🌟 Special chars: @#$%^&*()_+-={}[]|\\:;"\'<>?,./ 中文';
    
    const completion = await openai.chat.completions.create({
      model: 'echo',
      messages: [{ role: 'user', content: testMessage }],
    });

    expect(completion.choices[0].message.content).toBe(testMessage);
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

    expect(completion.choices[0].message.content).toBe(multilineMessage);
  });
});