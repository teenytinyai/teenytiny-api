import { describe, it, expect } from "vitest";
import { EchoModel } from "./echo-model.js";

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