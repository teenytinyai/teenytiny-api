import { Model } from '../models/model.js';

export class StreamSplitModelware implements Model {
  // Common split patterns
  static readonly WORDS = /(\s+)/;
  static readonly SENTENCES = /([.!?]+\s*)/;
  static readonly PUNCTUATION = /([.!?,:;]\s*)/;
  static readonly CHARACTERS = /(?=.)/;  // Split every character

  constructor(
    private model: Model,
    private splitPattern: RegExp = StreamSplitModelware.WORDS
  ) {}

  async *process(input: string): AsyncGenerator<string> {
    for await (const chunk of this.model.process(input)) {
      if (this.splitPattern === StreamSplitModelware.WORDS) {
        // Special handling for WORDS to match original EchoModel behavior
        const words = chunk.split(' ');
        for (let i = 0; i < words.length; i++) {
          const word = words[i];
          const content = i === 0 ? word : ` ${word}`;
          yield content;
        }
      } else {
        // Split the chunk but keep the delimiters for other patterns
        const parts = chunk.split(this.splitPattern);
        
        for (let i = 0; i < parts.length; i++) {
          const part = parts[i];
          if (part) {  // Skip empty strings
            yield part;
          }
        }
      }
    }
  }
}