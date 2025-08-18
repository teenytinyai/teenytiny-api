import { describe, it, expect } from "vitest";
import { StreamSplitModelware } from "./stream-split-modelware.js";
import { EchoModel } from "../models/echo-model.js";

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