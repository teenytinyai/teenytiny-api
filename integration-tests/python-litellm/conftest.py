import os
import pytest
import litellm


def get_config():
    """Get TeenyTiny AI service configuration from environment or defaults"""
    url = os.getenv("TEENYTINY_URL", "http://localhost:8080")
    api_key = os.getenv("TEENYTINY_API_KEY", "testkey")
    
    return url, api_key


@pytest.fixture(scope="session")
def teenytiny_config():
    """Get TeenyTiny AI service configuration from environment or defaults"""
    return get_config()


@pytest.fixture
def litellm_setup(teenytiny_config):
    """Configure LiteLLM for TeenyTiny AI service"""
    url, api_key = teenytiny_config
    
    # Configure LiteLLM to use our custom endpoint
    litellm.api_base = f"{url}/v1"
    litellm.api_key = api_key
    
    return url, api_key