import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import static org.junit.jupiter.api.Assertions.*;

import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.openai.OpenAiChatModel;
import org.springframework.ai.openai.OpenAiChatOptions;
import org.springframework.ai.openai.api.OpenAiApi;
import org.springframework.ai.retry.NonTransientAiException;

@DisplayName("Authentication Error Tests")
public class AuthErrorSpringAiTest {
    
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
        OpenAiApi openAiApi = new OpenAiApi(baseUrl, "");  // Empty API key
        
        OpenAiChatOptions options = OpenAiChatOptions.builder()
            .withModel("echo")
            .build();
        
        OpenAiChatModel chatModel = new OpenAiChatModel(openAiApi, options);
        
        Prompt prompt = new Prompt("Test message");
        
        NonTransientAiException exception = assertThrows(NonTransientAiException.class, () -> {
            chatModel.call(prompt);
        });
        
        assertTrue(exception.getMessage().contains("401") || 
                  exception.getMessage().contains("Unauthorized"));
    }
    
    @Test
    @DisplayName("invalid API key should return 401")
    void invalidApiKeyReturns401() {
        OpenAiApi openAiApi = new OpenAiApi(baseUrl, "invalid-key-12345");
        
        OpenAiChatOptions options = OpenAiChatOptions.builder()
            .withModel("echo")
            .build();
        
        OpenAiChatModel chatModel = new OpenAiChatModel(openAiApi, options);
        
        Prompt prompt = new Prompt("Test message");
        
        NonTransientAiException exception = assertThrows(NonTransientAiException.class, () -> {
            chatModel.call(prompt);
        });
        
        assertTrue(exception.getMessage().contains("401") || 
                  exception.getMessage().contains("Unauthorized"));
    }
    
    @Test
    @DisplayName("streaming with invalid API key should return 401")
    void streamingWithInvalidApiKeyReturns401() {
        OpenAiApi openAiApi = new OpenAiApi(baseUrl, "invalid-streaming-key");
        
        OpenAiChatOptions options = OpenAiChatOptions.builder()
            .withModel("echo")
            .build();
        
        OpenAiChatModel chatModel = new OpenAiChatModel(openAiApi, options);
        
        Prompt prompt = new Prompt("Test message");
        
        assertThrows(Exception.class, () -> {
            // This should fail when we try to collect the stream
            chatModel.stream(prompt).collectList().block();
        });
    }
}