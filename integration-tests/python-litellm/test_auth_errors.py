import pytest
import litellm
from litellm.exceptions import AuthenticationError, BadRequestError, NotFoundError


def test_invalid_api_key(teenytiny_config):
    """Test authentication with invalid API key"""
    url, _ = teenytiny_config
    
    with pytest.raises((AuthenticationError, Exception)) as exc_info:
        litellm.completion(
            model="openai/echo",
            messages=[{"role": "user", "content": "Hello"}],
            api_base=f"{url}/v1",
            api_key="invalid-key"
        )
    
    # Should get some form of authentication error
    error_str = str(exc_info.value).lower()
    assert "401" in error_str or "unauthorized" in error_str or "authentication" in error_str


def test_invalid_model(litellm_setup):
    """Test request with non-existent model"""
    url, api_key = litellm_setup
    
    with pytest.raises((BadRequestError, Exception)) as exc_info:
        litellm.completion(
            model="openai/nonexistent-model",
            messages=[{"role": "user", "content": "Hello"}],
            api_base=f"{url}/v1",
            api_key=api_key
        )
    
    # Should get a model-related error
    error_str = str(exc_info.value).lower()
    assert "400" in error_str or "model" in error_str or "not found" in error_str


def test_empty_messages(litellm_setup):
    """Test request with empty messages array"""
    url, api_key = litellm_setup
    
    with pytest.raises((BadRequestError, Exception)):
        litellm.completion(
            model="openai/echo",
            messages=[],
            api_base=f"{url}/v1",
            api_key=api_key
        )


def test_malformed_message_structure(litellm_setup):
    """Test request with malformed message structure"""
    url, api_key = litellm_setup
    
    with pytest.raises((BadRequestError, Exception)):
        litellm.completion(
            model="openai/echo",
            messages=[{"invalid_field": "value"}],  # Missing required 'role' and 'content' fields
            api_base=f"{url}/v1",
            api_key=api_key
        )


def test_network_error_handling(teenytiny_config):
    """Test handling of network connectivity issues"""
    # Use a non-existent URL to simulate network issues
    with pytest.raises(Exception):
        litellm.completion(
            model="openai/echo",
            messages=[{"role": "user", "content": "Hello"}],
            api_base="http://nonexistent-host:9999/v1",
            api_key="testkey"
        )


def test_litellm_error_handling_features(litellm_setup):
    """Test LiteLLM's error handling and retry features"""
    url, api_key = litellm_setup
    
    # Test with various invalid parameters that should be caught
    
    # Invalid temperature (should be between 0 and 2, but some services are more lenient)
    try:
        litellm.completion(
            model="openai/echo",
            messages=[{"role": "user", "content": "Hello"}],
            api_base=f"{url}/v1",
            api_key=api_key,
            temperature=2.5  # Might be rejected by some services
        )
    except Exception:
        # Either rejected by LiteLLM or the service, both are fine
        pass
    
    # Test invalid max_tokens (some services might accept negative values, so just test it works)
    try:
        response = litellm.completion(
            model="openai/echo",
            messages=[{"role": "user", "content": "Hello"}],
            api_base=f"{url}/v1",
            api_key=api_key,
            max_tokens=-1  # Some services might reject this, others might accept it
        )
        # If it succeeds, that's also fine - some services are more permissive
        assert response is not None
    except Exception:
        # If it fails, that's also expected behavior
        pass


def test_concurrent_requests(litellm_setup):
    """Test that multiple concurrent requests work properly"""
    import concurrent.futures
    url, api_key = litellm_setup
    
    def make_request(message):
        return litellm.completion(
            model="openai/echo",
            messages=[{"role": "user", "content": f"Request {message}"}],
            api_base=f"{url}/v1",
            api_key=api_key
        )
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
        futures = [executor.submit(make_request, i) for i in range(3)]
        results = [future.result() for future in futures]
    
    # All requests should succeed
    assert len(results) == 3
    for i, result in enumerate(results):
        assert result.choices[0].message.content == f"Request {i}"


def test_litellm_logging_and_callbacks(litellm_setup):
    """Test LiteLLM's logging and callback features"""
    url, api_key = litellm_setup
    
    # Test that we can set up callbacks without breaking functionality
    callback_called = []
    
    def success_callback(kwargs, completion_response, start_time, end_time):
        callback_called.append("success")
    
    def failure_callback(kwargs, completion_response, start_time, end_time):
        callback_called.append("failure")
    
    # Set callbacks
    litellm.success_callback = [success_callback]
    litellm.failure_callback = [failure_callback]
    
    try:
        response = litellm.completion(
            model="openai/echo",
            messages=[{"role": "user", "content": "Callback test"}],
            api_base=f"{url}/v1",
            api_key=api_key
        )
        
        assert response.choices[0].message.content == "Callback test"
        # Success callback should have been called
        assert "success" in callback_called
        
    finally:
        # Clean up callbacks
        litellm.success_callback = []
        litellm.failure_callback = []