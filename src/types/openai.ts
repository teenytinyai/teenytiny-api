// OpenAI-compatible API types for chat completions

export interface ChatCompletionMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionRequest {
  model: string;
  messages: ChatCompletionMessage[];
  stream?: boolean;
  user?: string;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  n?: number;
  stop?: string | string[];
}

export interface ChatCompletionUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface ChatCompletionChoice {
  index: number;
  message: ChatCompletionMessage;
  finish_reason: 'stop' | 'length' | 'content_filter' | null;
}

export interface ChatCompletionResponse {
  id: string;
  object: 'chat.completion';
  created: number;
  model: string;
  choices: ChatCompletionChoice[];
  usage: ChatCompletionUsage;
}

// Streaming types
export interface ChatCompletionStreamDelta {
  role?: 'assistant' | undefined;
  content?: string | undefined;
}

export interface ChatCompletionStreamChoice {
  index: number;
  delta: ChatCompletionStreamDelta;
  finish_reason?: 'stop' | 'length' | 'content_filter' | null;
}

export interface ChatCompletionStreamResponse {
  id: string;
  object: 'chat.completion.chunk';
  created: number;
  model: string;
  choices: ChatCompletionStreamChoice[];
  usage?: ChatCompletionUsage;
}

// Models API types
export interface Model {
  id: string;
  object: 'model';
  created: number;
  owned_by: string;
}

export interface ModelsResponse {
  object: 'list';
  data: Model[];
}

// Error types
export interface ErrorDetail {
  message: string;
  type: string;
  param?: string | undefined;
  code?: string | undefined;
}

export interface ErrorResponse {
  error: ErrorDetail;
}

// Utility types
export type APIResponse<T> = T | ErrorResponse;

// Type guards
export function isErrorResponse(response: any): response is ErrorResponse {
  return response && typeof response === 'object' && 'error' in response;
}

// ID generation
export function generateChatCompletionId(): string {
  return `chatcmpl-${generateRandomString(29)}`;
}

export function generateRandomString(length: number): string {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return result;
}

export function getCurrentTimestamp(): number {
  return Math.floor(Date.now() / 1000);
}