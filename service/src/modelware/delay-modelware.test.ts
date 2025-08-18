import { describe, it, expect } from "vitest";
import { DelayModelware } from "./delay-modelware.js";
import { EchoModel } from "../models/echo-model.js";

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