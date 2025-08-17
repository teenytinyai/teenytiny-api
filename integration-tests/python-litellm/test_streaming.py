import pytest
import litellm


def test_streaming_completion(litellm_setup):
    """Test LiteLLM streaming with echo model"""
    url, api_key = litellm_setup
    
    response = litellm.completion(
        model="openai/echo",
        messages=[{"role": "user", "content": "Hello World"}],
        api_base=f"{url}/v1",
        api_key=api_key,
        stream=True
    )
    
    chunks = list(response)
    assert len(chunks) > 0
    
    # Combine content from all chunks
    full_content = ""
    for chunk in chunks:
        if chunk.choices and chunk.choices[0].delta and chunk.choices[0].delta.content:
            full_content += chunk.choices[0].delta.content
    
    assert full_content == "Hello World"


def test_streaming_multi_message(litellm_setup):
    """Test streaming with multiple messages (should echo last user message)"""
    url, api_key = litellm_setup
    
    response = litellm.completion(
        model="openai/echo",
        messages=[
            {"role": "user", "content": "First message"},
            {"role": "assistant", "content": "First response"},
            {"role": "user", "content": "Last message"}
        ],
        api_base=f"{url}/v1",
        api_key=api_key,
        stream=True
    )
    
    chunks = list(response)
    
    # Combine content from all chunks
    full_content = ""
    for chunk in chunks:
        if chunk.choices and chunk.choices[0].delta and chunk.choices[0].delta.content:
            full_content += chunk.choices[0].delta.content
    
    assert full_content == "Last message"


def test_streaming_chunk_structure(litellm_setup):
    """Test that streaming chunks have proper structure"""
    url, api_key = litellm_setup
    
    response = litellm.completion(
        model="openai/echo",
        messages=[{"role": "user", "content": "Structure test"}],
        api_base=f"{url}/v1",
        api_key=api_key,
        stream=True
    )
    
    chunks = list(response)
    assert len(chunks) > 0
    
    # Check first chunk (should have role)
    first_chunk = chunks[0]
    assert hasattr(first_chunk, 'id')
    assert hasattr(first_chunk, 'object')
    assert first_chunk.object == 'chat.completion.chunk'
    assert hasattr(first_chunk, 'created')
    assert hasattr(first_chunk, 'model')
    assert first_chunk.model == 'echo'
    assert hasattr(first_chunk, 'choices')
    
    # Check that we get delta content
    content_chunks = [c for c in chunks if c.choices and c.choices[0].delta and c.choices[0].delta.content]
    assert len(content_chunks) > 0
    
    # Check last chunk (should have finish_reason and usage)
    last_chunk = chunks[-1]
    if last_chunk.choices:
        choice = last_chunk.choices[0]
        # Last chunk should have finish_reason
        assert hasattr(choice, 'finish_reason')
        if choice.finish_reason:
            assert choice.finish_reason == 'stop'
    
    # Check for usage in final chunk (might not be present in all implementations)
    usage_chunks = [c for c in chunks if hasattr(c, 'usage') and c.usage]
    # Usage might be in the final chunk or not present in streaming - both are acceptable
    if len(usage_chunks) > 0:
        usage = usage_chunks[0].usage
        assert hasattr(usage, 'prompt_tokens')
        assert hasattr(usage, 'completion_tokens')
        assert hasattr(usage, 'total_tokens')


def test_async_streaming(litellm_setup):
    """Test async streaming functionality"""
    import asyncio
    url, api_key = litellm_setup
    
    async def test_async():
        response = await litellm.acompletion(
            model="openai/echo",
            messages=[{"role": "user", "content": "Async test"}],
            api_base=f"{url}/v1",
            api_key=api_key,
            stream=True
        )
        
        chunks = []
        async for chunk in response:
            chunks.append(chunk)
        
        assert len(chunks) > 0
        
        full_content = ""
        for chunk in chunks:
            if chunk.choices and chunk.choices[0].delta and chunk.choices[0].delta.content:
                full_content += chunk.choices[0].delta.content
        
        assert full_content == "Async test"
    
    asyncio.run(test_async())


def test_streaming_no_user_messages(litellm_setup):
    """Test streaming with no user messages (should get default response)"""
    url, api_key = litellm_setup
    
    response = litellm.completion(
        model="openai/echo",
        messages=[{"role": "system", "content": "You are a helpful assistant."}],
        api_base=f"{url}/v1",
        api_key=api_key,
        stream=True
    )
    
    chunks = list(response)
    
    # Combine content from all chunks
    full_content = ""
    for chunk in chunks:
        if chunk.choices and chunk.choices[0].delta and chunk.choices[0].delta.content:
            full_content += chunk.choices[0].delta.content
    
    assert "Echo model" in full_content