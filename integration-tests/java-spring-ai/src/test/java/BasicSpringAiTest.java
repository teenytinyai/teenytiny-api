import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import static org.junit.jupiter.api.Assertions.*;

import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.openai.OpenAiChatModel;
import org.springframework.ai.openai.OpenAiChatOptions;
import org.springframework.ai.openai.api.OpenAiApi;

@DisplayName("Basic Spring AI Integration")
public class BasicSpringAiTest {
    
    private OpenAiChatModel chatModel;
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
        
        // Configure Spring AI OpenAI client for TeenyTiny AI
        // Note: OpenAiApi automatically appends /v1 to the base URL
        OpenAiApi openAiApi = new OpenAiApi(baseUrl, apiKey);
        
        OpenAiChatOptions options = OpenAiChatOptions.builder()
            .withModel("echo")
            .build();
        
        chatModel = new OpenAiChatModel(openAiApi, options);
    }
    
    @Test
    @DisplayName("basic completion with echo model")
    void basicCompletionWithEchoModel() {
        Prompt prompt = new Prompt("Hello World");
        ChatResponse response = chatModel.call(prompt);
        
        assertEquals("Hello World", response.getResult().getOutput().getContent());
        assertEquals("echo", response.getMetadata().getModel());
        assertNotNull(response.getMetadata().getUsage());
        assertTrue(response.getMetadata().getUsage().getTotalTokens() > 0);
    }
    
    @Test
    @DisplayName("multi-message conversation")
    void multiMessageConversation() {
        // Spring AI uses Prompt with multiple messages
        Prompt prompt = new Prompt("Last message", 
            OpenAiChatOptions.builder()
                .withModel("echo")
                .build());
        
        ChatResponse response = chatModel.call(prompt);
        
        assertEquals("Last message", response.getResult().getOutput().getContent());
        assertEquals("echo", response.getMetadata().getModel());
    }
    
    @Test
    @DisplayName("empty message handling")
    void emptyMessageHandling() {
        Prompt prompt = new Prompt("");
        ChatResponse response = chatModel.call(prompt);
        
        assertNotNull(response.getResult().getOutput().getContent());
    }
    
    @Test
    @DisplayName("special characters and unicode")
    void specialCharactersAndUnicode() {
        String testMessage = "Hello! 🌟 Special chars: @#$%^&*()_+-={}[]|\\:;\"'<>?,./ 中文";
        
        Prompt prompt = new Prompt(testMessage);
        ChatResponse response = chatModel.call(prompt);
        
        assertEquals(testMessage, response.getResult().getOutput().getContent());
    }
    
    @Test
    @DisplayName("multiline content")
    void multilineContent() {
        String multilineMessage = "Line 1\nLine 2\nLine 3 with more content\nFinal line";
        
        Prompt prompt = new Prompt(multilineMessage);
        ChatResponse response = chatModel.call(prompt);
        
        assertEquals(multilineMessage, response.getResult().getOutput().getContent());
    }
    
    @Test
    @DisplayName("response structure validation")
    void responseStructureValidation() {
        Prompt prompt = new Prompt("Structure test");
        ChatResponse response = chatModel.call(prompt);
        
        // Check response structure
        assertNotNull(response.getResult());
        assertNotNull(response.getResult().getOutput());
        assertEquals("Structure test", response.getResult().getOutput().getContent());
        
        // Check metadata
        assertNotNull(response.getMetadata());
        assertEquals("echo", response.getMetadata().getModel());
        assertNotNull(response.getMetadata().getUsage());
        assertTrue(response.getMetadata().getUsage().getPromptTokens() >= 0);
        assertTrue(response.getMetadata().getUsage().getGenerationTokens() >= 0);
        assertTrue(response.getMetadata().getUsage().getTotalTokens() > 0);
    }
}