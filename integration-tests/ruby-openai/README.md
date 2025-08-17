# Ruby OpenAI Gem Integration Tests

Tests for TeenyTiny AI service compatibility with the official Ruby OpenAI gem.

Here's how to use the Ruby OpenAI gem with TeenyTiny AI in your own code:

```ruby
require 'openai'

# Configure Ruby OpenAI client for TeenyTiny AI
client = OpenAI::Client.new(
  access_token: 'your-api-key',
  uri_base: 'https://teenytiny.ai'
)

# Basic completion
response = client.chat(
  parameters: {
    model: 'echo',
    messages: [
      { role: 'user', content: 'Hello World!' }
    ]
  }
)

puts response.dig('choices', 0, 'message', 'content')
```