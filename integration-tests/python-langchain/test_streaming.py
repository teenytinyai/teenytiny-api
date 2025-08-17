import pytest
from langchain_core.messages import HumanMessage


def test_streaming_invoke(langchain_llm):
    """Test LangChain streaming with echo model"""
    chunks = []
    
    for chunk in langchain_llm.stream("Hello World"):
        chunks.append(chunk)
    
    assert len(chunks) > 0
    
    # Combine all content chunks
    full_content = ""
    for chunk in chunks:
        if chunk.content:
            full_content += chunk.content
    
    assert full_content == "Hello World"


def test_streaming_with_messages(langchain_llm):
    """Test streaming with message objects"""
    messages = [HumanMessage(content="Stream test")]
    chunks = list(langchain_llm.stream(messages))
    
    assert len(chunks) > 0
    
    # Combine content
    full_content = "".join(chunk.content for chunk in chunks if chunk.content)
    assert full_content == "Stream test"


def test_streaming_multi_message(langchain_llm):
    """Test streaming with multiple messages (should echo last human message)"""
    messages = [
        HumanMessage(content="First message"),
        HumanMessage(content="Last message")
    ]
    
    chunks = list(langchain_llm.stream(messages))
    full_content = "".join(chunk.content for chunk in chunks if chunk.content)
    
    assert full_content == "Last message"


def test_async_streaming(langchain_llm):
    """Test async streaming functionality"""
    import asyncio
    
    async def test_async():
        chunks = []
        async for chunk in langchain_llm.astream("Async test"):
            chunks.append(chunk)
        
        assert len(chunks) > 0
        full_content = "".join(chunk.content for chunk in chunks if chunk.content)
        assert full_content == "Async test"
    
    asyncio.run(test_async())


def test_streaming_usage_metadata(langchain_llm):
    """Test that streaming includes usage metadata in final chunk"""
    chunks = list(langchain_llm.stream("Usage test"))
    
    # Find the chunk with usage metadata (typically the last one)
    usage_chunk = None
    for chunk in chunks:
        if hasattr(chunk, 'usage_metadata') and chunk.usage_metadata:
            usage_chunk = chunk
            break
    
    assert usage_chunk is not None
    usage = usage_chunk.usage_metadata
    assert 'input_tokens' in usage
    assert 'output_tokens' in usage
    assert 'total_tokens' in usage