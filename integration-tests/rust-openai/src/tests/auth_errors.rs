use async_openai::{config::OpenAIConfig, types::CreateChatCompletionRequestArgs, Client};
use anyhow::{anyhow, Result};
use futures::StreamExt;
use std::env;

use super::user_message;

fn setup_client_with_key(api_key: &str) -> Client<OpenAIConfig> {
    let base_url = env::var("TEENYTINY_URL").unwrap_or_else(|_| "http://localhost:8080".to_string());
    
    let config = OpenAIConfig::new()
        .with_api_key(api_key)
        .with_api_base(format!("{}/v1", base_url));

    Client::with_config(config)
}

pub async fn test_missing_api_key() -> Result<()> {
    let client = setup_client_with_key("");  // Empty API key

    let request = CreateChatCompletionRequestArgs::default()
        .model("echo")
        .messages([user_message("Test message")])
        .build()?;

    let result = client.chat().create(request).await;
    
    if result.is_ok() {
        return Err(anyhow!("Expected authentication error for missing API key"));
    }

    let error_msg = format!("{}", result.unwrap_err());
    if !error_msg.contains("401") && !error_msg.contains("Unauthorized") && !error_msg.contains("authentication") {
        return Err(anyhow!("Expected 401/authentication error, got: {}", error_msg));
    }

    println!("  ✓ Missing API key test passed");
    Ok(())
}

pub async fn test_invalid_api_key() -> Result<()> {
    let client = setup_client_with_key("invalid-key-12345");

    let request = CreateChatCompletionRequestArgs::default()
        .model("echo")
        .messages([user_message("Test message")])
        .build()?;

    let result = client.chat().create(request).await;
    
    if result.is_ok() {
        return Err(anyhow!("Expected authentication error for invalid API key"));
    }

    let error_msg = format!("{}", result.unwrap_err());
    if !error_msg.contains("401") && !error_msg.contains("Unauthorized") && !error_msg.contains("authentication") {
        return Err(anyhow!("Expected 401/authentication error, got: {}", error_msg));
    }

    println!("  ✓ Invalid API key test passed");
    Ok(())
}

pub async fn test_empty_messages_array() -> Result<()> {
    let base_url = env::var("TEENYTINY_URL").unwrap_or_else(|_| "http://localhost:8080".to_string());
    let api_key = env::var("TEENYTINY_API_KEY").unwrap_or_else(|_| "testkey".to_string());
    
    let config = OpenAIConfig::new()
        .with_api_key(api_key)
        .with_api_base(format!("{}/v1", base_url));
    let client = Client::with_config(config);

    let request = CreateChatCompletionRequestArgs::default()
        .model("echo")
        .messages::<[_; 0]>([])
        .build()?;

    let result = client.chat().create(request).await;
    
    if result.is_ok() {
        return Err(anyhow!("Expected bad request error for empty messages"));
    }

    let error_msg = format!("{}", result.unwrap_err());
    if !error_msg.contains("400") && !error_msg.contains("Bad Request") && !error_msg.contains("invalid_request") {
        return Err(anyhow!("Expected 400/bad request error, got: {}", error_msg));
    }

    println!("  ✓ Empty messages array test passed");
    Ok(())
}

pub async fn test_streaming_with_invalid_api_key() -> Result<()> {
    let client = setup_client_with_key("invalid-streaming-key");

    let request = CreateChatCompletionRequestArgs::default()
        .model("echo")
        .messages([user_message("Test message")])
        .stream(true)
        .build()?;

    let result = client.chat().create_stream(request).await;
    
    if result.is_ok() {
        // Try to consume the stream to trigger the error
        let mut stream = result.unwrap();
        let stream_result = stream.next().await;
        
        if let Some(Ok(_)) = stream_result {
            return Err(anyhow!("Expected authentication error for invalid API key in streaming"));
        }
    }

    println!("  ✓ Streaming with invalid API key test passed");
    Ok(())
}