import pytest


def test_models_list(openai_client):
    """Test listing available models"""
    models = openai_client.models.list()
    
    assert models.object == "list"
    assert len(models.data) > 0
    
    # Find the echo model
    echo_model = next((m for m in models.data if m.id == "echo"), None)
    assert echo_model is not None
    assert echo_model.object == "model"
    assert echo_model.owned_by == "teenytiny-ai"


def test_basic_completion(openai_client):
    """Test basic chat completion with echo model"""
    response = openai_client.chat.completions.create(
        model="echo",
        messages=[
            {"role": "user", "content": "Hello World"}
        ]
    )
    
    assert response.object == "chat.completion"
    assert response.model == "echo"
    assert len(response.choices) == 1
    
    choice = response.choices[0]
    assert choice.index == 0
    assert choice.message.role == "assistant"
    assert choice.message.content == "Hello World"
    assert choice.finish_reason == "stop"
    
    # Verify usage tracking
    assert response.usage.prompt_tokens > 0
    assert response.usage.completion_tokens > 0
    assert response.usage.total_tokens == response.usage.prompt_tokens + response.usage.completion_tokens


def test_multi_message_conversation(openai_client):
    """Test that echo model returns the last user message"""
    response = openai_client.chat.completions.create(
        model="echo",
        messages=[
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": "First message"},
            {"role": "assistant", "content": "First response"},
            {"role": "user", "content": "Second message"}
        ]
    )
    
    assert response.choices[0].message.content == "Second message"


def test_no_user_messages_default_response(openai_client):
    """Test default response when no user messages are provided"""
    response = openai_client.chat.completions.create(
        model="echo",
        messages=[
            {"role": "system", "content": "You are a helpful assistant."}
        ]
    )
    
    # Should get the default echo model greeting
    content = response.choices[0].message.content
    assert "Echo model" in content
    assert "echo it back" in content