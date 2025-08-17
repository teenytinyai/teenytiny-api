# Node.js Vercel AI SDK v4 Integration Tests

Tests for TeenyTiny AI service compatibility with the Vercel AI SDK v4.

Here's how to use the Vercel AI SDK v4 with TeenyTiny AI in your own code:

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

**Note**: This uses Vercel AI SDK v4. Vercel AI SDK v5+ is not compatible with TeenyTiny AI's current implementation.
