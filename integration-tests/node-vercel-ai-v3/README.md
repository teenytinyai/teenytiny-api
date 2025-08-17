# Node.js Vercel AI SDK v3 Integration Tests

Tests for TeenyTiny AI service compatibility with the Vercel AI SDK v3.

Here's how to use the Vercel AI SDK v3 with TeenyTiny AI in your own code:

```javascript
import { createOpenAI } from '@ai-sdk/openai';
import { generateText, streamText } from 'ai';

// Configure provider for TeenyTiny AI service
const provider = createOpenAI({
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

This test suite uses Vercel AI SDK v3.4.33, which is compatible with OpenAI API specification v1. TeenyTiny AI implements the v1 specification, making it fully compatible.

**Note**: Vercel AI SDK v5+ requires specification v2 and is not compatible with TeenyTiny AI's current implementation.
