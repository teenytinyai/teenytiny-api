use async_openai::types::CreateChatCompletionRequestArgs;
use futures::StreamExt;

use crate::setup_client;
use super::user_message;

#[tokio::test]
async fn test_custom_temperature_parameter() {
    let client = setup_client();

    let request = CreateChatCompletionRequestArgs::default()
        .model("echo")
        .messages([user_message("Temperature test")])
        .temperature(0.7)
        .build().unwrap();

    let response = client.chat().create(request).await.unwrap();

    // Validate response structure
    assert!(!response.choices.is_empty());
    let content = response.choices[0].message.content.as_ref()
        .expect("Response should have content");
    assert_eq!(content, "Temperature test");

    // Echo model should accept temperature parameter without errors
    assert_eq!(response.model, "echo");
}

#[tokio::test]
async fn test_custom_max_tokens_parameter() {
    let client = setup_client();

    let request = CreateChatCompletionRequestArgs::default()
        .model("echo")
        .messages([user_message("Max tokens test")])
        .max_tokens(100u16)
        .build().unwrap();

    let response = client.chat().create(request).await.unwrap();

    // Validate response
    assert!(!response.choices.is_empty());
    let content = response.choices[0].message.content.as_ref()
        .expect("Response should have content");
    assert_eq!(content, "Max tokens test");

    // Check usage information
    if let Some(usage) = response.usage {
        assert!(usage.total_tokens > 0);
    }
}

#[tokio::test]
async fn test_multiple_parameters_combined() {
    let client = setup_client();

    let request = CreateChatCompletionRequestArgs::default()
        .model("echo")
        .messages([user_message("Multiple params test")])
        .temperature(0.8)
        .max_tokens(150u16)
        .top_p(0.9)
        .build().unwrap();

    let response = client.chat().create(request).await.unwrap();

    // Validate response
    assert!(!response.choices.is_empty());
    let content = response.choices[0].message.content.as_ref()
        .expect("Response should have content");
    assert_eq!(content, "Multiple params test");

    // Echo model should handle multiple parameters
    assert_eq!(response.model, "echo");
}

#[tokio::test]
async fn test_streaming_with_parameters() {
    let client = setup_client();

    let request = CreateChatCompletionRequestArgs::default()
        .model("echo")
        .messages([user_message("Streaming params test")])
        .temperature(0.5)
        .stream(true)
        .build().unwrap();

    let mut stream = client.chat().create_stream(request).await.unwrap();

    let mut content_parts = Vec::new();
    while let Some(result) = stream.next().await {
        let chunk = result.unwrap();
        
        if let Some(choice) = chunk.choices.first() {
            if let Some(content) = &choice.delta.content {
                content_parts.push(content.clone());
            }
        }
    }

    let full_content = content_parts.join("");
    assert_eq!(full_content, "Streaming params test");
}

#[tokio::test]
async fn test_user_parameter_in_request() {
    let client = setup_client();

    let request = CreateChatCompletionRequestArgs::default()
        .model("echo")
        .messages([user_message("User param test")])
        .user("test-user-123")
        .build().unwrap();

    let response = client.chat().create(request).await.unwrap();

    // Validate response
    assert!(!response.choices.is_empty());
    let content = response.choices[0].message.content.as_ref()
        .expect("Response should have content");
    assert_eq!(content, "User param test");

    // Echo model should accept user parameter
    assert_eq!(response.model, "echo");
}

#[tokio::test]
async fn test_frequency_and_presence_penalty_parameters() {
    let client = setup_client();

    let request = CreateChatCompletionRequestArgs::default()
        .model("echo")
        .messages([user_message("Penalty params test")])
        .frequency_penalty(0.5)
        .presence_penalty(0.3)
        .build().unwrap();

    let response = client.chat().create(request).await.unwrap();

    // Validate response
    assert!(!response.choices.is_empty());
    let content = response.choices[0].message.content.as_ref()
        .expect("Response should have content");
    assert_eq!(content, "Penalty params test");

    // Echo model should accept penalty parameters
    assert_eq!(response.model, "echo");
}