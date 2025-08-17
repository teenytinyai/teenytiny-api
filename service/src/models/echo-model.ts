import { Model } from './model.js';

export class EchoModel implements Model {
  async *process(input: string): AsyncGenerator<string> {
    const response = input || "Hello! I'm the Echo model. Send me a message and I'll echo it back.";
    
    const words = response.split(' ');
    for (let i = 0; i < words.length; i++) {
      yield words[i] + (i === words.length - 1 ? '' : ' ');
    }
  }
}