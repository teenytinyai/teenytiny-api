import pytest
from openai import OpenAI, AuthenticationError, BadRequestError, NotFoundError, APIConnectionError


def test_invalid_api_key(teenytiny_config):
    """Test authentication with invalid API key"""
    url, _ = teenytiny_config
    
    client = OpenAI(
        base_url=f"{url}/v1",
        api_key="invalid-key"
    )
    
    with pytest.raises(AuthenticationError):
        client.chat.completions.create(
            model="echo",
            messages=[{"role": "user", "content": "Hello"}]
        )


def test_missing_api_key(teenytiny_config):
    """Test request without API key"""
    url, _ = teenytiny_config
    
    client = OpenAI(
        base_url=f"{url}/v1",
        api_key=""
    )
    
    # Empty API key can cause either AuthenticationError or APIConnectionError
    with pytest.raises((AuthenticationError, APIConnectionError)):
        client.chat.completions.create(
            model="echo",
            messages=[{"role": "user", "content": "Hello"}]
        )


def test_invalid_model(openai_client):
    """Test request with non-existent model"""
    with pytest.raises(BadRequestError) as exc_info:
        openai_client.chat.completions.create(
            model="nonexistent-model",
            messages=[{"role": "user", "content": "Hello"}]
        )
    
    error = exc_info.value
    assert "model" in str(error).lower()


def test_empty_messages(openai_client):
    """Test request with empty messages array"""
    with pytest.raises(BadRequestError) as exc_info:
        openai_client.chat.completions.create(
            model="echo",
            messages=[]
        )
    
    error = exc_info.value
    assert "messages" in str(error).lower()


def test_missing_model_parameter(openai_client):
    """Test request without model parameter"""
    # This should raise a client-side validation error before reaching the server
    with pytest.raises((BadRequestError, TypeError, ValueError)):
        openai_client.chat.completions.create(
            messages=[{"role": "user", "content": "Hello"}]
        )


def test_malformed_message_structure(openai_client):
    """Test request with malformed message structure"""
    with pytest.raises(BadRequestError):
        openai_client.chat.completions.create(
            model="echo",
            messages=[{"invalid_field": "value"}]  # Missing required 'role' and 'content' fields
        )