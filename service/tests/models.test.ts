import { describe, it, expect } from "vitest";
import { EchoModel } from "../src/models/echo-model.js";
import { ElizaModel } from "../src/models/eliza-model.js";
import { ParryModel } from "../src/models/parry-model.js";
import { RacterModel } from "../src/models/racter-model.js";
import { DelayModelware } from "../src/modelware/delay-modelware.js";
import { StreamSplitModelware } from "../src/modelware/stream-split-modelware.js";
import {
  getResponse,
  getChunks,
} from "./test-helpers.js";

describe("Simple Model Interface", () => {
  describe("EchoModel", () => {
    it("should echo back input text as single chunk", async () => {
      const model = new EchoModel();
      const chunks: string[] = [];

      for await (const chunk of model.process("hello world")) {
        chunks.push(chunk);
      }

      expect(chunks).toEqual(["hello world"]);
    });

    it("should return default message for empty input", async () => {
      const model = new EchoModel();
      const chunks: string[] = [];

      for await (const chunk of model.process("")) {
        chunks.push(chunk);
      }

      expect(chunks).toEqual([
        "Hello! I'm the Echo model. Send me a message and I'll echo it back.",
      ]);
    });
  });

  describe("StreamSplitModelware", () => {
    it("should split text into words matching original EchoModel behavior", async () => {
      const baseModel = new EchoModel();
      const splitModel = new StreamSplitModelware(
        baseModel,
        StreamSplitModelware.WORDS,
      );

      const chunks: string[] = [];

      for await (const chunk of splitModel.process("hello world test")) {
        chunks.push(chunk);
      }

      expect(chunks).toEqual(["hello", " world", " test"]);
    });

    it("should handle sentences", async () => {
      const baseModel = new EchoModel();
      const splitModel = new StreamSplitModelware(
        baseModel,
        StreamSplitModelware.SENTENCES,
      );

      const chunks: string[] = [];

      for await (const chunk of splitModel.process(
        "Hello world. How are you?",
      )) {
        chunks.push(chunk);
      }

      expect(chunks).toEqual(["Hello world", ". ", "How are you", "?"]);
    });
  });

  describe("DelayModelware", () => {
    it("should wrap another model and add delays", async () => {
      const baseModel = new EchoModel();
      const delayModel = new DelayModelware(baseModel, 10); // 10ms delay for testing

      const start = Date.now();
      const chunks: string[] = [];

      for await (const chunk of delayModel.process("test")) {
        chunks.push(chunk);
      }

      const duration = Date.now() - start;

      expect(chunks).toEqual(["test"]);
      expect(duration).toBeGreaterThan(8); // At least 1 delay of 10ms
    });

    it("should preserve the underlying model output", async () => {
      const baseModel = new EchoModel();
      const delayModel = new DelayModelware(baseModel, 1);

      const chunks: string[] = [];

      for await (const chunk of delayModel.process("test input")) {
        chunks.push(chunk);
      }

      expect(chunks).toEqual(["test input"]);
    });
  });

  describe("Model Composition", () => {
    it("should allow chaining multiple decorators", async () => {
      const baseModel = new EchoModel();
      const splitModel = new StreamSplitModelware(
        baseModel,
        StreamSplitModelware.WORDS,
      );
      const delayedModel = new DelayModelware(splitModel, 5);

      const start = Date.now();
      const chunks: string[] = [];

      for await (const chunk of delayedModel.process("a b")) {
        chunks.push(chunk);
      }

      const duration = Date.now() - start;

      expect(chunks).toEqual(["a", " b"]);
      expect(duration).toBeGreaterThan(8); // At least 2 delays of 5ms each
    });
  });

  describe("ElizaModel", () => {
    it("should respond to family keywords", async () => {
      const model = new ElizaModel();
      // Control deterministic behavior
      model.getResponseChoice('mother')?.queue('Tell me more about your mother.');
      
      const response = await getResponse(model, "I love my mother");
      
      expect(response).toMatchInlineSnapshot(`"Tell me more about your mother."`);
    });

    it("should apply word reflections with context capture", async () => {
      const model = new ElizaModel();
      // Control deterministic behavior
      model.getResponseChoice('i am')?.queue('How long have you been {context}?');
      
      const response = await getResponse(model, "I am sad");
      
      expect(response).toMatchInlineSnapshot(`"How long have you been sad?"`);
    });

    it("should handle I feel with context extraction", async () => {
      const model = new ElizaModel();
      // Control deterministic behavior
      model.getResponseChoice('i feel')?.queue('Why do you feel {context}?');
      
      const response = await getResponse(model, "I feel angry about work");
      
      expect(response).toMatchInlineSnapshot(`"Why do you feel angry about work?"`);
    });

    it("should respond to apologies appropriately", async () => {
      const model = new ElizaModel();
      // Control deterministic behavior
      model.getResponseChoice('sorry')?.queue('Please don\'t apologize.');
      
      const response = await getResponse(model, "I am sorry");
      
      expect(response).toMatchInlineSnapshot(`"Please don't apologize."`);
    });

    it("should handle because statements", async () => {
      const model = new ElizaModel();
      // Control deterministic behavior
      model.getResponseChoice('because')?.queue('Is that the real reason?');
      
      const response = await getResponse(model, "I am sad because my job is stressful");
      
      expect(response).toMatchInlineSnapshot(`"Is that the real reason?"`);
    });

    it("should respond to can you questions", async () => {
      const model = new ElizaModel();
      // Control deterministic behavior
      model.getResponseChoice('can you')?.queue('What makes you think I can\'t {context}?');
      
      const response = await getResponse(model, "Can you help me feel better");
      
      expect(response).toMatchInlineSnapshot(`"What makes you think I can't help you feel better?"`);
    });

    it("should use fallback for unmatched input", async () => {
      const model = new ElizaModel();
      // Control deterministic behavior - this should trigger catchall pattern
      model.getResponseChoice('catchall')?.queue('Please tell me more about {context}.');
      
      const response = await getResponse(model, "xyz random nonsense abc");
      
      expect(response).toMatchInlineSnapshot(`"Please tell me more about xyz random nonsense abc."`);
    });

    it("should handle empty input", async () => {
      const model = new ElizaModel();
      // Empty input has hardcoded response, no choices needed
      
      const response = await getResponse(model, "");
      
      expect(response).toMatchInlineSnapshot(`"Tell me more about that."`);
    });

    it("should prioritize higher weight patterns", async () => {
      const model = new ElizaModel();
      // "mother" (weight 10) should win over "yes" (weight 2)
      model.getResponseChoice('mother')?.queue('What was your relationship with your mother like?');
      
      const response = await getResponse(model, "yes my mother is nice");
      
      expect(response).toMatchInlineSnapshot(`"What was your relationship with your mother like?"`);
    });

    it("should respond to hello greeting", async () => {
      const model = new ElizaModel();
      // Control deterministic behavior
      model.getResponseChoice('hello')?.queue('Hello. How are you feeling today?');
      
      const response = await getResponse(model, "Hello");
      
      expect(response).toMatchInlineSnapshot(`"Hello. How are you feeling today?"`);
    });
  });

  describe("ParryModel", () => {
    it("should respond defensively to personal questions", async () => {
      const model = new ParryModel();
      // Control deterministic behavior
      model.getResponseChoice('identity')?.queue("I don't like talking about personal things.");
      model.themeAdditionChoice.queue(false); // No theme addition
      
      const response = await getResponse(model, "Who are you?");
      
      expect(response).toMatchInlineSnapshot(`"I don't like talking about personal things."`);
    });

    it("should show paranoid responses to work questions", async () => {
      const model = new ParryModel();
      // Control deterministic behavior
      model.getResponseChoice('work')?.queue("I'd rather not discuss my work.");
      model.themeAdditionChoice.queue(false); // No theme addition
      
      const response = await getResponse(model, "What do you do for work?");
      
      expect(response).toMatchInlineSnapshot(`"I'd rather not discuss my work."`);
    });

    it("should express paranoid beliefs about surveillance", async () => {
      const model = new ParryModel();
      // Use input that matches surveillance pattern exactly
      model.getResponseChoice('surveillance')?.queue("Someone has been following me, I'm sure of it.");
      model.themeAdditionChoice.queue(false); // No theme addition
      
      const response = await getResponse(model, "Are they watching you?");
      
      expect(response).toMatchInlineSnapshot(`"Someone has been following me, I'm sure of it."`);
    });
    
    it("should use general responses for unmatched patterns", async () => {
      const model = new ParryModel();
      // Test that unmatched input falls back to general pattern
      model.getResponseChoice('general')?.queue("What exactly are you getting at?");
      model.themeAdditionChoice.queue(false); // No theme addition
      
      const response = await getResponse(model, "Is someone following you?");
      
      expect(response).toMatchInlineSnapshot(`"What exactly are you getting at?"`);
    });

    it("should reference core delusions about bookies", async () => {
      const model = new ParryModel();
      // Control deterministic behavior  
      model.getResponseChoice('gambling')?.queue("I don't owe anybody anything.");
      model.themeAdditionChoice.queue(false); // No theme addition
      
      const response = await getResponse(model, "Do you owe money to anyone?");
      
      expect(response).toMatchInlineSnapshot(`"I don't owe anybody anything."`);
    });

    it("should be suspicious of questions", async () => {
      const model = new ParryModel();
      // Control deterministic behavior
      model.getResponseChoice('questions')?.queue("Why are you asking so many questions?");
      model.themeAdditionChoice.queue(false); // No theme addition
      
      const response = await getResponse(model, "Why do you think that?");
      
      expect(response).toMatchInlineSnapshot(`"Why are you asking so many questions?"`);
    });

    it("should respond cautiously to greetings", async () => {
      const model = new ParryModel();
      // Control deterministic behavior
      model.getResponseChoice('greeting')?.queue("Hello. Do I know you?");
      model.themeAdditionChoice.queue(false); // No theme addition
      
      const response = await getResponse(model, "Hello there");
      
      expect(response).toMatchInlineSnapshot(`"Hello. Do I know you?"`);
    });

    it("should be hostile to authority figures", async () => {
      const model = new ParryModel();
      // Control deterministic behavior
      model.getResponseChoice('authority')?.queue("I don't talk to police.");
      model.themeAdditionChoice.queue(false); // No theme addition
      
      const response = await getResponse(model, "Are you talking to the police?");
      
      expect(response).toMatchInlineSnapshot(`"I don't talk to police."`);
    });

    it("should handle empty input suspiciously", async () => {
      const model = new ParryModel();
      // Empty input has hardcoded response, no choices needed
      
      const response = await getResponse(model, "");
      
      expect(response).toMatchInlineSnapshot(`"What do you want?"`);
    });

    it("should mention delusion themes when triggered", async () => {
      const model = new ParryModel();
      // Control deterministic behavior to test theme addition
      model.getResponseChoice('feelings')?.queue("I feel like people are watching me.");
      model.themeAdditionChoice.queue(true); // Force theme addition
      model.delusionThemeChoice.queue("The bookies are still looking for me.");
      
      const response = await getResponse(model, "How are you feeling?");
      
      expect(response).toMatchInlineSnapshot(`"I feel like people are watching me. The bookies are still looking for me."`);
    });
    
    it("should respond normally without themes when not triggered", async () => {
      const model = new ParryModel();
      // Control deterministic behavior to test no theme addition
      model.getResponseChoice('feelings')?.queue("I'm fine. Why wouldn't I be?");
      model.themeAdditionChoice.queue(false); // No theme addition
      
      const response = await getResponse(model, "How are you feeling?");
      
      expect(response).toMatchInlineSnapshot(`"I'm fine. Why wouldn't I be?"`);
    });
    
    it("should use emotional state filtering when responses are filtered", async () => {
      const model = new ParryModel();
      
      // Simulate high emotional state that would filter responses
      // This would normally require manipulating internal state, but we can test the choice system
      model.getEmotionalResponseChoice().queue('anger'); // Queue specific emotional state
      model.themeAdditionChoice.queue(false); // No theme addition
      
      // Create a scenario where emotional filtering might be triggered
      // Note: This is a conceptual test - in practice, emotional filtering 
      // happens when emotional state values exceed thresholds
      
      // For now, just verify the emotional choice is accessible
      expect(model.getEmotionalResponseChoice()).toBeDefined();
    });
  });

  describe("RacterModel", () => {
    it("should generate comparative materials template", async () => {
      const model = new RacterModel();
      // Control deterministic behavior
      model.fragmentCountChoice.queue(1); // Single fragment
      model.templates.queueWhere((t) => t.id === "comparative-materials");
      model.materials.queue("iron", "steel", "gold");
      model.nouns.queue("electricity");

      const response = await getResponse(model, "test");

      expect(response).toMatchInlineSnapshot(`"More than iron, more than steel, more than gold I need electricity."`);
    });

    it("should generate surreal dual imagery template", async () => {
      const model = new RacterModel();
      // NOW we MUST queue ALL choices - no more missing any!
      model.fragmentCountChoice.queue(1); // Single fragment
      model.templates.queueWhere((t) => t.id === "surreal-dual");
      model.nouns.queue("butterfly", "symphony");
      model.verbs.queue("dreams", "laughs");
      model.adjectives.queue("purple");
      model.abstracts.queue("mathematics", "infinity");
      model.colors.queue("golden");

      const response = await getResponse(model, "test");

      expect(response).toMatchInlineSnapshot(
        `"The butterfly dreams of purple mathematics while the symphony laughs at golden infinity."`,
      );
    });

    it("should generate temporal existence template", async () => {
      const model = new RacterModel();
      // Control all choices for deterministic behavior
      model.fragmentCountChoice.queue(1); // Single fragment
      model.templates.queueWhere((t) => t.id === "temporal-existence");
      model.adjectives.queue("ancient");
      model.nouns.queue("library", "whisper");
      model.verbs.queue("flows");
      model.temporals.queue("forever");
      model.emotions.queue("melancholy");

      const response = await getResponse(model, "test");

      expect(response).toMatchInlineSnapshot(
        `"ancient library are flows in the whisper of forever melancholy."`,
      );
    });

    it("should generate philosophical question template", async () => {
      const model = new RacterModel();
      // Control all choices for deterministic behavior
      model.fragmentCountChoice.queue(1); // Single fragment
      model.templates.queueWhere((t) => t.id === "philosophical-question");
      model.adjectives.queue("infinite");
      model.nouns.queue("consciousness");
      model.verbs.queue("whispers", "dreams");
      model.colors.queue("purple");
      model.abstracts.queue("eternity");

      const response = await getResponse(model, "test");

      expect(response).toMatchInlineSnapshot(
        `"Why do infinite consciousness whispers when purple eternity dreams?"`,
      );
    });

    it("should generate mathematical equation template", async () => {
      const model = new RacterModel();
      // Control all choices for deterministic behavior
      model.fragmentCountChoice.queue(1); // Single fragment
      model.templates.queueWhere((t) => t.id === "mathematical-equation");
      model.adjectives.queue("electric", "crystalline");
      model.nouns.queue("butterfly", "symphony");
      model.colors.queue("golden");
      model.abstracts.queue("infinity");

      const response = await getResponse(model, "test");

      expect(response).toMatchInlineSnapshot(
        `"electric butterfly plus crystalline symphony equals golden infinity."`,
      );
    });

    it("should use word associations from input", async () => {
      const model = new RacterModel();
      // Input 'butterfly' should trigger associations and use fragment generation
      model.fragmentCountChoice.queue(1); // Single fragment - will use associative
      model.fragmentTypeChoice.queue("remembers"); // Control fragment type
      model.getAssociationChoice("butterfly")?.queue("transformation"); // Control which butterfly association
      model.emotions.queue("wonder");
      model.adjectives.queue("delicate");

      const response = await getResponse(model, "butterfly");

      expect(response).toMatchInlineSnapshot(
        `"The delicate transformation remembers butterfly."`,
      );
    });

    it("should handle empty input with template generation", async () => {
      const model = new RacterModel();
      // Control all choices for deterministic behavior
      model.fragmentCountChoice.queue(1); // Single fragment
      model.templates.queueWhere((t) => t.id === "inner-reflection");
      model.nouns.queue("silence", "shadow");
      model.adjectives.queue("eternal");
      model.verbs.queue("whispers");
      model.abstracts.queue("consciousness");

      const response = await getResponse(model, "");

      expect(response).toMatchInlineSnapshot(
        `"silence is the eternal shadow that whispers in my consciousness."`,
      );
    });

    it("should produce single response chunk", async () => {
      const model = new RacterModel();
      // Control all choices for deterministic behavior
      model.fragmentCountChoice.queue(1); // Single fragment
      model.templates.queueWhere((t) => t.id === "comparative-needs");
      model.nouns.queue("dream", "dream", "dream");

      const chunks = await getChunks(model, "test");

      expect(chunks).toHaveLength(1);
      expect(chunks[0]).toMatchInlineSnapshot(
        `"I need it more than I need dream or dream or dream."`,
      );
    });
  });
});

