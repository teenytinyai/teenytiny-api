use async_openai::types::{
    ChatCompletionRequestMessage, ChatCompletionRequestSystemMessageArgs,
    ChatCompletionRequestUserMessageArgs,
};
use anyhow::Result;

mod basic;
mod streaming;
mod auth_errors;
mod options;

pub async fn run_basic_tests() -> Result<()> {
    println!("Running basic completion tests...");
    basic::test_basic_completion().await?;
    basic::test_multi_message_conversation().await?;
    basic::test_system_prompt_with_user_message().await?;
    basic::test_system_only_returns_default().await?;
    basic::test_response_structure().await?;
    basic::test_empty_message_handling().await?;
    basic::test_special_characters_and_unicode().await?;
    basic::test_multiline_content().await?;
    println!("✅ Basic tests passed");
    Ok(())
}

pub async fn run_streaming_tests() -> Result<()> {
    println!("Running streaming tests...");
    streaming::test_basic_streaming_completion().await?;
    streaming::test_streaming_content_reconstruction().await?;
    streaming::test_streaming_with_multiline_content().await?;
    streaming::test_streaming_with_special_characters().await?;
    streaming::test_streaming_response_structure().await?;
    println!("✅ Streaming tests passed");
    Ok(())
}

pub async fn run_auth_error_tests() -> Result<()> {
    println!("Running authentication error tests...");
    auth_errors::test_missing_api_key().await?;
    auth_errors::test_invalid_api_key().await?;
    auth_errors::test_empty_messages_array().await?;
    auth_errors::test_streaming_with_invalid_api_key().await?;
    println!("✅ Authentication error tests passed");
    Ok(())
}

pub async fn run_options_tests() -> Result<()> {
    println!("Running options and configuration tests...");
    options::test_custom_temperature_parameter().await?;
    options::test_custom_max_tokens_parameter().await?;
    options::test_multiple_parameters_combined().await?;
    options::test_streaming_with_parameters().await?;
    options::test_user_parameter_in_request().await?;
    options::test_frequency_and_presence_penalty_parameters().await?;
    println!("✅ Options tests passed");
    Ok(())
}

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