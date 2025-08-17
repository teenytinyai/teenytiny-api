use async_openai::types::CreateChatCompletionRequestArgs;
use anyhow::{anyhow, Result};
use futures::StreamExt;

use crate::setup_client;
use super::user_message;

pub async fn test_custom_temperature_parameter() -> Result<()> {
    let client = setup_client();

    let request = CreateChatCompletionRequestArgs::default()
        .model("echo")
        .messages([user_message("Temperature test")])
        .temperature(0.7)
        .build()?;

    let response = client.chat().create(request).await?;

    // Echo model should still return the same content regardless of temperature
    let content = response.choices[0].message.content.as_ref()
        .ok_or_else(|| anyhow!("No content in response"))?;

    if content != "Temperature test" {
        return Err(anyhow!("Expected 'Temperature test', got '{}'", content));
    }

    if response.model != "echo" {
        return Err(anyhow!("Expected model 'echo'"));
    }

    println!("  ✓ Custom temperature parameter test passed");
    Ok(())
}

pub async fn test_custom_max_tokens_parameter() -> Result<()> {
    let client = setup_client();

    let request = CreateChatCompletionRequestArgs::default()
        .model("echo")
        .messages([user_message("Max tokens test")])
        .max_tokens(50u16)
        .build()?;

    let response = client.chat().create(request).await?;

    let content = response.choices[0].message.content.as_ref()
        .ok_or_else(|| anyhow!("No content in response"))?;

    if content != "Max tokens test" {
        return Err(anyhow!("Expected 'Max tokens test', got '{}'", content));
    }

    // Usage tokens should be within reasonable bounds for the echo model
    if let Some(usage) = &response.usage {
        if usage.total_tokens > 100 {
            return Err(anyhow!("Total tokens should be <= 100"));
        }
    }

    println!("  ✓ Custom max tokens parameter test passed");
    Ok(())
}

pub async fn test_multiple_parameters_combined() -> Result<()> {
    let client = setup_client();

    let request = CreateChatCompletionRequestArgs::default()
        .model("echo")
        .messages([user_message("Combined parameters")])
        .temperature(0.5)
        .max_tokens(100u16)
        .top_p(0.9)
        .build()?;

    let response = client.chat().create(request).await?;

    let content = response.choices[0].message.content.as_ref()
        .ok_or_else(|| anyhow!("No content in response"))?;

    if content != "Combined parameters" {
        return Err(anyhow!("Expected 'Combined parameters', got '{}'", content));
    }

    if response.model != "echo" {
        return Err(anyhow!("Expected model 'echo'"));
    }

    if let Some(usage) = &response.usage {
        if usage.total_tokens == 0 {
            return Err(anyhow!("Total tokens should be > 0"));
        }
    }

    println!("  ✓ Multiple parameters combined test passed");
    Ok(())
}

pub async fn test_streaming_with_parameters() -> Result<()> {
    let client = setup_client();

    let request = CreateChatCompletionRequestArgs::default()
        .model("echo")
        .messages([user_message("Streaming with options")])
        .temperature(0.8)
        .max_tokens(75u16)
        .stream(true)
        .build()?;

    let mut stream = client.chat().create_stream(request).await?;
    
    let mut content_parts = Vec::new();

    while let Some(result) = stream.next().await {
        let response = result?;

        if response.model != "echo" {
            return Err(anyhow!("Expected model 'echo'"));
        }

        if let Some(choice) = response.choices.first() {
            if let Some(content) = &choice.delta.content {
                content_parts.push(content.clone());
            }
        }
    }

    let combined_content = content_parts.join("");
    if combined_content != "Streaming with options" {
        return Err(anyhow!("Expected 'Streaming with options', got '{}'", combined_content));
    }

    println!("  ✓ Streaming with parameters test passed");
    Ok(())
}

pub async fn test_user_parameter_in_request() -> Result<()> {
    let client = setup_client();

    let request = CreateChatCompletionRequestArgs::default()
        .model("echo")
        .messages([user_message("User parameter test")])
        .user("test-user-123")
        .build()?;

    let response = client.chat().create(request).await?;

    let content = response.choices[0].message.content.as_ref()
        .ok_or_else(|| anyhow!("No content in response"))?;

    if content != "User parameter test" {
        return Err(anyhow!("Expected 'User parameter test', got '{}'", content));
    }

    if response.model != "echo" {
        return Err(anyhow!("Expected model 'echo'"));
    }

    println!("  ✓ User parameter in request test passed");
    Ok(())
}

pub async fn test_frequency_and_presence_penalty_parameters() -> Result<()> {
    let client = setup_client();

    let request = CreateChatCompletionRequestArgs::default()
        .model("echo")
        .messages([user_message("Penalty parameters test")])
        .frequency_penalty(0.5)
        .presence_penalty(0.3)
        .build()?;

    let response = client.chat().create(request).await?;

    // Echo model should still work with penalty parameters
    let content = response.choices[0].message.content.as_ref()
        .ok_or_else(|| anyhow!("No content in response"))?;

    if content != "Penalty parameters test" {
        return Err(anyhow!("Expected 'Penalty parameters test', got '{}'", content));
    }

    if response.model != "echo" {
        return Err(anyhow!("Expected model 'echo'"));
    }

    println!("  ✓ Frequency and presence penalty parameters test passed");
    Ok(())
}