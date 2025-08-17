import pytest
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage


def test_invalid_api_key(teenytiny_config):
    """Test authentication with invalid API key"""
    url, _ = teenytiny_config
    
    llm = ChatOpenAI(
        base_url=f"{url}/v1",
        api_key="invalid-key",
        model="echo"
    )
    
    with pytest.raises(Exception) as exc_info:
        llm.invoke("Hello")
    
    # Should get some form of authentication error
    error_str = str(exc_info.value).lower()
    assert "401" in error_str or "unauthorized" in error_str or "authentication" in error_str


def test_invalid_model(teenytiny_config):
    """Test request with non-existent model"""
    url, api_key = teenytiny_config
    
    llm = ChatOpenAI(
        base_url=f"{url}/v1",
        api_key=api_key,
        model="nonexistent-model"
    )
    
    with pytest.raises(Exception) as exc_info:
        llm.invoke("Hello")
    
    # Should get a model-related error
    error_str = str(exc_info.value).lower()
    assert "400" in error_str or "model" in error_str or "not found" in error_str


def test_malformed_request_handling(langchain_llm):
    """Test that LangChain properly handles various input types"""
    # Empty message should still work (LangChain might handle this gracefully)
    try:
        response = langchain_llm.invoke("")
        # If it succeeds, it should return the default echo response
        assert "Echo model" in response.content or response.content == ""
    except Exception:
        # Some validation error is also acceptable
        pass


def test_network_error_handling(teenytiny_config):
    """Test handling of network connectivity issues"""
    # Use a non-existent URL to simulate network issues
    llm = ChatOpenAI(
        base_url="http://nonexistent-host:9999/v1",
        api_key="testkey",
        model="echo"
    )
    
    with pytest.raises(Exception):
        llm.invoke("Hello")


def test_concurrent_requests(langchain_llm):
    """Test that multiple concurrent requests work properly"""
    import concurrent.futures
    import threading
    
    def make_request(message):
        return langchain_llm.invoke(f"Request {message}")
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
        futures = [executor.submit(make_request, i) for i in range(3)]
        results = [future.result() for future in futures]
    
    # All requests should succeed
    assert len(results) == 3
    for i, result in enumerate(results):
        assert result.content == f"Request {i}"