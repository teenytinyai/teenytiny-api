import pytest
import litellm


def test_basic_completion(litellm_setup):
    """Test basic LiteLLM completion with echo model"""
    url, api_key = litellm_setup
    
    response = litellm.completion(
        model="openai/echo",  # Use openai/ prefix to specify provider
        messages=[
            {"role": "user", "content": "Hello World"}
        ],
        api_base=f"{url}/v1",
        api_key=api_key
    )
    
    assert response.choices[0].message.content == "Hello World"
    assert response.model == "echo"
    assert response.object == "chat.completion"
    assert response.usage.total_tokens > 0


def test_multi_message_conversation(litellm_setup):
    """Test that echo model returns the last user message"""
    url, api_key = litellm_setup
    
    response = litellm.completion(
        model="openai/echo",
        messages=[
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": "First message"},
            {"role": "assistant", "content": "First response"},
            {"role": "user", "content": "Second message"}
        ],
        api_base=f"{url}/v1",
        api_key=api_key
    )
    
    assert response.choices[0].message.content == "Second message"


def test_no_user_messages_default_response(litellm_setup):
    """Test default response when no user messages are provided"""
    url, api_key = litellm_setup
    
    response = litellm.completion(
        model="openai/echo",
        messages=[
            {"role": "system", "content": "You are a helpful assistant."}
        ],
        api_base=f"{url}/v1",
        api_key=api_key
    )
    
    # Should get the default echo model greeting
    content = response.choices[0].message.content
    assert "Echo model" in content
    assert "echo it back" in content


def test_response_structure(litellm_setup):
    """Test that response has proper OpenAI structure"""
    url, api_key = litellm_setup
    
    response = litellm.completion(
        model="openai/echo",
        messages=[{"role": "user", "content": "Test"}],
        api_base=f"{url}/v1",
        api_key=api_key
    )
    
    # Check required response fields
    assert hasattr(response, 'id')
    assert hasattr(response, 'object')
    assert hasattr(response, 'created')
    assert hasattr(response, 'model')
    assert hasattr(response, 'choices')
    assert hasattr(response, 'usage')
    
    # Check choice structure
    choice = response.choices[0]
    assert hasattr(choice, 'index')
    assert hasattr(choice, 'message')
    assert hasattr(choice, 'finish_reason')
    
    # Check message structure
    message = choice.message
    assert hasattr(message, 'role')
    assert hasattr(message, 'content')
    assert message.role == 'assistant'
    
    # Check usage structure
    usage = response.usage
    assert hasattr(usage, 'prompt_tokens')
    assert hasattr(usage, 'completion_tokens')
    assert hasattr(usage, 'total_tokens')


def test_custom_provider_format(litellm_setup):
    """Test LiteLLM's custom provider format"""
    url, api_key = litellm_setup
    
    # Test using the custom provider format that LiteLLM supports
    response = litellm.completion(
        model="openai/echo",  # LiteLLM format for custom OpenAI-compatible endpoint
        messages=[{"role": "user", "content": "Provider test"}],
        api_base=f"{url}/v1",
        api_key=api_key
    )
    
    assert response.choices[0].message.content == "Provider test"


def test_litellm_utilities(litellm_setup):
    """Test LiteLLM utility functions"""
    url, api_key = litellm_setup
    
    # Test token counting
    tokens = litellm.token_counter(
        model="openai/echo",
        messages=[{"role": "user", "content": "Count these tokens"}]
    )
    assert tokens > 0
    
    # Test model cost (should work even if cost is 0 for echo model)
    try:
        cost = litellm.completion_cost(
            model="openai/echo",
            prompt_tokens=10,
            completion_tokens=5
        )
        # Cost should be a number (likely 0 for echo model)
        assert isinstance(cost, (int, float))
    except Exception:
        # Some models might not have cost data, which is fine
        pass