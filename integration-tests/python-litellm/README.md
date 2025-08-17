# LiteLLM Integration Tests

Tests for TeenyTiny AI service compatibility with the LiteLLM framework.

Here's how to use LiteLLM with TeenyTiny AI in your own code:

```python
import litellm

# Basic completion with custom endpoint
response = litellm.completion(
    model="openai/echo",  # Use openai/ prefix for custom endpoints
    messages=[{"role": "user", "content": "Hello World"}],
    api_base="https://teenytiny.ai/v1",
    api_key="your-api-key"
)
print(response.choices[0].message.content)
```