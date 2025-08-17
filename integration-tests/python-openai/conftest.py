import os
import pytest
from openai import OpenAI


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
def openai_client(teenytiny_config):
    """Create OpenAI client configured for TeenyTiny AI service"""
    url, api_key = teenytiny_config
    
    return OpenAI(
        base_url=f"{url}/v1",
        api_key=api_key
    )