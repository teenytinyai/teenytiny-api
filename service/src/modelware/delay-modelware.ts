import { Model } from '../models/model.js';

export class DelayModelware implements Model {
  constructor(
    private model: Model,
    private delayMs: number = 50
  ) {}

  async *process(input: string): AsyncGenerator<string> {
    for await (const chunk of this.model.process(input)) {
      yield chunk;
      await new Promise(resolve => setTimeout(resolve, this.delayMs));
    }
  }
}