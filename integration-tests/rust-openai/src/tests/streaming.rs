use async_openai::types::{CreateChatCompletionRequestArgs, FinishReason};
use anyhow::{anyhow, Result};
use futures::StreamExt;

use crate::setup_client;
use super::user_message;

pub async fn test_basic_streaming_completion() -> Result<()> {
    let client = setup_client();

    let request = CreateChatCompletionRequestArgs::default()
        .model("echo")
        .messages([user_message("Hello Stream")])
        .stream(true)
        .build()?;

    let mut stream = client.chat().create_stream(request).await?;
    
    let mut responses = Vec::new();
    let mut content_parts = Vec::new();
    let mut found_finish_reason = false;

    while let Some(result) = stream.next().await {
        let response = result?;
        responses.push(response.clone());

        // Collect content from delta
        if let Some(choice) = response.choices.first() {
            if let Some(content) = &choice.delta.content {
                content_parts.push(content.clone());
            }

            // Check for finish reason
            if let Some(finish_reason) = &choice.finish_reason {
                found_finish_reason = true;
                if *finish_reason != FinishReason::Stop {
                    return Err(anyhow!("Expected finish_reason 'stop', got '{:?}'", finish_reason));
                }
            }
        }
    }

    if responses.is_empty() {
        return Err(anyhow!("Should receive at least one response"));
    }

    let combined_content = content_parts.join("");
    if combined_content != "Hello Stream" {
        return Err(anyhow!("Expected 'Hello Stream', got '{}'", combined_content));
    }

    if !found_finish_reason {
        return Err(anyhow!("Should receive finish reason"));
    }

    // Verify stream structure
    let first_response = &responses[0];
    if first_response.model != "echo" {
        return Err(anyhow!("Expected model 'echo'"));
    }
    if first_response.object != "chat.completion.chunk" {
        return Err(anyhow!("Expected object 'chat.completion.chunk'"));
    }
    if first_response.id.is_empty() {
        return Err(anyhow!("ID should not be empty"));
    }
    if first_response.created == 0 {
        return Err(anyhow!("Created should be > 0"));
    }

    println!("  ✓ Basic streaming completion test passed");
    Ok(())
}

pub async fn test_streaming_content_reconstruction() -> Result<()> {
    let client = setup_client();

    let request = CreateChatCompletionRequestArgs::default()
        .model("echo")
        .messages([user_message("Reconstruct me")])
        .stream(true)
        .build()?;

    let mut stream = client.chat().create_stream(request).await?;
    
    let mut content_parts = Vec::new();

    while let Some(result) = stream.next().await {
        let response = result?;

        if let Some(choice) = response.choices.first() {
            if let Some(content) = &choice.delta.content {
                content_parts.push(content.clone());
            }
        }
    }

    let combined_content = content_parts.join("");
    if combined_content != "Reconstruct me" {
        return Err(anyhow!("Expected 'Reconstruct me', got '{}'", combined_content));
    }

    println!("  ✓ Streaming content reconstruction test passed");
    Ok(())
}

pub async fn test_streaming_with_multiline_content() -> Result<()> {
    let client = setup_client();
    let multiline_message = "Line 1\nLine 2\nLine 3";

    let request = CreateChatCompletionRequestArgs::default()
        .model("echo")
        .messages([user_message(multiline_message)])
        .stream(true)
        .build()?;

    let mut stream = client.chat().create_stream(request).await?;
    
    let mut content_parts = Vec::new();
    let mut chunk_count = 0;

    while let Some(result) = stream.next().await {
        let response = result?;
        chunk_count += 1;

        if let Some(choice) = response.choices.first() {
            if let Some(content) = &choice.delta.content {
                content_parts.push(content.clone());
            }
        }
    }

    if chunk_count == 0 {
        return Err(anyhow!("Should receive chunks"));
    }

    let combined_content = content_parts.join("");
    if combined_content != multiline_message {
        return Err(anyhow!("Expected '{}', got '{}'", multiline_message, combined_content));
    }

    println!("  ✓ Streaming with multiline content test passed");
    Ok(())
}

pub async fn test_streaming_with_special_characters() -> Result<()> {
    let client = setup_client();
    let special_message = "Hello! 🌟 Special: @#$%";

    let request = CreateChatCompletionRequestArgs::default()
        .model("echo")
        .messages([user_message(special_message)])
        .stream(true)
        .build()?;

    let mut stream = client.chat().create_stream(request).await?;
    
    let mut content_parts = Vec::new();

    while let Some(result) = stream.next().await {
        let response = result?;

        if let Some(choice) = response.choices.first() {
            if let Some(content) = &choice.delta.content {
                content_parts.push(content.clone());
            }
        }
    }

    let combined_content = content_parts.join("");
    if combined_content != special_message {
        return Err(anyhow!("Expected '{}', got '{}'", special_message, combined_content));
    }

    println!("  ✓ Streaming with special characters test passed");
    Ok(())
}

pub async fn test_streaming_response_structure() -> Result<()> {
    let client = setup_client();

    let request = CreateChatCompletionRequestArgs::default()
        .model("echo")
        .messages([user_message("Structure validation")])
        .stream(true)
        .build()?;

    let mut stream = client.chat().create_stream(request).await?;
    
    let mut found_valid_content = false;

    while let Some(result) = stream.next().await {
        let response = result?;

        // Each response should have basic structure
        if response.id.is_empty() {
            return Err(anyhow!("ID should not be empty"));
        }
        if response.object != "chat.completion.chunk" {
            return Err(anyhow!("Expected object 'chat.completion.chunk'"));
        }
        if response.model != "echo" {
            return Err(anyhow!("Expected model 'echo'"));
        }
        if response.choices.is_empty() {
            return Err(anyhow!("Choices should not be empty"));
        }

        // Check choice structure
        let choice = &response.choices[0];
        if choice.index != 0 {
            return Err(anyhow!("Expected choice index 0"));
        }

        // If this chunk has content, validate it
        if choice.delta.content.is_some() {
            found_valid_content = true;
        }
    }

    if !found_valid_content {
        return Err(anyhow!("Should find at least one response with content"));
    }

    println!("  ✓ Streaming response structure test passed");
    Ok(())
}