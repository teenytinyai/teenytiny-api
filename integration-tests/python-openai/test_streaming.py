import pytest


def test_streaming_completion(openai_client):
    """Test streaming chat completion"""
    stream = openai_client.chat.completions.create(
        model="echo",
        messages=[
            {"role": "user", "content": "Hello World"}
        ],
        stream=True
    )
    
    chunks = list(stream)
    assert len(chunks) > 0
    
    # First chunk should have role
    first_chunk = chunks[0]
    assert first_chunk.object == "chat.completion.chunk"
    assert first_chunk.model == "echo"
    assert len(first_chunk.choices) == 1
    assert first_chunk.choices[0].delta.role == "assistant"
    
    # Last chunk should have finish_reason and usage
    last_chunk = chunks[-1]
    assert last_chunk.choices[0].finish_reason == "stop"
    assert last_chunk.usage is not None
    assert last_chunk.usage.prompt_tokens > 0
    assert last_chunk.usage.completion_tokens > 0
    
    # Collect content from all chunks
    content_parts = []
    for chunk in chunks:
        if chunk.choices[0].delta.content:
            content_parts.append(chunk.choices[0].delta.content)
    
    full_content = "".join(content_parts)
    assert full_content == "Hello World"


def test_streaming_multi_message(openai_client):
    """Test streaming with multiple messages (should echo last user message)"""
    stream = openai_client.chat.completions.create(
        model="echo",
        messages=[
            {"role": "user", "content": "First message"},
            {"role": "assistant", "content": "First response"},
            {"role": "user", "content": "Last message"}
        ],
        stream=True
    )
    
    chunks = list(stream)
    
    # Collect content from all chunks
    content_parts = []
    for chunk in chunks:
        if chunk.choices[0].delta.content:
            content_parts.append(chunk.choices[0].delta.content)
    
    full_content = "".join(content_parts)
    assert full_content == "Last message"


def test_streaming_no_user_messages(openai_client):
    """Test streaming with no user messages (should get default response)"""
    stream = openai_client.chat.completions.create(
        model="echo",
        messages=[
            {"role": "system", "content": "You are a helpful assistant."}
        ],
        stream=True
    )
    
    chunks = list(stream)
    
    # Collect content from all chunks
    content_parts = []
    for chunk in chunks:
        if chunk.choices[0].delta.content:
            content_parts.append(chunk.choices[0].delta.content)
    
    full_content = "".join(content_parts)
    assert "Echo model" in full_content