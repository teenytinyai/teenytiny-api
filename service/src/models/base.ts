import type {
  ChatCompletionRequest,
  ChatCompletionResponse,
  ChatCompletionStreamResponse,
  Model,
} from '../types/openai.js';

// Base interface for all models
export interface ChatModel {
  readonly id: string;
  readonly ownedBy: string;
  readonly created: number;

  // Generate a non-streaming completion
  complete(request: ChatCompletionRequest): Promise<ChatCompletionResponse>;

  // Generate a streaming completion
  completeStream(request: ChatCompletionRequest): AsyncIterable<ChatCompletionStreamResponse>;

  // Estimate token count for text
  countTokens(text: string): number;
}

// Model registry
export class ModelRegistry {
  private models = new Map<string, ChatModel>();

  register(model: ChatModel): void {
    this.models.set(model.id, model);
  }

  get(id: string): ChatModel | undefined {
    return this.models.get(id);
  }

  list(): Model[] {
    return Array.from(this.models.values()).map(model => ({
      id: model.id,
      object: 'model' as const,
      created: model.created,
      owned_by: model.ownedBy,
    }));
  }

  has(id: string): boolean {
    return this.models.has(id);
  }
}

// Utility function for token estimation (simple heuristic)
export function estimateTokens(text: string): number {
  // Simple estimation: roughly 1 token per 4 characters
  // This is a rough approximation, real tokenizers are more complex
  return Math.ceil(text.trim().length / 4);
}