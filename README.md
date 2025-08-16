# TeenyTiny AI

A lightweight, OpenAI-compatible chat completions API built for Cloudflare Workers and Node.js.

## What is this?

TeenyTiny AI is a drop-in replacement for OpenAI's chat completions API that can run anywhere - from Cloudflare's edge network to your local development environment. It's designed for developers who need a simple, reliable chat API that works with existing OpenAI-compatible tools and libraries.

**Who is this for?** Developers building AI-powered applications who want:
- A lightweight alternative to OpenAI's API
- Edge deployment capabilities with Cloudflare Workers  
- Local development without external dependencies
- Full control over their chat completion service

**Why choose TeenyTiny AI over alternatives?**
- 🚀 **Edge-first**: Designed for Cloudflare Workers with global low latency
- 🔧 **OpenAI Compatible**: Drop-in replacement for existing apps
- 📦 **Lightweight**: Minimal dependencies, fast cold starts
- 🛠️ **Developer Friendly**: Easy local development and testing
- 🔒 **Self-hosted**: Keep your data under your control

## 10 Second Tutorial

1. **Start the server:**
   ```bash
   npm run dev
   ```

2. **Make a request:**
   ```bash
   curl -X POST http://localhost:8080/v1/chat/completions \
     -H 'Authorization: Bearer tt-1234567890abcdef' \
     -H 'Content-Type: application/json' \
     -d '{"model": "echo", "messages": [{"role": "user", "content": "Hello!"}]}'
   ```

3. **Get the response:**
   ```json
   {
     "id": "chatcmpl-abc123",
     "object": "chat.completion", 
     "created": 1704067200,
     "model": "echo",
     "choices": [{
       "index": 0,
       "message": {"role": "assistant", "content": "Hello!"},
       "finish_reason": "stop"
     }],
     "usage": {"prompt_tokens": 2, "completion_tokens": 1, "total_tokens": 3}
   }
   ```

## Features

- ✅ **OpenAI Chat Completions API** - Full compatibility with existing tools
- ✅ **Streaming Support** - Real-time response streaming with SSE
- ✅ **Authentication** - Bearer token authentication 
- ✅ **CORS Support** - Ready for browser-based applications
- ✅ **Error Handling** - OpenAI-compatible error responses
- ✅ **Token Counting** - Usage tracking and billing information
- ✅ **Multiple Runtimes** - Cloudflare Workers, Node.js, and more
- ✅ **TypeScript** - Full type safety and great developer experience

## User Guide

### Installation & Setup

```bash
# Clone the repository
git clone https://github.com/teenytinyai/teenytiny-api
cd teenytiny-api

# Install dependencies
npm install

# Start development server
npm run dev

# Or build and run production
npm run build
npm start
```

### API Usage

The API is fully compatible with OpenAI's chat completions format:

#### Basic Chat Completion

```bash
curl -X POST http://localhost:8080/v1/chat/completions \
  -H 'Authorization: Bearer tt-1234567890abcdef' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "echo",
    "messages": [
      {"role": "user", "content": "What is the capital of France?"}
    ]
  }'
```

#### Streaming Chat Completion

```bash
curl -X POST http://localhost:8080/v1/chat/completions \
  -H 'Authorization: Bearer tt-1234567890abcdef' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "echo", 
    "messages": [{"role": "user", "content": "Tell me a story"}],
    "stream": true
  }'
```

#### List Available Models

```bash
curl -X GET http://localhost:8080/v1/models \
  -H 'Authorization: Bearer tt-1234567890abcdef'
```

### Using with the LLM CLI Tool

TeenyTiny AI works great with Simon Willison's [llm](https://llm.datasette.io) tool:

```bash
# Configure the API key
echo "tt-1234567890abcdef" | llm keys set teenytiny

# Set the API base URL
export LLM_USER_PATH=$HOME/.config/io.datasette.llm
mkdir -p $LLM_USER_PATH
echo '{"teenytiny": {"api_base": "http://localhost:8080/v1"}}' > $LLM_USER_PATH/extra-openai-models.json

# Use it!
llm -m teenytiny/echo "Hello, world!"
```

### Configuration

#### Local Development

```bash
# Run with custom port
npm run dev -- --port 3000

# Run with custom API key  
npm run dev -- --api-key your-secret-key
```

#### Environment Variables

For production deployments, you can use environment variables:

- `PORT` - Server port (default: 8080)
- `API_KEY` - Authentication key (default: tt-1234567890abcdef)

### Cloudflare Workers Deployment

1. **Install Wrangler:**
   ```bash
   npm install -g wrangler
   ```

2. **Configure your API key:**
   ```bash
   wrangler secret put API_KEY
   # Enter your API key when prompted
   ```

3. **Deploy:**
   ```bash
   npm run deploy
   ```

4. **Test your deployment:**
   ```bash
   curl -X POST https://your-worker.your-domain.workers.dev/v1/chat/completions \
     -H 'Authorization: Bearer your-api-key' \
     -H 'Content-Type: application/json' \
     -d '{"model": "echo", "messages": [{"role": "user", "content": "Hello!"}]}'
   ```

## Developer Guide

### Project Structure

```
src/
├── types/           # TypeScript type definitions
│   ├── openai.ts   # OpenAI API types
│   └── errors.ts   # Error handling types
├── models/          # Model implementations  
│   ├── base.ts     # Base model interface
│   └── echo.ts     # Echo model implementation
├── middleware/      # HTTP middleware
│   ├── auth.ts     # Authentication
│   ├── cors.ts     # CORS handling
│   ├── errors.ts   # Error handling
│   └── logging.ts  # Request logging
├── app.ts          # Main Hono application
├── server.ts       # Node.js server entry point
└── index.ts        # Cloudflare Worker entry point
```

### Adding New Models

1. **Create your model class:**
   ```typescript
   // src/models/my-model.ts
   import { ChatModel } from './base.js';
   
   export class MyModel implements ChatModel {
     readonly id = 'my-model';
     readonly ownedBy = 'your-org';
     readonly created = Date.now();
     
     async complete(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
       // Your implementation here
     }
     
     async *completeStream(request: ChatCompletionRequest): AsyncIterable<ChatCompletionStreamResponse> {
       // Your streaming implementation here
     }
     
     countTokens(text: string): number {
       // Your token counting logic
     }
   }
   ```

2. **Register your model:**
   ```typescript
   // src/app.ts
   import { MyModel } from './models/my-model.js';
   
   // In createApp function:
   registry.register(new MyModel());
   ```

### Running Tests

```bash
# Run tests in watch mode
npm test

# Run tests once
npm run test:ci

# Run with coverage
npm run test:ci -- --coverage
```

### Development Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Run production server
- `npm test` - Run tests in watch mode
- `npm run deploy` - Deploy to Cloudflare Workers
- `npm run cf:dev` - Run in Cloudflare Workers development mode

### Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for your changes
4. Ensure all tests pass
5. Submit a pull request

---

Built with ❤️ for the developer community. Questions? Open an issue on [GitHub](https://github.com/teenytinyai/teenytiny-api).