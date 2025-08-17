use async_openai::{config::OpenAIConfig, Client};
use std::env;

// Helper function to setup client - used by tests
pub fn setup_client() -> Client<OpenAIConfig> {
    let base_url = env::var("TEENYTINY_URL").unwrap_or_else(|_| "http://localhost:8080".to_string());
    let api_key = env::var("TEENYTINY_API_KEY").unwrap_or_else(|_| "testkey".to_string());

    let config = OpenAIConfig::new()
        .with_api_key(api_key)
        .with_api_base(format!("{}/v1", base_url));

    Client::with_config(config)
}

// Test modules - these will be discovered by cargo test
#[cfg(test)]
mod tests {
    use async_openai::types::{
        ChatCompletionRequestMessage, ChatCompletionRequestSystemMessageArgs,
        ChatCompletionRequestUserMessageArgs,
    };

    // Helper function to create user message
    pub fn user_message(content: &str) -> ChatCompletionRequestMessage {
        ChatCompletionRequestUserMessageArgs::default()
            .content(content)
            .build()
            .unwrap()
            .into()
    }

    // Helper function to create system message
    pub fn system_message(content: &str) -> ChatCompletionRequestMessage {
        ChatCompletionRequestSystemMessageArgs::default()
            .content(content)
            .build()
            .unwrap()
            .into()
    }

    mod basic;
    mod streaming;
    mod auth_errors;
    mod options;
}