# Rust OpenAI Integration Tests

Tests for TeenyTiny AI service compatibility with the async-openai Rust crate.

Here's how to use the async-openai crate with TeenyTiny AI in your own code:

```rust
use async_openai::{
    config::OpenAIConfig,
    types::{ChatCompletionRequestUserMessageArgs, CreateChatCompletionRequestArgs},
    Client,
};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Configure Rust OpenAI client for TeenyTiny AI
    let api_key = std::env::var("TEENYTINY_API_KEY")?;
    let config = OpenAIConfig::new()
        .with_api_key(api_key)
        .with_api_base("https://teenytiny.ai/v1");

    let client = Client::with_config(config);

    // Create user message
    let user_message = ChatCompletionRequestUserMessageArgs::default()
        .content("Hello World!")
        .build()?
        .into();

    // Basic completion
    let request = CreateChatCompletionRequestArgs::default()
        .model("echo")
        .messages([user_message])
        .build()?;

    let response = client.chat().create(request).await?;

    if let Some(content) = &response.choices[0].message.content {
        println!("{}", content);
    }

    Ok(())
}
```
