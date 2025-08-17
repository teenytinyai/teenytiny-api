// Simple text-based model interface
export interface Model {
  process(input: string): AsyncGenerator<string>;
}