import { describe, it, expect } from 'vitest';
import { EchoModel } from '../src/models/echo-model.js';
import { DelayModelware } from '../src/modelware/delay-modelware.js';
import { StreamSplitModelware } from '../src/modelware/stream-split-modelware.js';

describe('Simple Model Interface', () => {
  describe('EchoModel', () => {
    it('should echo back input text as single chunk', async () => {
      const model = new EchoModel();
      const chunks: string[] = [];
      
      for await (const chunk of model.process('hello world')) {
        chunks.push(chunk);
      }
      
      expect(chunks).toEqual(['hello world']);
    });

    it('should return default message for empty input', async () => {
      const model = new EchoModel();
      const chunks: string[] = [];
      
      for await (const chunk of model.process('')) {
        chunks.push(chunk);
      }
      
      expect(chunks).toEqual(["Hello! I'm the Echo model. Send me a message and I'll echo it back."]);
    });
  });

  describe('StreamSplitModelware', () => {
    it('should split text into words matching original EchoModel behavior', async () => {
      const baseModel = new EchoModel();
      const splitModel = new StreamSplitModelware(baseModel, StreamSplitModelware.WORDS);
      
      const chunks: string[] = [];
      
      for await (const chunk of splitModel.process('hello world test')) {
        chunks.push(chunk);
      }
      
      expect(chunks).toEqual(['hello', ' world', ' test']);
    });

    it('should handle sentences', async () => {
      const baseModel = new EchoModel();
      const splitModel = new StreamSplitModelware(baseModel, StreamSplitModelware.SENTENCES);
      
      const chunks: string[] = [];
      
      for await (const chunk of splitModel.process('Hello world. How are you?')) {
        chunks.push(chunk);
      }
      
      expect(chunks).toEqual(['Hello world', '. ', 'How are you', '?']);
    });
  });

  describe('DelayModelware', () => {
    it('should wrap another model and add delays', async () => {
      const baseModel = new EchoModel();
      const delayModel = new DelayModelware(baseModel, 10); // 10ms delay for testing
      
      const start = Date.now();
      const chunks: string[] = [];
      
      for await (const chunk of delayModel.process('test')) {
        chunks.push(chunk);
      }
      
      const duration = Date.now() - start;
      
      expect(chunks).toEqual(['test']);
      expect(duration).toBeGreaterThan(8); // At least 1 delay of 10ms
    });

    it('should preserve the underlying model output', async () => {
      const baseModel = new EchoModel();
      const delayModel = new DelayModelware(baseModel, 1);
      
      const chunks: string[] = [];
      
      for await (const chunk of delayModel.process('test input')) {
        chunks.push(chunk);
      }
      
      expect(chunks).toEqual(['test input']);
    });
  });

  describe('Model Composition', () => {
    it('should allow chaining multiple decorators', async () => {
      const baseModel = new EchoModel();
      const splitModel = new StreamSplitModelware(baseModel, StreamSplitModelware.WORDS);
      const delayedModel = new DelayModelware(splitModel, 5);
      
      const start = Date.now();
      const chunks: string[] = [];
      
      for await (const chunk of delayedModel.process('a b')) {
        chunks.push(chunk);
      }
      
      const duration = Date.now() - start;
      
      expect(chunks).toEqual(['a', ' b']);
      expect(duration).toBeGreaterThan(8); // At least 2 delays of 5ms each
    });
  });
});