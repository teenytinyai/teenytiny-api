# Python OpenAI SDK Integration Tests

Tests for TeenyTiny AI service compatibility with the official OpenAI Python SDK.

## Quick Start

Just run the tests (defaults to localhost:8080 with API key "testkey"):
```bash
./test
```

Or set custom environment variables:
```bash
export TEENYTINY_URL=https://your-service.com
export TEENYTINY_API_KEY=your-api-key
./test
```

## Usage Example

Here's how to use the OpenAI Python SDK with TeenyTiny AI in your own code:

```python
import os
from openai import OpenAI

# Configure client for TeenyTiny AI service
client = OpenAI(
    base_url="https://teenytiny.ai/v1",   # Your TeenyTiny AI service URL
    api_key=os.getenv("TEENYTINY_API_KEY") # Your API key from environment variable
)

# Basic completion
response = client.chat.completions.create(
    model="echo",
    messages=[
        {"role": "user", "content": "Hello World"}
    ]
)

print(response.choices[0].message.content)  # Outputs: "Hello World"

# Streaming completion
stream = client.chat.completions.create(
    model="echo",
    messages=[
        {"role": "user", "content": "Hello World"}
    ],
    stream=True
)

for chunk in stream:
    if chunk.choices[0].delta.content:
        print(chunk.choices[0].delta.content, end="")
```

## Test Coverage

- **Basic Completions**: Non-streaming chat completions with echo model
- **Streaming**: Server-sent events streaming completions
- **Models**: Listing available models
- **Authentication**: Valid and invalid API key scenarios
- **Error Handling**: Invalid requests, missing parameters, malformed data
- **Echo Behavior**: Verification of echo model's predictable responses

