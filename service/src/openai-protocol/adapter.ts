import type {
  ChatCompletionRequest,
  ChatCompletionResponse,
  ChatCompletionStreamResponse,
  ChatCompletionMessage,
} from './types.js';
import {
  generateChatCompletionId,
  getCurrentTimestamp,
} from './types.js';
import { Model } from '../models/model.js';

export class OpenAIAdapter {
  constructor(private model: Model, private modelId: string) {}

  async complete(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    const input = this.extractTextFromMessages(request.messages);
    
    // Collect all chunks from the streaming model
    const chunks: string[] = [];
    for await (const chunk of this.model.process(input)) {
      chunks.push(chunk);
    }
    
    const responseContent = chunks.join('').trim();
    const promptTokens = this.estimateTokens(input);
    const completionTokens = this.estimateTokens(responseContent);

    return {
      id: generateChatCompletionId(),
      object: 'chat.completion',
      created: getCurrentTimestamp(),
      model: this.modelId,
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: responseContent,
          },
          finish_reason: 'stop',
        },
      ],
      usage: {
        prompt_tokens: promptTokens,
        completion_tokens: completionTokens,
        total_tokens: promptTokens + completionTokens,
      },
    };
  }

  async *completeStream(request: ChatCompletionRequest): AsyncIterable<ChatCompletionStreamResponse> {
    const input = this.extractTextFromMessages(request.messages);
    const id = generateChatCompletionId();
    const created = getCurrentTimestamp();

    // Send initial chunk with role
    yield {
      id,
      object: 'chat.completion.chunk',
      created,
      model: this.modelId,
      choices: [
        {
          index: 0,
          delta: { role: 'assistant' },
        },
      ],
    };

    // Stream content chunks
    let totalContent = '';
    for await (const chunk of this.model.process(input)) {
      totalContent += chunk;
      
      yield {
        id,
        object: 'chat.completion.chunk',
        created,
        model: this.modelId,
        choices: [
          {
            index: 0,
            delta: { content: chunk },
          },
        ],
      };
    }

    // Send final chunk with finish reason and usage
    const promptTokens = this.estimateTokens(input);
    const completionTokens = this.estimateTokens(totalContent.trim());

    yield {
      id,
      object: 'chat.completion.chunk',
      created,
      model: this.modelId,
      choices: [
        {
          index: 0,
          delta: {},
          finish_reason: 'stop',
        },
      ],
      usage: {
        prompt_tokens: promptTokens,
        completion_tokens: completionTokens,
        total_tokens: promptTokens + completionTokens,
      },
    };
  }

  private extractTextFromMessages(messages: ChatCompletionMessage[]): string {
    // Find the last user message
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i]?.role === 'user') {
        return messages[i]!.content;
      }
    }
    return '';
  }

  private estimateTokens(text: string): number {
    // Simple estimation: roughly 1 token per 4 characters
    return Math.ceil(text.trim().length / 4);
  }
}