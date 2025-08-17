# TeenyTiny AI Integration Tests

Comprehensive integration testing suite for TeenyTiny AI service compatibility with various OpenAI client libraries and tools.

## Quick Start

Run all integration tests:
```bash
./test-all
```

Or run individual test suites:
```bash
python-openai/test
```

## Configuration

Tests use environment variables with sensible defaults:

```bash
export TEENYTINY_URL=http://localhost:8080    # Default: localhost:8080
export TEENYTINY_API_KEY=testkey              # Default: testkey
```


## Test Suites

### python-openai/
Tests the official OpenAI Python SDK compatibility:
- Basic chat completions
- Streaming completions  
- Models endpoint
- Authentication and error handling
- Message validation

### python-langchain/
Tests LangChain framework integration:
- ChatOpenAI integration with custom base_url
- LangChain message abstractions (HumanMessage, SystemMessage, etc.)
- Chain composition with LCEL operators
- Streaming (sync and async)
- Usage metadata and token counting

### python-litellm/
Tests LiteLLM framework compatibility:
- Custom OpenAI-compatible endpoint integration
- LiteLLM's unified API across providers
- Streaming and async operations
- Utility functions (token counting, cost calculation)
- Callback and logging features

## Adding New Test Suites

1. Create a new directory (e.g., `curl/`, `node-openai/`, etc.)
2. Add an executable `test` script in that directory
3. The script should:
   - Use `TEENYTINY_URL` and `TEENYTINY_API_KEY` environment variables
   - Exit with code 0 on success, non-zero on failure
   - Test core OpenAI API compatibility

The `./test-all` launcher will automatically discover and run your new test suite.

## Test Strategy

All tests use the predictable "echo" model which:
- Returns the last user message from the conversation
- Provides deterministic responses for reliable testing
- Supports both streaming and non-streaming modes

This allows testing API compatibility without depending on external AI services.

## Example Test Patterns

**Basic Completion Test:**
```python
response = client.chat.completions.create(
    model="echo",
    messages=[{"role": "user", "content": "Hello World"}]
)
assert response.choices[0].message.content == "Hello World"
```

**Authentication Test:**
```python
with pytest.raises(AuthenticationError):
    invalid_client.chat.completions.create(
        model="echo", 
        messages=[{"role": "user", "content": "test"}]
    )
```
