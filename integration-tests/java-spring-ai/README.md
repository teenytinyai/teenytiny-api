# Spring AI Integration Tests

Tests for TeenyTiny AI service compatibility with the Spring AI framework.

Here's how to use Spring AI with TeenyTiny AI in your own code:

```java
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.openai.OpenAiChatModel;
import org.springframework.ai.openai.OpenAiChatOptions;
import org.springframework.ai.openai.api.OpenAiApi;
import reactor.core.publisher.Flux;

OpenAiApi openAiApi = new OpenAiApi("https://teenytiny.ai", "your-api-key");

OpenAiChatOptions options = OpenAiChatOptions.builder()
    .withModel("echo")
    .withTemperature(0.7)
    .withMaxTokens(100)
    .build();

OpenAiChatModel chatModel = new OpenAiChatModel(openAiApi, options);

Prompt prompt = new Prompt("Hello World!");
ChatResponse response = chatModel.call(prompt);
System.out.println(response.getResult().getOutput().getContent());
```

## Configuration via Properties

You can also configure Spring AI using application properties:

```properties
spring.ai.openai.api-key=your-api-key
spring.ai.openai.base-url=https://teenytiny.ai
spring.ai.openai.chat.options.model=echo
spring.ai.openai.chat.options.temperature=0.7
```

