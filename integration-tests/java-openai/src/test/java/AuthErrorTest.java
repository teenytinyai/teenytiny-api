import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import static org.junit.jupiter.api.Assertions.*;

import com.openai.client.OpenAIClient;
import com.openai.client.okhttp.OpenAIOkHttpClient;
import com.openai.models.*;
import com.openai.errors.UnauthorizedException;
import com.openai.errors.BadRequestException;

@DisplayName("Authentication Error Tests")
public class AuthErrorTest {
    
    private String baseUrl;
    
    @BeforeEach
    void setUp() {
        baseUrl = System.getenv("TEENYTINY_URL");
        if (baseUrl == null) {
            baseUrl = "http://localhost:8080";
        }
    }
    
    @Test
    @DisplayName("missing API key should return 401")
    void missingApiKeyReturns401() {
        OpenAIClient client = OpenAIOkHttpClient.builder()
            .apiKey("")  // Empty API key
            .baseUrl(baseUrl + "/v1")
            .build();
        
        ChatCompletionCreateParams params = ChatCompletionCreateParams.builder()
            .model("echo")
            .addMessage(ChatCompletionMessageParam.ofChatCompletionUserMessageParam(
                ChatCompletionUserMessageParam.builder()
                    .content(ChatCompletionUserMessageParam.Content.ofTextContent("Test message"))
                    .role(ChatCompletionUserMessageParam.Role.USER)
                    .build()
            ))
            .build();
        
        assertThrows(UnauthorizedException.class, () -> {
            client.chat().completions().create(params);
        });
    }
    
    @Test
    @DisplayName("invalid API key should return 401")
    void invalidApiKeyReturns401() {
        OpenAIClient client = OpenAIOkHttpClient.builder()
            .apiKey("invalid-key-12345")
            .baseUrl(baseUrl + "/v1")
            .build();
        
        ChatCompletionCreateParams params = ChatCompletionCreateParams.builder()
            .model("echo")
            .addMessage(ChatCompletionMessageParam.ofChatCompletionUserMessageParam(
                ChatCompletionUserMessageParam.builder()
                    .content(ChatCompletionUserMessageParam.Content.ofTextContent("Test message"))
                    .role(ChatCompletionUserMessageParam.Role.USER)
                    .build()
            ))
            .build();
        
        assertThrows(UnauthorizedException.class, () -> {
            client.chat().completions().create(params);
        });
    }
}