# LangChain Integration Tests

Tests for TeenyTiny AI service compatibility with the LangChain framework.

Here's how to use LangChain with TeenyTiny AI in your own code:

```python
import os
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage

# Configure LangChain ChatOpenAI for TeenyTiny AI service
llm = ChatOpenAI(
    base_url="https://teenytiny.ai/v1",
    api_key=os.getenv("TEENYTINY_API_KEY"),
    model="echo"
)

response = llm.invoke("Hello World")
print(response.content)
```

