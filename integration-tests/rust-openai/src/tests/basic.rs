use async_openai::types::{ChatCompletionRequestMessage, ChatCompletionRequestAssistantMessageArgs, Role, CreateChatCompletionRequestArgs, FinishReason};

use crate::setup_client;
use super::{user_message, system_message};

#[tokio::test]
async fn test_basic_completion() {
    let client = setup_client();

    let request = CreateChatCompletionRequestArgs::default()
        .model("echo")
        .messages([user_message("Hello World")])
        .build().unwrap();

    let response = client.chat().create(request).await.unwrap();

    // Validate response
    assert!(!response.choices.is_empty(), "No choices in response");

    let content = response.choices[0].message.content.as_ref()
        .expect("No content in response");

    assert_eq!(content, "Hello World");
    assert_eq!(response.model, "echo");
    assert_eq!(response.object, "chat.completion");
    
    let total_tokens = response.usage.as_ref().map(|u| u.total_tokens).unwrap_or(0);
    assert!(total_tokens > 0, "Expected total_tokens > 0");
}

#[tokio::test]
async fn test_multi_message_conversation() {
    let client = setup_client();

    let assistant_message: ChatCompletionRequestMessage = ChatCompletionRequestAssistantMessageArgs::default()
        .content("First response")
        .build().unwrap()
        .into();

    let request = CreateChatCompletionRequestArgs::default()
        .model("echo")
        .messages([
            system_message("You are a helpful assistant."),
            user_message("First message"),
            assistant_message,
            user_message("Last message"),
        ])
        .build().unwrap();

    let response = client.chat().create(request).await.unwrap();

    let content = response.choices[0].message.content.as_ref()
        .expect("No content in response");

    assert_eq!(content, "Last message");
}

#[tokio::test]
async fn test_system_prompt_with_user_message() {
    let client = setup_client();

    let request = CreateChatCompletionRequestArgs::default()
        .model("echo")
        .messages([
            system_message("You are a helpful assistant."),
            user_message("Test message"),
        ])
        .build().unwrap();

    let response = client.chat().create(request).await.unwrap();

    let content = response.choices[0].message.content.as_ref()
        .expect("No content in response");

    // Echo model should return the user message, ignoring system prompt
    assert_eq!(content, "Test message");
}

#[tokio::test]
async fn test_system_only_returns_default() {
    let client = setup_client();

    let request = CreateChatCompletionRequestArgs::default()
        .model("echo")
        .messages([system_message("You are a helpful assistant.")])
        .build().unwrap();

    let response = client.chat().create(request).await.unwrap();

    let content = response.choices[0].message.content.as_ref()
        .expect("No content in response");

    // Should get the default echo model greeting
    assert!(content.contains("Echo model"), "Expected content to contain 'Echo model', got '{}'", content);
}

#[tokio::test]
async fn test_response_structure() {
    let client = setup_client();

    let request = CreateChatCompletionRequestArgs::default()
        .model("echo")
        .messages([user_message("Structure test")])
        .build().unwrap();

    let response = client.chat().create(request).await.unwrap();

    // Check required fields
    assert!(!response.id.is_empty(), "ID should not be empty");
    assert_eq!(response.object, "chat.completion");
    assert!(response.created > 0, "Created timestamp should be > 0");
    assert_eq!(response.model, "echo");
    assert!(!response.choices.is_empty(), "Choices should not be empty");

    // Check choice structure
    let choice = &response.choices[0];
    assert_eq!(choice.index, 0);
    assert_eq!(choice.finish_reason, Some(FinishReason::Stop));

    // Check message structure
    assert_eq!(choice.message.role, Role::Assistant);

    let content = choice.message.content.as_ref()
        .expect("Message should have content");

    assert_eq!(content, "Structure test");

    // Check usage structure
    if let Some(usage) = &response.usage {
        assert!(usage.total_tokens > 0, "Total tokens should be > 0");
    } else {
        panic!("Usage should be present");
    }
}

#[tokio::test]
async fn test_empty_message_handling() {
    let client = setup_client();

    let request = CreateChatCompletionRequestArgs::default()
        .model("echo")
        .messages([user_message("")])
        .build().unwrap();

    let response = client.chat().create(request).await.unwrap();

    // Empty input should be handled gracefully
    let _content = response.choices[0].message.content.as_ref()
        .expect("Should have content even for empty input");
}

#[tokio::test]
async fn test_special_characters_and_unicode() {
    let client = setup_client();
    let test_message = "Hello! 🌟 Special chars: @#$%^&*()_+-={}[]|\\:;\"'<>?,./ 中文";

    let request = CreateChatCompletionRequestArgs::default()
        .model("echo")
        .messages([user_message(test_message)])
        .build().unwrap();

    let response = client.chat().create(request).await.unwrap();

    let content = response.choices[0].message.content.as_ref()
        .expect("No content in response");

    assert_eq!(content, test_message);
}

#[tokio::test]
async fn test_multiline_content() {
    let client = setup_client();
    let multiline_message = "Line 1\nLine 2\nLine 3 with more content\nFinal line";

    let request = CreateChatCompletionRequestArgs::default()
        .model("echo")
        .messages([user_message(multiline_message)])
        .build().unwrap();

    let response = client.chat().create(request).await.unwrap();

    let content = response.choices[0].message.content.as_ref()
        .expect("No content in response");

    assert_eq!(content, multiline_message);
}