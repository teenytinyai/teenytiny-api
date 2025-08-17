use async_openai::{config::OpenAIConfig, Client};
use anyhow::Result;
use std::env;

mod tests;

fn setup_client() -> Client<OpenAIConfig> {
    let base_url = env::var("TEENYTINY_URL").unwrap_or_else(|_| "http://localhost:8080".to_string());
    let api_key = env::var("TEENYTINY_API_KEY").unwrap_or_else(|_| "testkey".to_string());

    let config = OpenAIConfig::new()
        .with_api_key(api_key)
        .with_api_base(format!("{}/v1", base_url));

    Client::with_config(config)
}

#[tokio::main]
async fn main() -> Result<()> {
    println!("Running Rust OpenAI integration tests...");
    
    let base_url = env::var("TEENYTINY_URL").unwrap_or_else(|_| "http://localhost:8080".to_string());
    let api_key = env::var("TEENYTINY_API_KEY").unwrap_or_else(|_| "testkey".to_string());
    let api_key_display = if api_key.len() > 7 {
        format!("{}...", &api_key[..7])
    } else {
        api_key.clone()
    };
    
    println!("Target: {} ({})", base_url, api_key_display);
    println!();

    // Run all test suites
    tests::run_basic_tests().await?;
    tests::run_streaming_tests().await?;
    tests::run_auth_error_tests().await?;
    tests::run_options_tests().await?;

    println!("✅ All Rust OpenAI integration tests passed!");

    Ok(())
}