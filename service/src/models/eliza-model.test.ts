import { describe, it, expect } from "vitest";
import { ElizaModel } from "./eliza-model.js";
import { getResponse } from "../../tests/test-helpers.js";

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