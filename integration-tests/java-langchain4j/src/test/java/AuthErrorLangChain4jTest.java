import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import static org.junit.jupiter.api.Assertions.*;

import dev.langchain4j.model.chat.ChatLanguageModel;
import dev.langchain4j.model.openai.OpenAiChatModel;

@DisplayName("Auth Error LangChain4j Integration")
public class AuthErrorLangChain4jTest {
    
    @Test
    @DisplayName("unauthorized request with invalid API key")
    void unauthorizedRequestWithInvalidApiKey() {
        String baseUrl = System.getenv("TEENYTINY_URL");
        if (baseUrl == null) {
            baseUrl = "http://localhost:8080";
        }
        
        ChatLanguageModel model = OpenAiChatModel.builder()
            .baseUrl(baseUrl + "/v1")
            .apiKey("invalid-key")
            .modelName("echo")
            .build();
        
        assertThrows(RuntimeException.class, () -> {
            model.generate("Hello World");
        });
    }
    
    @Test
    @DisplayName("missing API key")
    void missingApiKey() {
        final String baseUrl = System.getenv("TEENYTINY_URL") != null ? 
            System.getenv("TEENYTINY_URL") : "http://localhost:8080";
        
        assertThrows(IllegalArgumentException.class, () -> {
            OpenAiChatModel.builder()
                .baseUrl(baseUrl + "/v1")
                .apiKey("")
                .modelName("echo")
                .build();
        });
    }
}