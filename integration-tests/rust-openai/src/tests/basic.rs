use async_openai::types::{ChatCompletionRequestMessage, ChatCompletionRequestAssistantMessageArgs, Role, CreateChatCompletionRequestArgs, FinishReason};
use anyhow::{anyhow, Result};

use crate::setup_client;
use super::{user_message, system_message};

pub async fn test_basic_completion() -> Result<()> {
    let client = setup_client();

    let request = CreateChatCompletionRequestArgs::default()
        .model("echo")
        .messages([user_message("Hello World")])
        .build()?;

    let response = client.chat().create(request).await?;

    // Validate response
    if response.choices.is_empty() {
        return Err(anyhow!("No choices in response"));
    }

    let content = response.choices[0].message.content.as_ref()
        .ok_or_else(|| anyhow!("No content in response"))?;

    if content != "Hello World" {
        return Err(anyhow!("Expected 'Hello World', got '{}'", content));
    }

    if response.model != "echo" {
        return Err(anyhow!("Expected model 'echo', got '{}'", response.model));
    }

    if response.object != "chat.completion" {
        return Err(anyhow!("Expected object 'chat.completion', got '{}'", response.object));
    }

    if response.usage.as_ref().map(|u| u.total_tokens).unwrap_or(0) == 0 {
        return Err(anyhow!("Expected total_tokens > 0"));
    }

    println!("  ✓ Basic completion test passed");
    Ok(())
}

pub async fn test_multi_message_conversation() -> Result<()> {
    let client = setup_client();

    let assistant_message: ChatCompletionRequestMessage = ChatCompletionRequestAssistantMessageArgs::default()
        .content("First response")
        .build()?
        .into();

    let request = CreateChatCompletionRequestArgs::default()
        .model("echo")
        .messages([
            system_message("You are a helpful assistant."),
            user_message("First message"),
            assistant_message,
            user_message("Last message"),
        ])
        .build()?;

    let response = client.chat().create(request).await?;

    let content = response.choices[0].message.content.as_ref()
        .ok_or_else(|| anyhow!("No content in response"))?;

    if content != "Last message" {
        return Err(anyhow!("Expected 'Last message', got '{}'", content));
    }

    println!("  ✓ Multi-message conversation test passed");
    Ok(())
}

pub async fn test_system_prompt_with_user_message() -> Result<()> {
    let client = setup_client();

    let request = CreateChatCompletionRequestArgs::default()
        .model("echo")
        .messages([
            system_message("You are a helpful assistant."),
            user_message("Test message"),
        ])
        .build()?;

    let response = client.chat().create(request).await?;

    let content = response.choices[0].message.content.as_ref()
        .ok_or_else(|| anyhow!("No content in response"))?;

    // Echo model should return the user message, ignoring system prompt
    if content != "Test message" {
        return Err(anyhow!("Expected 'Test message', got '{}'", content));
    }

    println!("  ✓ System prompt with user message test passed");
    Ok(())
}

pub async fn test_system_only_returns_default() -> Result<()> {
    let client = setup_client();

    let request = CreateChatCompletionRequestArgs::default()
        .model("echo")
        .messages([system_message("You are a helpful assistant.")])
        .build()?;

    let response = client.chat().create(request).await?;

    let content = response.choices[0].message.content.as_ref()
        .ok_or_else(|| anyhow!("No content in response"))?;

    // Should get the default echo model greeting
    if !content.contains("Echo model") {
        return Err(anyhow!("Expected content to contain 'Echo model', got '{}'", content));
    }

    println!("  ✓ System-only returns default test passed");
    Ok(())
}

pub async fn test_response_structure() -> Result<()> {
    let client = setup_client();

    let request = CreateChatCompletionRequestArgs::default()
        .model("echo")
        .messages([user_message("Structure test")])
        .build()?;

    let response = client.chat().create(request).await?;

    // Check required fields
    if response.id.is_empty() {
        return Err(anyhow!("ID should not be empty"));
    }

    if response.object != "chat.completion" {
        return Err(anyhow!("Expected object 'chat.completion'"));
    }

    if response.created == 0 {
        return Err(anyhow!("Created timestamp should be > 0"));
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

    if choice.finish_reason != Some(FinishReason::Stop) {
        return Err(anyhow!("Expected finish_reason 'stop'"));
    }

    // Check message structure
    if choice.message.role != Role::Assistant {
        return Err(anyhow!("Expected message role 'assistant'"));
    }

    let content = choice.message.content.as_ref()
        .ok_or_else(|| anyhow!("Message should have content"))?;

    if content != "Structure test" {
        return Err(anyhow!("Expected content 'Structure test'"));
    }

    // Check usage structure
    if let Some(usage) = &response.usage {
        if usage.total_tokens == 0 {
            return Err(anyhow!("Total tokens should be > 0"));
        }
    } else {
        return Err(anyhow!("Usage should be present"));
    }

    println!("  ✓ Response structure test passed");
    Ok(())
}

pub async fn test_empty_message_handling() -> Result<()> {
    let client = setup_client();

    let request = CreateChatCompletionRequestArgs::default()
        .model("echo")
        .messages([user_message("")])
        .build()?;

    let response = client.chat().create(request).await?;

    // Empty input should be handled gracefully
    let _content = response.choices[0].message.content.as_ref()
        .ok_or_else(|| anyhow!("Should have content even for empty input"))?;

    println!("  ✓ Empty message handling test passed");
    Ok(())
}

pub async fn test_special_characters_and_unicode() -> Result<()> {
    let client = setup_client();
    let test_message = "Hello! 🌟 Special chars: @#$%^&*()_+-={}[]|\\:;\"'<>?,./ 中文";

    let request = CreateChatCompletionRequestArgs::default()
        .model("echo")
        .messages([user_message(test_message)])
        .build()?;

    let response = client.chat().create(request).await?;

    let content = response.choices[0].message.content.as_ref()
        .ok_or_else(|| anyhow!("No content in response"))?;

    if content != test_message {
        return Err(anyhow!("Expected '{}', got '{}'", test_message, content));
    }

    println!("  ✓ Special characters and unicode test passed");
    Ok(())
}

pub async fn test_multiline_content() -> Result<()> {
    let client = setup_client();
    let multiline_message = "Line 1\nLine 2\nLine 3 with more content\nFinal line";

    let request = CreateChatCompletionRequestArgs::default()
        .model("echo")
        .messages([user_message(multiline_message)])
        .build()?;

    let response = client.chat().create(request).await?;

    let content = response.choices[0].message.content.as_ref()
        .ok_or_else(|| anyhow!("No content in response"))?;

    if content != multiline_message {
        return Err(anyhow!("Expected '{}', got '{}'", multiline_message, content));
    }

    println!("  ✓ Multiline content test passed");
    Ok(())
}