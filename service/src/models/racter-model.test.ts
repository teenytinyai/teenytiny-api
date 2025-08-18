import { describe, it, expect } from "vitest";
import { RacterModel } from "./racter-model.js";
import {
  getResponse,
  getChunks,
} from "../../tests/test-helpers.js";

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