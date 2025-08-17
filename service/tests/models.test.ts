import { describe, it, expect } from 'vitest';
import { EchoModel } from '../src/models/echo-model.js';
import { ElizaModel } from '../src/models/eliza-model.js';
import { ParryModel } from '../src/models/parry-model.js';
import { RacterModel } from '../src/models/racter-model.js';
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
      expect(chunks[0]).toMatch(/you are|How long have you been|Why do you say|What does being.*mean to you/);
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

  describe('ParryModel', () => {
    it('should respond defensively to personal questions', async () => {
      const model = new ParryModel();
      const chunks: string[] = [];
      
      for await (const chunk of model.process('Who are you?')) {
        chunks.push(chunk);
      }
      
      expect(chunks).toHaveLength(1);
      expect(chunks[0]).toMatch(/don't like talking|Why do you need|not important|prefer to keep/);
    });

    it('should show paranoid responses to work questions', async () => {
      const model = new ParryModel();
      const chunks: string[] = [];
      
      for await (const chunk of model.process('What do you do for work?')) {
        chunks.push(chunk);
      }
      
      expect(chunks).toHaveLength(1);
      expect(chunks[0]).toMatch(/rather not discuss|too many questions|Why are you so interested|none of your business/);
    });

    it('should express paranoid beliefs about surveillance', async () => {
      const model = new ParryModel();
      const chunks: string[] = [];
      
      for await (const chunk of model.process('Is someone following you?')) {
        chunks.push(chunk);
      }
      
      expect(chunks).toHaveLength(1);
      expect(chunks[0]).toMatch(/following me|same car|being watched|suspicious/);
    });

    it('should reference core delusions about bookies', async () => {
      const model = new ParryModel();
      const chunks: string[] = [];
      
      for await (const chunk of model.process('Do you owe money to anyone?')) {
        chunks.push(chunk);
      }
      
      expect(chunks).toHaveLength(1);
      expect(chunks[0]).toMatch(/don't owe anybody|bookies|wasn't my fault|race was fixed/);
    });

    it('should be suspicious of questions', async () => {
      const model = new ParryModel();
      const chunks: string[] = [];
      
      for await (const chunk of model.process('Why do you think that?')) {
        chunks.push(chunk);
      }
      
      expect(chunks).toHaveLength(1);
      expect(chunks[0]).toMatch(/Why are you asking|exactly what they would|trying to get information|don't like people who ask|not with them|What exactly are you getting at/);
    });

    it('should respond cautiously to greetings', async () => {
      const model = new ParryModel();
      const chunks: string[] = [];
      
      for await (const chunk of model.process('Hello there')) {
        chunks.push(chunk);
      }
      
      expect(chunks).toHaveLength(1);
      expect(chunks[0]).toMatch(/Do I know you|ask me questions too|What do you want|not with them/);
    });

    it('should be hostile to authority figures', async () => {
      const model = new ParryModel();
      const chunks: string[] = [];
      
      for await (const chunk of model.process('Are you talking to the police?')) {
        chunks.push(chunk);
      }
      
      expect(chunks).toHaveLength(1);
      expect(chunks[0]).toMatch(/don't talk to police|working with them|won't help me|watching this conversation/);
    });

    it('should handle empty input suspiciously', async () => {
      const model = new ParryModel();
      const chunks: string[] = [];
      
      for await (const chunk of model.process('')) {
        chunks.push(chunk);
      }
      
      expect(chunks).toHaveLength(1);
      expect(chunks[0]).toBe('What do you want?');
    });

    it('should occasionally mention delusion themes', async () => {
      const model = new ParryModel();
      let mentionedThemes = 0;
      
      // Test multiple times since themes are added randomly (30% chance)
      for (let i = 0; i < 10; i++) {
        const chunks: string[] = [];
        for await (const chunk of model.process('How are you feeling?')) {
          chunks.push(chunk);
        }
        
        if (chunks[0]?.includes('bookies') || 
            chunks[0]?.includes('mail') || 
            chunks[0]?.includes('car parked') ||
            chunks[0]?.includes('phone calls')) {
          mentionedThemes++;
        }
      }
      
      // Should mention themes at least once in 10 attempts
      expect(mentionedThemes).toBeGreaterThan(0);
    });
  });

  describe('RacterModel', () => {
    it('should generate surreal stream-of-consciousness text', async () => {
      const model = new RacterModel();
      const chunks: string[] = [];
      
      for await (const chunk of model.process('Tell me about dreams')) {
        chunks.push(chunk);
      }
      
      expect(chunks).toHaveLength(1);
      expect(chunks[0]).toBeTruthy();
      expect(chunks[0].length).toBeGreaterThan(10);
    });

    it('should produce abstract and poetic language', async () => {
      const model = new RacterModel();
      const chunks: string[] = [];
      
      for await (const chunk of model.process('What is reality?')) {
        chunks.push(chunk);
      }
      
      expect(chunks).toHaveLength(1);
      // Should contain abstract concepts typical of RACTER
      const response = chunks[0].toLowerCase();
      const hasAbstractLanguage = 
        response.includes('more than') ||
        response.includes('dream') ||
        response.includes('electricity') ||
        response.includes('butterfly') ||
        response.includes('symphony') ||
        response.includes('mathematics') ||
        response.includes('purple') ||
        response.includes('golden') ||
        response.includes('whisper') ||
        response.includes('shadow');
        
      expect(hasAbstractLanguage).toBe(true);
    });

    it('should generate different responses for same input', async () => {
      const model = new RacterModel();
      const responses: string[] = [];
      
      // Generate multiple responses to test randomness
      for (let i = 0; i < 5; i++) {
        const chunks: string[] = [];
        for await (const chunk of model.process('Hello')) {
          chunks.push(chunk);
        }
        responses.push(chunks[0]);
      }
      
      // Should have at least some variation (not all identical)
      const uniqueResponses = new Set(responses);
      expect(uniqueResponses.size).toBeGreaterThan(1);
    });

    it('should handle empty input gracefully', async () => {
      const model = new RacterModel();
      const chunks: string[] = [];
      
      for await (const chunk of model.process('')) {
        chunks.push(chunk);
      }
      
      expect(chunks).toHaveLength(1);
      expect(chunks[0]).toBeTruthy();
      expect(chunks[0].length).toBeGreaterThan(5);
    });

    it('should create metaphorical and surreal imagery', async () => {
      const model = new RacterModel();
      let foundMetaphoricalLanguage = false;
      
      // Test multiple generations to find metaphorical patterns
      for (let i = 0; i < 10; i++) {
        const chunks: string[] = [];
        for await (const chunk of model.process('electricity')) {
          chunks.push(chunk);
        }
        
        const response = chunks[0].toLowerCase();
        if (response.includes('dreams of') || 
            response.includes('whispers') || 
            response.includes('dances') ||
            response.includes('while the') ||
            response.includes('laughs at') ||
            response.match(/\b\w+ and \w+ \w+ through \w+/)) {
          foundMetaphoricalLanguage = true;
          break;
        }
      }
      
      expect(foundMetaphoricalLanguage).toBe(true);
    });

    it('should produce responses with poetic structure', async () => {
      const model = new RacterModel();
      const chunks: string[] = [];
      
      for await (const chunk of model.process('poetry')) {
        chunks.push(chunk);
      }
      
      expect(chunks).toHaveLength(1);
      const response = chunks[0];
      
      // Should have sentence-like structure with periods
      expect(response).toMatch(/\./);
      
      // Should contain adjective + noun combinations typical of poetic language
      expect(response).toMatch(/\b(purple|golden|silver|crimson|emerald|azure|electric|infinite|eternal|ancient|broken|perfect)\s+\w+/);
    });

    it('should use word associations when provided input concepts', async () => {
      const model = new RacterModel();
      let foundAssociation = false;
      
      // Test with a word that has known associations
      for (let i = 0; i < 8; i++) {
        const chunks: string[] = [];
        for await (const chunk of model.process('butterfly')) {
          chunks.push(chunk);
        }
        
        const response = chunks[0].toLowerCase();
        // Check for butterfly associations: wings, transformation, flower, flight, metamorphosis
        if (response.includes('wing') || 
            response.includes('transformation') || 
            response.includes('flower') ||
            response.includes('flight') ||
            response.includes('metamorphosis')) {
          foundAssociation = true;
          break;
        }
      }
      
      expect(foundAssociation).toBe(true);
    });
  });
});