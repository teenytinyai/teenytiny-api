use async_openai::{config::OpenAIConfig, types::CreateChatCompletionRequestArgs, Client};
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

#[tokio::test]
async fn test_missing_api_key() {
    let client = setup_client_with_key("");  // Empty API key

    let request = CreateChatCompletionRequestArgs::default()
        .model("echo")
        .messages([user_message("Test message")])
        .build().unwrap();

    let result = client.chat().create(request).await;
    
    assert!(result.is_err(), "Expected authentication error for missing API key");

    let error_msg = format!("{}", result.unwrap_err());
    assert!(
        error_msg.contains("401") || error_msg.contains("Unauthorized") || error_msg.contains("authentication"),
        "Expected 401/authentication error, got: {}", error_msg
    );
}

#[tokio::test]
async fn test_invalid_api_key() {
    let client = setup_client_with_key("invalid-key-12345");

    let request = CreateChatCompletionRequestArgs::default()
        .model("echo")
        .messages([user_message("Test message")])
        .build().unwrap();

    let result = client.chat().create(request).await;
    
    assert!(result.is_err(), "Expected authentication error for invalid API key");

    let error_msg = format!("{}", result.unwrap_err());
    assert!(
        error_msg.contains("401") || error_msg.contains("Unauthorized") || error_msg.contains("authentication"),
        "Expected 401/authentication error, got: {}", error_msg
    );
}

#[tokio::test]
async fn test_empty_messages_array() {
    let client = setup_client_with_key("testkey");

    let request = CreateChatCompletionRequestArgs::default()
        .model("echo")
        .messages(Vec::<async_openai::types::ChatCompletionRequestMessage>::new())
        .build().unwrap();

    let result = client.chat().create(request).await;
    
    assert!(result.is_err(), "Expected validation error for empty messages");

    let error_msg = format!("{}", result.unwrap_err());
    assert!(
        error_msg.contains("400") || error_msg.contains("Bad Request") || error_msg.contains("messages"),
        "Expected 400/validation error, got: {}", error_msg
    );
}

#[tokio::test]
async fn test_streaming_with_invalid_api_key() {
    let client = setup_client_with_key("invalid-streaming-key");

    let request = CreateChatCompletionRequestArgs::default()
        .model("echo")
        .messages([user_message("Streaming test")])
        .stream(true)
        .build().unwrap();

    let result = client.chat().create_stream(request).await;
    
    match result {
        Ok(mut stream) => {
            // The stream creation might succeed, but reading from it should fail
            match stream.next().await {
                Some(Err(e)) => {
                    println!("Got expected error when reading stream: {:?}", e);
                    // This is the expected behavior - error when reading
                },
                Some(Ok(_)) => panic!("Expected authentication error but got successful stream chunk"),
                None => panic!("Expected authentication error but got empty stream"),
            }
        },
        Err(e) => {
            println!("Got expected error during stream creation: {:?}", e);
            // This is also acceptable - error during stream creation
        },
    }
}