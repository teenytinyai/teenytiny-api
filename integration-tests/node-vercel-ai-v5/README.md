# Node.js Vercel AI SDK v5 Integration Tests

Tests for TeenyTiny AI service compatibility with the Vercel AI SDK v5.

Here's how to use the Vercel AI SDK v5 with TeenyTiny AI in your own code:

```javascript
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { generateText, streamText } from 'ai';

// Configure provider for TeenyTiny AI service
const provider = createOpenAICompatible({
  name: 'teenytiny',
  baseURL: 'https://teenytiny.ai/v1',
  apiKey: 'testkey'
});

const model = provider('echo');

const { text } = await generateText({
  model: model,
  prompt: 'Hello World!'
});

console.log(text);
```


## Version Compatibility

**Note**: This uses Vercel AI SDK v5 with `@ai-sdk/openai-compatible`. Use this package instead of `@ai-sdk/openai` for OpenAI-compatible services like TeenyTiny AI.
