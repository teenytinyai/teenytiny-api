import { describe, it, expect } from 'vitest';
import { EchoModel } from '../src/models/echo-model.js';
import { ElizaModel } from '../src/models/eliza-model.js';
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

  describe('ElizaModel', () => {
    it('should respond to family keywords', async () => {
      const model = new ElizaModel();
      const chunks: string[] = [];
      
      for await (const chunk of model.process('I love my mother')) {
        chunks.push(chunk);
      }
      
      expect(chunks).toHaveLength(1);
      expect(chunks[0]).toMatch(/mother/);
    });

    it('should apply word reflections with context capture', async () => {
      const model = new ElizaModel();
      const chunks: string[] = [];
      
      for await (const chunk of model.process('I am sad')) {
        chunks.push(chunk);
      }
      
      expect(chunks).toHaveLength(1);
      expect(chunks[0]).toMatch(/you are|How long have you been|Why do you say/);
    });

    it('should handle I feel with context extraction', async () => {
      const model = new ElizaModel();
      const chunks: string[] = [];
      
      for await (const chunk of model.process('I feel angry about work')) {
        chunks.push(chunk);
      }
      
      expect(chunks).toHaveLength(1);
      expect(chunks[0]).toMatch(/Why do you feel|Do you often feel|What led you to feel|angry about work/);
    });

    it('should respond to apologies appropriately', async () => {
      const model = new ElizaModel();
      const chunks: string[] = [];
      
      for await (const chunk of model.process('I am sorry')) {
        chunks.push(chunk);
      }
      
      expect(chunks).toHaveLength(1);
      expect(chunks[0]).toMatch(/don't apologize|No need to be sorry/);
    });

    it('should handle because statements', async () => {
      const model = new ElizaModel();
      const chunks: string[] = [];
      
      for await (const chunk of model.process('I am sad because my job is stressful')) {
        chunks.push(chunk);
      }
      
      expect(chunks).toHaveLength(1);
      expect(chunks[0]).toMatch(/real reason|other reasons|my job is stressful/);
    });

    it('should respond to can you questions', async () => {
      const model = new ElizaModel();
      const chunks: string[] = [];
      
      for await (const chunk of model.process('Can you help me feel better')) {
        chunks.push(chunk);
      }
      
      expect(chunks).toHaveLength(1);
      expect(chunks[0]).toMatch(/ask if I can|Perhaps you can|help you feel better/);
    });

    it('should use fallback for unmatched input', async () => {
      const model = new ElizaModel();
      const chunks: string[] = [];
      
      for await (const chunk of model.process('xyz random nonsense abc')) {
        chunks.push(chunk);
      }
      
      expect(chunks).toHaveLength(1);
      // Should be one of the catch-all responses with context
      expect(chunks[0]).toMatch(/Please tell me more|Can you elaborate|How does that make you feel|Why do you say|What does that suggest|xyz random nonsense abc/);
    });

    it('should handle empty input', async () => {
      const model = new ElizaModel();
      const chunks: string[] = [];
      
      for await (const chunk of model.process('')) {
        chunks.push(chunk);
      }
      
      expect(chunks).toHaveLength(1);
      expect(chunks[0]).toBe('Tell me more about that.');
    });

    it('should prioritize higher weight patterns', async () => {
      const model = new ElizaModel();
      const chunks: string[] = [];
      
      // "mother" (weight 10) should win over "yes" (weight 2)
      for await (const chunk of model.process('yes my mother is nice')) {
        chunks.push(chunk);
      }
      
      expect(chunks).toHaveLength(1);
      expect(chunks[0]).toMatch(/mother/);
    });

    it('should respond to hello greeting', async () => {
      const model = new ElizaModel();
      const chunks: string[] = [];
      
      for await (const chunk of model.process('Hello')) {
        chunks.push(chunk);
      }
      
      expect(chunks).toHaveLength(1);
      expect(chunks[0]).toMatch(/Hello|Hi|feeling/);
    });
  });
});