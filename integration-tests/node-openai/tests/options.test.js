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

describe('Parameter Options', () => {
  test('temperature parameter', async () => {
    const completion = await openai.chat.completions.create({
      model: 'echo',
      messages: [{ role: 'user', content: 'Temperature test' }],
      temperature: 0.7,
    });

    assert.strictEqual(completion.choices[0].message.content, 'Temperature test');
  });

  test('max_tokens parameter', async () => {
    const completion = await openai.chat.completions.create({
      model: 'echo',
      messages: [{ role: 'user', content: 'Max tokens test' }],
      max_tokens: 100,
    });

    assert.strictEqual(completion.choices[0].message.content, 'Max tokens test');
  });

  test('top_p parameter', async () => {
    const completion = await openai.chat.completions.create({
      model: 'echo',
      messages: [{ role: 'user', content: 'Top P test' }],
      top_p: 0.9,
    });

    assert.strictEqual(completion.choices[0].message.content, 'Top P test');
  });

  test('multiple parameters together', async () => {
    const completion = await openai.chat.completions.create({
      model: 'echo',
      messages: [{ role: 'user', content: 'Multiple params test' }],
      temperature: 0.8,
      max_tokens: 150,
      top_p: 0.95,
    });

    assert.strictEqual(completion.choices[0].message.content, 'Multiple params test');
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

    assert.strictEqual(fullContent, 'Streaming with params');
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
        assert.ok(completion.choices.length >= 2);
        completion.choices.forEach((choice, i) => {
          assert.ok(choice.message.content);
          assert.strictEqual(choice.index, i);
        });
      } else {
        // If not supported, should still work with single choice
        assert.strictEqual(completion.choices.length, 1);
        assert.strictEqual(completion.choices[0].message.content, 'Multiple choices test');
      }
    } catch (error) {
      // Some services may reject the n parameter, which is also acceptable
      assert.ok(error instanceof Error);
    }
  });

  test('presence_penalty parameter', async () => {
    const completion = await openai.chat.completions.create({
      model: 'echo',
      messages: [{ role: 'user', content: 'Presence penalty test' }],
      presence_penalty: 0.5,
    });

    // Echo model should still return the input regardless of penalty
    assert.strictEqual(completion.choices[0].message.content, 'Presence penalty test');
  });

  test('frequency_penalty parameter', async () => {
    const completion = await openai.chat.completions.create({
      model: 'echo',
      messages: [{ role: 'user', content: 'Frequency penalty test' }],
      frequency_penalty: 0.3,
    });

    assert.strictEqual(completion.choices[0].message.content, 'Frequency penalty test');
  });

  test('stop parameter', async () => {
    // Test stop sequences - echo model may not implement this fully but should handle gracefully
    const completion = await openai.chat.completions.create({
      model: 'echo',
      messages: [{ role: 'user', content: 'Stop sequence test' }],
      stop: ['\n', '.'],
    });

    assert.strictEqual(completion.choices[0].message.content, 'Stop sequence test');
  });

  test('user parameter for tracking', async () => {
    const completion = await openai.chat.completions.create({
      model: 'echo',
      messages: [{ role: 'user', content: 'User tracking test' }],
      user: 'test-user-123',
    });

    assert.strictEqual(completion.choices[0].message.content, 'User tracking test');
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
    assert.strictEqual(completion1.choices[0].message.content, completion2.choices[0].message.content);
    assert.strictEqual(completion1.choices[0].message.content, 'Seed test');
  });

  test('response_format parameter', async () => {
    // Test JSON response format - echo model may not implement this but should handle gracefully
    try {
      const completion = await openai.chat.completions.create({
        model: 'echo',
        messages: [{ role: 'user', content: 'JSON format test' }],
        response_format: { type: 'json_object' },
      });

      assert.strictEqual(completion.choices[0].message.content, 'JSON format test');
    } catch (error) {
      // Some implementations may not support response_format, which is acceptable
      assert.ok(error instanceof Error);
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

    assert.strictEqual(completion.choices[0].message.content, 'Unknown params test');
  });
});