import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import static org.junit.jupiter.api.Assertions.*;

import com.openai.client.OpenAIClient;
import com.openai.client.okhttp.OpenAIOkHttpClient;
import com.openai.models.*;

@DisplayName("Options and Configuration Tests")
public class OptionsTest {
    
    private OpenAIClient client;
    private String baseUrl;
    private String apiKey;
    
    @BeforeEach
    void setUp() {
        baseUrl = System.getenv("TEENYTINY_URL");
        if (baseUrl == null) {
            baseUrl = "http://localhost:8080";
        }
        
        apiKey = System.getenv("TEENYTINY_API_KEY");
        if (apiKey == null) {
            apiKey = "testkey";
        }
        
        client = OpenAIOkHttpClient.builder()
            .apiKey(apiKey)
            .baseUrl(baseUrl + "/v1")
            .build();
    }
    
    @Test
    @DisplayName("custom temperature parameter")
    void customTemperatureParameter() {
        ChatCompletionCreateParams params = ChatCompletionCreateParams.builder()
            .model("echo")
            .temperature(0.7)
            .addMessage(ChatCompletionMessageParam.ofChatCompletionUserMessageParam(
                ChatCompletionUserMessageParam.builder()
                    .content(ChatCompletionUserMessageParam.Content.ofTextContent("Temperature test"))
                    .role(ChatCompletionUserMessageParam.Role.USER)
                    .build()
            ))
            .build();
        
        ChatCompletion completion = client.chat().completions().create(params);
        
        // Echo model should still return the same content regardless of temperature
        assertEquals("Temperature test", completion.choices().get(0).message().content().get());
        assertEquals("echo", completion.model());
    }
    
    @Test
    @DisplayName("custom max_tokens parameter")
    void customMaxTokensParameter() {
        ChatCompletionCreateParams params = ChatCompletionCreateParams.builder()
            .model("echo")
            .maxTokens(50)
            .addMessage(ChatCompletionMessageParam.ofChatCompletionUserMessageParam(
                ChatCompletionUserMessageParam.builder()
                    .content(ChatCompletionUserMessageParam.Content.ofTextContent("Max tokens test"))
                    .role(ChatCompletionUserMessageParam.Role.USER)
                    .build()
            ))
            .build();
        
        ChatCompletion completion = client.chat().completions().create(params);
        
        assertEquals("Max tokens test", completion.choices().get(0).message().content().get());
        // Usage tokens should be within reasonable bounds for the echo model
        assertTrue(completion.usage().get().totalTokens() <= 100);
    }
}