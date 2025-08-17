import pytest
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage


def test_basic_invoke(langchain_llm):
    """Test basic LangChain invoke with echo model"""
    response = langchain_llm.invoke("Hello World")
    
    assert response.content == "Hello World"
    assert hasattr(response, 'usage_metadata')


def test_invoke_with_messages(langchain_llm):
    """Test LangChain invoke with message objects"""
    messages = [HumanMessage(content="Test message")]
    response = langchain_llm.invoke(messages)
    
    assert response.content == "Test message"


def test_multi_message_conversation(langchain_llm):
    """Test that echo model returns the last human message"""
    messages = [
        SystemMessage(content="You are a helpful assistant."),
        HumanMessage(content="First message"),
        AIMessage(content="First response"),
        HumanMessage(content="Second message")
    ]
    
    response = langchain_llm.invoke(messages)
    assert response.content == "Second message"


def test_no_human_messages_default_response(langchain_llm):
    """Test default response when no human messages are provided"""
    messages = [SystemMessage(content="You are a helpful assistant.")]
    
    response = langchain_llm.invoke(messages)
    
    # Should get the default echo model greeting
    assert "Echo model" in response.content
    assert "echo it back" in response.content


def test_response_metadata(langchain_llm):
    """Test that response includes proper metadata"""
    response = langchain_llm.invoke("Hello")
    
    # Check that usage metadata exists
    assert hasattr(response, 'usage_metadata')
    usage = response.usage_metadata
    
    assert 'input_tokens' in usage
    assert 'output_tokens' in usage
    assert 'total_tokens' in usage
    assert usage['input_tokens'] > 0
    assert usage['output_tokens'] > 0
    assert usage['total_tokens'] == usage['input_tokens'] + usage['output_tokens']


def test_chain_composition(langchain_llm):
    """Test LangChain's chain composition with echo model"""
    from langchain_core.output_parsers import StrOutputParser
    from langchain_core.prompts import ChatPromptTemplate
    
    prompt = ChatPromptTemplate.from_messages([
        ("human", "{input}")
    ])
    
    chain = prompt | langchain_llm | StrOutputParser()
    
    result = chain.invoke({"input": "Chain test"})
    assert result == "Chain test"