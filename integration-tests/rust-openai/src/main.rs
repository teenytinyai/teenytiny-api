use async_openai::{config::OpenAIConfig, Client};
use std::env;

// Helper function to setup client - used by tests
pub fn setup_client() -> Client<OpenAIConfig> {
    let base_url = env::var("TEENYTINY_URL").unwrap_or_else(|_| "http://localhost:8080".to_string());
    let api_key = env::var("TEENYTINY_API_KEY").unwrap_or_else(|_| "testkey".to_string());

    let config = OpenAIConfig::new()
        .with_api_key(api_key)
        .with_api_base(format!("{}/v1", base_url));

    Client::with_config(config)
}

fn main() {
    println!("This is now a test-only crate. Run with 'cargo test'.");
}