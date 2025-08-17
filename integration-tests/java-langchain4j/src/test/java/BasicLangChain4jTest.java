import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import static org.junit.jupiter.api.Assertions.*;

import dev.langchain4j.model.chat.ChatLanguageModel;
import dev.langchain4j.model.openai.OpenAiChatModel;
import dev.langchain4j.data.message.AiMessage;
import dev.langchain4j.model.output.Response;

@DisplayName("Basic LangChain4j Integration")
public class BasicLangChain4jTest {
    
    private ChatLanguageModel model;
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
        
        model = OpenAiChatModel.builder()
            .baseUrl(baseUrl + "/v1")
            .apiKey(apiKey)
            .modelName("echo")
            .build();
    }
    
    @Test
    @DisplayName("basic completion with echo model")
    void basicCompletionWithEchoModel() {
        String response = model.generate("Hello World");
        
        assertNotNull(response);
        assertEquals("Hello World", response);
    }
    
    @Test
    @DisplayName("simple chat interaction")
    void simpleChatInteraction() {
        String userMessage = "What is 2+2?";
        String response = model.generate(userMessage);
        
        assertNotNull(response);
        assertEquals(userMessage, response);
    }
}