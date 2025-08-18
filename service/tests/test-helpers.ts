/**
 * Test Helpers for Model Testing
 * 
 * These utilities focus on making model tests readable and content-focused,
 * removing boilerplate around async generators and chunk handling.
 */

import { Model } from '../src/models/model.js';

/**
 * Extract the response text from a model's process method
 * 
 * Handles the async generator and returns the concatenated result.
 * Most models return a single chunk, but this works for multi-chunk responses too.
 * 
 * @param model - The model to test
 * @param input - The input text to process
 * @returns Promise resolving to the complete response text
 * 
 * @example
 * ```typescript
 * // Instead of this boilerplate:
 * const chunks: string[] = [];
 * for await (const chunk of model.process('hello')) {
 *   chunks.push(chunk);
 * }
 * const response = chunks.join('');
 * expect(response).toBe('Hello there!');
 * 
 * // Use this:
 * const response = await getResponse(model, 'hello');
 * expect(response).toBe('Hello there!');
 * ```
 */
export async function getResponse(model: Model, input: string): Promise<string> {
  const chunks: string[] = [];
  
  for await (const chunk of model.process(input)) {
    chunks.push(chunk);
  }
  
  return chunks.join('');
}

/**
 * Extract all chunks from a model's process method
 * 
 * Useful when you need to test the streaming behavior specifically,
 * rather than just the final result.
 * 
 * @param model - The model to test  
 * @param input - The input text to process
 * @returns Promise resolving to array of response chunks
 * 
 * @example
 * ```typescript
 * // Test that a model streams words individually
 * const chunks = await getChunks(streamingModel, 'hello world');
 * expect(chunks).toEqual(['hello', ' world']);
 * 
 * // Test that a non-streaming model returns single chunk
 * const chunks = await getChunks(regularModel, 'hello world');
 * expect(chunks).toHaveLength(1);
 * ```
 */
export async function getChunks(model: Model, input: string): Promise<string[]> {
  const chunks: string[] = [];
  
  for await (const chunk of model.process(input)) {
    chunks.push(chunk);
  }
  
  return chunks;
}

