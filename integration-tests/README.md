# TeenyTiny AI Integration Tests

Integration testing suite for TeenyTiny AI service compatibility with various client libraries and tools.

## Test Suites

| Suite | Language | Package |
| --- | --- | --- |
| **[python-openai](python-openai/)** | Python | [openai](https://github.com/openai/openai-python) |
| **[python-langchain](python-langchain/)** | Python | [langchain](https://python.langchain.com/docs/introduction/) |
| **[python-litellm](python-litellm/)** | Python | [litellm](https://docs.litellm.ai/#litellm-python-sdk) |
| **[node-openai](node-openai/)** | JavaScript (Node.js) | [openai](https://github.com/openai/openai-node) |
| **[node-vercel-ai-v4](node-vercel-ai-v4/)** | JavaScript (Node.js) | [ai](https://ai-sdk.dev/) (v4) |
| **[node-vercel-ai-v5](node-vercel-ai-v5/)** | JavaScript (Node.js) | [ai](https://v5.ai-sdk.dev/) (v5) |
| **[java-openai](java-openai/)** | Java | [com.openai](https://github.com/openai/openai-java) |
| **[java-spring-ai](java-spring-ai/)** | Java | [org.springframework.ai](https://docs.spring.io/spring-ai/reference/) |
| **[go-openai](go-openai/)** | Go | [github.com/sashabaranov/go-openai](https://github.com/sashabaranov/go-openai) |
| **[ruby-openai](ruby-openai/)** | Ruby | [openai](https://github.com/alexrudall/ruby-openai) |
| **[rust-openai](rust-openai/)** | Rust | [async-openai](https://docs.rs/async-openai/latest/async_openai/) |

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

Default configuration is to test against the local development service.

```bash
# If unset, these are the assumed defaults
export TEENYTINY_URL=http://localhost:8080
export TEENYTINY_API_KEY=testkey
```

Alternatively, to test the prod/qa service:

```bash
export TEENYTINY_URL=http://qa.teenytiny.ai
export TEENYTINY_API_KEY=<valid key>
```


## Test Strategy

All tests use the predictable "echo" model which simply returns the same text as passed in,
ensuring test cases are predictable, while also being able to complete end-to-end integration.

