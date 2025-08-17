import os
import pytest
from langchain_openai import ChatOpenAI


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
def langchain_llm(teenytiny_config):
    """Create LangChain ChatOpenAI client configured for TeenyTiny AI service"""
    url, api_key = teenytiny_config
    
    return ChatOpenAI(
        base_url=f"{url}/v1",
        api_key=api_key,
        model="echo"
    )