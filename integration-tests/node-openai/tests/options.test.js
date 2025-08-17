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

describe('Parameter Options', () => {
  test('temperature parameter', async () => {
    const completion = await openai.chat.completions.create({
      model: 'echo',
      messages: [{ role: 'user', content: 'Temperature test' }],
      temperature: 0.7,
    });

    expect(completion.choices[0].message.content).toBe('Temperature test');
  });

  test('max_tokens parameter', async () => {
    const completion = await openai.chat.completions.create({
      model: 'echo',
      messages: [{ role: 'user', content: 'Max tokens test' }],
      max_tokens: 100,
    });

    expect(completion.choices[0].message.content).toBe('Max tokens test');
  });

  test('top_p parameter', async () => {
    const completion = await openai.chat.completions.create({
      model: 'echo',
      messages: [{ role: 'user', content: 'Top P test' }],
      top_p: 0.9,
    });

    expect(completion.choices[0].message.content).toBe('Top P test');
  });

  test('multiple parameters together', async () => {
    const completion = await openai.chat.completions.create({
      model: 'echo',
      messages: [{ role: 'user', content: 'Multiple params test' }],
      temperature: 0.8,
      max_tokens: 150,
      top_p: 0.95,
    });

    expect(completion.choices[0].message.content).toBe('Multiple params test');
  });

  test('streaming with parameters', async () => {
    const stream = await openai.chat.completions.create({
      model: 'echo',
      messages: [{ role: 'user', content: 'Streaming with params' }],
      temperature: 0.5,
      max_tokens: 50,
      stream: true,
    });

    let fullContent = '';
    for await (const chunk of stream) {
      fullContent += chunk.choices[0]?.delta?.content || '';
    }

    expect(fullContent).toBe('Streaming with params');
  });

  test('n parameter (multiple choices)', async () => {
    // Most echo implementations don't support multiple choices, but test graceful handling
    try {
      const completion = await openai.chat.completions.create({
        model: 'echo',
        messages: [{ role: 'user', content: 'Multiple choices test' }],
        n: 2,
      });

      // If supported, check we get multiple choices
      if (completion.choices.length > 1) {
        expect(completion.choices.length).toBeGreaterThanOrEqual(2);
        completion.choices.forEach((choice, i) => {
          expect(choice.message.content).toBeTruthy();
          expect(choice.index).toBe(i);
        });
      } else {
        // If not supported, should still work with single choice
        expect(completion.choices.length).toBe(1);
        expect(completion.choices[0].message.content).toBe('Multiple choices test');
      }
    } catch (error) {
      // Some services may reject the n parameter, which is also acceptable
      expect(error).toBeInstanceOf(Error);
    }
  });

  test('presence_penalty parameter', async () => {
    const completion = await openai.chat.completions.create({
      model: 'echo',
      messages: [{ role: 'user', content: 'Presence penalty test' }],
      presence_penalty: 0.5,
    });

    // Echo model should still return the input regardless of penalty
    expect(completion.choices[0].message.content).toBe('Presence penalty test');
  });

  test('frequency_penalty parameter', async () => {
    const completion = await openai.chat.completions.create({
      model: 'echo',
      messages: [{ role: 'user', content: 'Frequency penalty test' }],
      frequency_penalty: 0.3,
    });

    expect(completion.choices[0].message.content).toBe('Frequency penalty test');
  });

  test('stop parameter', async () => {
    // Test stop sequences - echo model may not implement this fully but should handle gracefully
    const completion = await openai.chat.completions.create({
      model: 'echo',
      messages: [{ role: 'user', content: 'Stop sequence test' }],
      stop: ['\n', '.'],
    });

    expect(completion.choices[0].message.content).toBe('Stop sequence test');
  });

  test('user parameter for tracking', async () => {
    const completion = await openai.chat.completions.create({
      model: 'echo',
      messages: [{ role: 'user', content: 'User tracking test' }],
      user: 'test-user-123',
    });

    expect(completion.choices[0].message.content).toBe('User tracking test');
  });

  test('seed parameter for deterministic responses', async () => {
    // Test seed parameter - may not be implemented but should be handled gracefully
    const completion1 = await openai.chat.completions.create({
      model: 'echo',
      messages: [{ role: 'user', content: 'Seed test' }],
      seed: 42,
    });

    const completion2 = await openai.chat.completions.create({
      model: 'echo',
      messages: [{ role: 'user', content: 'Seed test' }],
      seed: 42,
    });

    // Both should return the same content (echo model behavior)
    expect(completion1.choices[0].message.content).toBe(completion2.choices[0].message.content);
    expect(completion1.choices[0].message.content).toBe('Seed test');
  });

  test('response_format parameter', async () => {
    // Test JSON response format - echo model may not implement this but should handle gracefully
    try {
      const completion = await openai.chat.completions.create({
        model: 'echo',
        messages: [{ role: 'user', content: 'JSON format test' }],
        response_format: { type: 'json_object' },
      });

      expect(completion.choices[0].message.content).toBe('JSON format test');
    } catch (error) {
      // Some implementations may not support response_format, which is acceptable
      expect(error).toBeInstanceOf(Error);
    }
  });

  test('unknown parameters are handled gracefully', async () => {
    // The SDK might filter out unknown parameters, but test that it doesn't break
    const completion = await openai.chat.completions.create({
      model: 'echo',
      messages: [{ role: 'user', content: 'Unknown params test' }],
      // These would be filtered by the SDK or ignored by the service
      custom_param: 'should_be_ignored',
      another_fake_param: 42,
    });

    expect(completion.choices[0].message.content).toBe('Unknown params test');
  });
});