# Node.js OpenAI SDK Integration Tests

Tests for TeenyTiny AI service compatibility with the official OpenAI Node.js SDK.

Here's how to use the OpenAI SDK with TeenyTiny AI in your own code:

```javascript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: 'your-api-key',
  baseURL: 'https://teenytiny.ai/v1'
});

// Basic completion
const completion = await openai.chat.completions.create({
  model: 'echo',
  messages: [
    { role: 'user', content: 'Hello World!' }
  ],
});

console.log(completion.choices[0].message.content);
```

