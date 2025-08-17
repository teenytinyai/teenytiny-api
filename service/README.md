# TeenyTiny AI Service

The OpenAI-compatible chat completions API service built with TypeScript for Cloudflare Workers and Node.js.

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. Run tests:
   ```bash
   npm run test
   ```

2. **Start development server:**
   ```bash
   npm run dev
   ```

3. **Make a test request:**
   ```bash
   curl -X POST http://localhost:8080/v1/chat/completions \
     -H 'Authorization: Bearer tt-1234567890abcdef' \
     -H 'Content-Type: application/json' \
     -d '{"model": "echo", "messages": [{"role": "user", "content": "Hello!"}]}'
   ```

## API Usage

The API is compatible with OpenAI's chat completions format:

### List Available Models

```bash
curl -X GET http://localhost:8080/v1/models \
  -H 'Authorization: Bearer tt-1234567890abcdef'
```

### Basic Chat Completion

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

### Streaming Chat Completion

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


## Using with the LLM CLI Tool

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

