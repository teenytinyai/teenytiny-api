# Java LangChain4j Integration Tests

Tests for TeenyTiny AI service compatibility with the [LangChain4j](https://github.com/langchain4j/langchain4j) Java library.

Here's how to use LangChain4j with TeenyTiny AI in your own code:

```java
import dev.langchain4j.model.chat.ChatLanguageModel;
import dev.langchain4j.model.openai.OpenAiChatModel;

ChatLanguageModel model = OpenAiChatModel.builder()
    .baseUrl("https://teenytiny.ai/v1")
    .apiKey("your-api-key")
    .modelName("echo")
    .temperature(0.7)
    .build();

String response = model.generate("Hello World!");
System.out.println(response);
```
