import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import static org.junit.jupiter.api.Assertions.*;

import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.openai.OpenAiChatModel;
import org.springframework.ai.openai.OpenAiChatOptions;
import org.springframework.ai.openai.api.OpenAiApi;
import reactor.core.publisher.Flux;

import java.util.List;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;

@DisplayName("Streaming Spring AI Integration")
public class StreamingSpringAiTest {
    
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
        OpenAiApi openAiApi = new OpenAiApi(baseUrl, apiKey);
        
        OpenAiChatOptions options = OpenAiChatOptions.builder()
            .withModel("echo")
            .build();
        
        chatModel = new OpenAiChatModel(openAiApi, options);
    }
    
    @Test
    @DisplayName("basic streaming completion")
    void basicStreamingCompletion() {
        Prompt prompt = new Prompt("Hello Stream");
        Flux<ChatResponse> stream = chatModel.stream(prompt);
        
        List<ChatResponse> responses = stream.collectList().block();
        
        assertFalse(responses.isEmpty(), "Should receive at least one response");
        
        // Collect content from all chunks
        StringBuilder content = new StringBuilder();
        AtomicBoolean foundFinishReason = new AtomicBoolean(false);
        
        for (ChatResponse response : responses) {
            if (response.getResult().getOutput().getContent() != null) {
                content.append(response.getResult().getOutput().getContent());
            }
            
            // Check for finish reason in metadata
            if (response.getResult().getMetadata() != null && 
                response.getResult().getMetadata().getFinishReason() != null &&
                !response.getResult().getMetadata().getFinishReason().isEmpty()) {
                foundFinishReason.set(true);
                assertEquals("STOP", response.getResult().getMetadata().getFinishReason());
            }
        }
        
        assertEquals("Hello Stream", content.toString());
        assertTrue(foundFinishReason.get(), "Should receive finish reason");
        
        // Verify response structure
        ChatResponse firstResponse = responses.get(0);
        assertEquals("echo", firstResponse.getMetadata().getModel());
        assertNotNull(firstResponse.getMetadata().getId());
    }
    
    @Test
    @DisplayName("streaming content reconstruction")
    void streamingContentReconstruction() {
        Prompt prompt = new Prompt("Reconstruct me");
        Flux<ChatResponse> stream = chatModel.stream(prompt);
        
        List<ChatResponse> responses = stream.collectList().block();
        
        StringBuilder reconstructedContent = new StringBuilder();
        
        for (ChatResponse response : responses) {
            String content = response.getResult().getOutput().getContent();
            if (content != null) {
                reconstructedContent.append(content);
            }
        }
        
        assertEquals("Reconstruct me", reconstructedContent.toString());
    }
    
    @Test
    @DisplayName("streaming with multiline content")
    void streamingWithMultilineContent() {
        String multilineMessage = "Line 1\nLine 2\nLine 3";
        
        Prompt prompt = new Prompt(multilineMessage);
        Flux<ChatResponse> stream = chatModel.stream(prompt);
        
        List<ChatResponse> responses = stream.collectList().block();
        
        StringBuilder reconstructedContent = new StringBuilder();
        AtomicInteger chunkCount = new AtomicInteger(0);
        
        for (ChatResponse response : responses) {
            chunkCount.incrementAndGet();
            String content = response.getResult().getOutput().getContent();
            if (content != null) {
                reconstructedContent.append(content);
            }
        }
        
        assertTrue(chunkCount.get() > 0, "Should receive chunks");
        assertEquals(multilineMessage, reconstructedContent.toString());
    }
    
    @Test
    @DisplayName("streaming with special characters")
    void streamingWithSpecialCharacters() {
        String specialMessage = "Hello! 🌟 Special: @#$%";
        
        Prompt prompt = new Prompt(specialMessage);
        Flux<ChatResponse> stream = chatModel.stream(prompt);
        
        List<ChatResponse> responses = stream.collectList().block();
        
        StringBuilder reconstructedContent = new StringBuilder();
        
        for (ChatResponse response : responses) {
            String content = response.getResult().getOutput().getContent();
            if (content != null) {
                reconstructedContent.append(content);
            }
        }
        
        assertEquals(specialMessage, reconstructedContent.toString());
    }
    
    @Test
    @DisplayName("streaming response structure validation")
    void streamingResponseStructureValidation() {
        Prompt prompt = new Prompt("Structure validation");
        Flux<ChatResponse> stream = chatModel.stream(prompt);
        
        List<ChatResponse> responses = stream.collectList().block();
        
        AtomicBoolean foundValidContent = new AtomicBoolean(false);
        
        for (ChatResponse response : responses) {
            assertNotNull(response.getResult(), "Each response should have a result");
            assertNotNull(response.getResult().getOutput(), "Each result should have output");
            assertNotNull(response.getMetadata(), "Each response should have metadata");
            assertEquals("echo", response.getMetadata().getModel());
            
            // If this chunk has content, validate it
            if (response.getResult().getOutput().getContent() != null) {
                foundValidContent.set(true);
            }
        }
        
        assertTrue(foundValidContent.get(), "Should find at least one response with content");
    }
}