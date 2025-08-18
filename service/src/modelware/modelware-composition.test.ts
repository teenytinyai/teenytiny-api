import { describe, it, expect } from "vitest";
import { DelayModelware } from "./delay-modelware.js";
import { StreamSplitModelware } from "./stream-split-modelware.js";
import { EchoModel } from "../models/echo-model.js";

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