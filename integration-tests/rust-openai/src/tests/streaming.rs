use async_openai::types::{CreateChatCompletionRequestArgs, FinishReason};
use futures::StreamExt;

use crate::setup_client;
use super::user_message;

#[tokio::test]
async fn test_basic_streaming_completion() {
    let client = setup_client();

    let request = CreateChatCompletionRequestArgs::default()
        .model("echo")
        .messages([user_message("Hello World")])
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
    assert_eq!(full_content, "Hello World");
}

#[tokio::test]
async fn test_streaming_content_reconstruction() {
    let client = setup_client();
    let multiline_message = "Line 1\nLine 2\nLine 3 with more content\nFinal line";

    let request = CreateChatCompletionRequestArgs::default()
        .model("echo")
        .messages([user_message(multiline_message)])
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

    let reconstructed_content = content_parts.join("");
    assert_eq!(reconstructed_content, multiline_message);
}

#[tokio::test]
async fn test_streaming_with_multiline_content() {
    let client = setup_client();
    let test_content = "First line\nSecond line\nThird line";

    let request = CreateChatCompletionRequestArgs::default()
        .model("echo")
        .messages([user_message(test_content)])
        .stream(true)
        .build().unwrap();

    let mut stream = client.chat().create_stream(request).await.unwrap();

    let mut received_content = String::new();
    while let Some(result) = stream.next().await {
        let chunk = result.unwrap();
        
        if let Some(choice) = chunk.choices.first() {
            if let Some(content) = &choice.delta.content {
                received_content.push_str(content);
            }
        }
    }

    assert_eq!(received_content, test_content);
}

#[tokio::test]
async fn test_streaming_with_special_characters() {
    let client = setup_client();
    let special_chars = "Hello! 🌟 Special chars: @#$%^&*()_+-={}[]|\\:;\"'<>?,./ 中文";

    let request = CreateChatCompletionRequestArgs::default()
        .model("echo")
        .messages([user_message(special_chars)])
        .stream(true)
        .build().unwrap();

    let mut stream = client.chat().create_stream(request).await.unwrap();

    let mut received_content = String::new();
    while let Some(result) = stream.next().await {
        let chunk = result.unwrap();
        
        if let Some(choice) = chunk.choices.first() {
            if let Some(content) = &choice.delta.content {
                received_content.push_str(content);
            }
        }
    }

    assert_eq!(received_content, special_chars);
}

#[tokio::test]
async fn test_streaming_response_structure() {
    let client = setup_client();

    let request = CreateChatCompletionRequestArgs::default()
        .model("echo")
        .messages([user_message("Structure test")])
        .stream(true)
        .build().unwrap();

    let mut stream = client.chat().create_stream(request).await.unwrap();

    let mut chunk_count = 0;
    let mut has_finish_reason = false;

    while let Some(result) = stream.next().await {
        let chunk = result.unwrap();
        chunk_count += 1;

        // Check chunk structure
        assert!(!chunk.id.is_empty(), "Chunk ID should not be empty");
        assert_eq!(chunk.object, "chat.completion.chunk");
        assert!(chunk.created > 0, "Created timestamp should be > 0");
        assert_eq!(chunk.model, "echo");
        assert!(!chunk.choices.is_empty(), "Choices should not be empty");

        // Check if this is the final chunk
        if let Some(choice) = chunk.choices.first() {
            if choice.finish_reason == Some(FinishReason::Stop) {
                has_finish_reason = true;
            }
        }
    }

    assert!(chunk_count > 0, "Should receive at least one chunk");
    assert!(has_finish_reason, "Should receive finish_reason in final chunk");
}