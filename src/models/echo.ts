import type {
  ChatCompletionRequest,
  ChatCompletionResponse,
  ChatCompletionStreamResponse,
  ChatCompletionMessage,
} from '../types/openai.js';
import {
  generateChatCompletionId,
  getCurrentTimestamp,
} from '../types/openai.js';
import { ChatModel, estimateTokens } from './base.js';

export class EchoModel implements ChatModel {
  readonly id = 'echo';
  readonly ownedBy = 'teenytiny-ai';
  readonly created = getCurrentTimestamp();

  async complete(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    // Add a small delay to simulate processing
    await new Promise(resolve => setTimeout(resolve, 100));

    const lastUserMessage = this.getLastUserMessage(request.messages);
    const responseContent = lastUserMessage || 
      "Hello! I'm the Echo model. Send me a message and I'll echo it back.";

    const promptTokens = this.calculatePromptTokens(request.messages);
    const completionTokens = this.countTokens(responseContent);

    return {
      id: generateChatCompletionId(),
      object: 'chat.completion',
      created: getCurrentTimestamp(),
      model: this.id,
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
    const lastUserMessage = this.getLastUserMessage(request.messages);
    const responseContent = lastUserMessage || 
      "Hello! I'm the Echo model. Send me a message and I'll echo it back.";

    const promptTokens = this.calculatePromptTokens(request.messages);
    const completionTokens = this.countTokens(responseContent);

    const id = generateChatCompletionId();
    const created = getCurrentTimestamp();

    // Send initial chunk with role
    yield {
      id,
      object: 'chat.completion.chunk',
      created,
      model: this.id,
      choices: [
        {
          index: 0,
          delta: { role: 'assistant' },
        },
      ],
    };

    // Stream the response word by word
    const words = responseContent.split(' ');
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const content = i === 0 ? word : ` ${word}`;

      yield {
        id,
        object: 'chat.completion.chunk',
        created,
        model: this.id,
        choices: [
          {
            index: 0,
            delta: { content: content },
          },
        ],
      };

      // Small delay between words to simulate streaming
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    // Send final chunk with finish reason and usage
    yield {
      id,
      object: 'chat.completion.chunk',
      created,
      model: this.id,
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

  countTokens(text: string): number {
    return estimateTokens(text);
  }

  private getLastUserMessage(messages: ChatCompletionMessage[]): string {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i]?.role === 'user') {
        return messages[i]!.content;
      }
    }
    return '';
  }

  private calculatePromptTokens(messages: ChatCompletionMessage[]): number {
    let total = 0;
    for (const message of messages) {
      // Add some overhead for message formatting
      total += this.countTokens(`${message.role}: ${message.content}`) + 4;
    }
    return total;
  }
}