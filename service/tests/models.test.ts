import { describe, it, expect } from 'vitest';
import { EchoModel } from '../src/models/echo-model.js';
import { DelayModelware } from '../src/modelware/delay-modelware.js';

describe('Simple Model Interface', () => {
  describe('EchoModel', () => {
    it('should echo back input text', async () => {
      const model = new EchoModel();
      const chunks: string[] = [];
      
      for await (const chunk of model.process('hello world')) {
        chunks.push(chunk);
      }
      
      expect(chunks.join('').trim()).toBe('hello world');
    });

    it('should return default message for empty input', async () => {
      const model = new EchoModel();
      const chunks: string[] = [];
      
      for await (const chunk of model.process('')) {
        chunks.push(chunk);
      }
      
      const result = chunks.join('').trim();
      expect(result).toBe("Hello! I'm the Echo model. Send me a message and I'll echo it back.");
    });

    it('should stream word by word', async () => {
      const model = new EchoModel();
      const chunks: string[] = [];
      
      for await (const chunk of model.process('one two three')) {
        chunks.push(chunk);
      }
      
      expect(chunks).toEqual(['one ', 'two ', 'three']);
    });
  });

  describe('DelayModelware', () => {
    it('should wrap another model and add delays', async () => {
      const baseModel = new EchoModel();
      const delayModel = new DelayModelware(baseModel, 10); // 10ms delay for testing
      
      const start = Date.now();
      const chunks: string[] = [];
      
      for await (const chunk of delayModel.process('a b')) {
        chunks.push(chunk);
      }
      
      const duration = Date.now() - start;
      
      expect(chunks).toEqual(['a ', 'b']);
      expect(duration).toBeGreaterThan(15); // At least 2 delays of 10ms
    });

    it('should preserve the underlying model output', async () => {
      const baseModel = new EchoModel();
      const delayModel = new DelayModelware(baseModel, 1);
      
      const chunks: string[] = [];
      
      for await (const chunk of delayModel.process('test input')) {
        chunks.push(chunk);
      }
      
      expect(chunks.join('').trim()).toBe('test input');
    });
  });

  describe('Model Composition', () => {
    it('should allow chaining multiple decorators', async () => {
      const baseModel = new EchoModel();
      const delayedModel = new DelayModelware(baseModel, 5);
      const doubleDelayedModel = new DelayModelware(delayedModel, 5);
      
      const start = Date.now();
      const chunks: string[] = [];
      
      for await (const chunk of doubleDelayedModel.process('a b')) {
        chunks.push(chunk);
      }
      
      const duration = Date.now() - start;
      
      expect(chunks).toEqual(['a ', 'b']);
      expect(duration).toBeGreaterThan(18); // At least 4 delays of 5ms each
    });
  });
});