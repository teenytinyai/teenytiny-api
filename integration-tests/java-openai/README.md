# Java OpenAI SDK Integration Tests

Tests for TeenyTiny AI service compatibility with the official OpenAI Java SDK.

Here's how to use the OpenAI Java SDK with TeenyTiny AI in your own code:

```java
import com.openai.client.OpenAIClient;
import com.openai.client.okhttp.OpenAIOkHttpClient;
import com.openai.models.*;

OpenAIClient client = OpenAIOkHttpClient.builder()
    .apiKey("your-api-key")
    .baseUrl("https://teenytiny.ai/v1")
    .build();

ChatCompletionCreateParams params = ChatCompletionCreateParams.builder()
    .model("echo")
    .addMessage(ChatCompletionMessageParam.ofChatCompletionUserMessageParam(
        ChatCompletionUserMessageParam.builder()
            .content(ChatCompletionUserMessageParam.Content.ofTextContent("Hello World!"))
            .role(ChatCompletionUserMessageParam.Role.USER)
            .build()
    ))
    .build();

ChatCompletion completion = client.chat().completions().create(params);
System.out.println(completion.choices().get(0).message().content().get());

```

