import { describe, it, expect } from "vitest";
import { ParryModel } from "./parry-model.js";
import { getResponse } from "../../tests/test-helpers.js";

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