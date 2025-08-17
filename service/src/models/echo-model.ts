import { Model } from './model.js';

export class EchoModel implements Model {
  async *process(input: string): AsyncGenerator<string> {
    yield input || "Hello! I'm the Echo model. Send me a message and I'll echo it back.";
  }
}