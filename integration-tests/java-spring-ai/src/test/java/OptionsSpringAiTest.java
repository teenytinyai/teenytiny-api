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

@DisplayName("Options and Configuration Tests")
public class OptionsSpringAiTest {
    
    private OpenAiApi openAiApi;
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
        openAiApi = new OpenAiApi(baseUrl, apiKey);
    }
    
    @Test
    @DisplayName("custom temperature parameter")
    void customTemperatureParameter() {
        OpenAiChatOptions options = OpenAiChatOptions.builder()
            .withModel("echo")
            .withTemperature(0.7)
            .build();
        
        OpenAiChatModel chatModel = new OpenAiChatModel(openAiApi, options);
        
        Prompt prompt = new Prompt("Temperature test");
        ChatResponse response = chatModel.call(prompt);
        
        // Echo model should still return the same content regardless of temperature
        assertEquals("Temperature test", response.getResult().getOutput().getContent());
        assertEquals("echo", response.getMetadata().getModel());
    }
    
    @Test
    @DisplayName("custom max_tokens parameter")
    void customMaxTokensParameter() {
        OpenAiChatOptions options = OpenAiChatOptions.builder()
            .withModel("echo")
            .withMaxTokens(50)
            .build();
        
        OpenAiChatModel chatModel = new OpenAiChatModel(openAiApi, options);
        
        Prompt prompt = new Prompt("Max tokens test");
        ChatResponse response = chatModel.call(prompt);
        
        assertEquals("Max tokens test", response.getResult().getOutput().getContent());
        // Usage tokens should be within reasonable bounds for the echo model
        assertTrue(response.getMetadata().getUsage().getTotalTokens() <= 100);
    }
    
    @Test
    @DisplayName("multiple parameters combined")
    void multipleParametersCombined() {
        OpenAiChatOptions options = OpenAiChatOptions.builder()
            .withModel("echo")
            .withTemperature(0.5)
            .withMaxTokens(100)
            .withTopP(0.9)
            .build();
        
        OpenAiChatModel chatModel = new OpenAiChatModel(openAiApi, options);
        
        Prompt prompt = new Prompt("Combined parameters");
        ChatResponse response = chatModel.call(prompt);
        
        assertEquals("Combined parameters", response.getResult().getOutput().getContent());
        assertEquals("echo", response.getMetadata().getModel());
        assertNotNull(response.getMetadata().getUsage());
    }
    
    @Test
    @DisplayName("streaming with parameters")
    void streamingWithParameters() {
        OpenAiChatOptions options = OpenAiChatOptions.builder()
            .withModel("echo")
            .withTemperature(0.8)
            .withMaxTokens(75)
            .build();
        
        OpenAiChatModel chatModel = new OpenAiChatModel(openAiApi, options);
        
        Prompt prompt = new Prompt("Streaming with options");
        Flux<ChatResponse> stream = chatModel.stream(prompt);
        
        List<ChatResponse> responses = stream.collectList().block();
        
        StringBuilder reconstructedContent = new StringBuilder();
        
        for (ChatResponse response : responses) {
            assertEquals("echo", response.getMetadata().getModel());
            
            String content = response.getResult().getOutput().getContent();
            if (content != null) {
                reconstructedContent.append(content);
            }
        }
        
        assertEquals("Streaming with options", reconstructedContent.toString());
    }
    
    @Test
    @DisplayName("seed parameter for reproducibility")
    void seedParameterForReproducibility() {
        String testMessage = "Seed test message";
        
        // First request with seed
        OpenAiChatOptions options1 = OpenAiChatOptions.builder()
            .withModel("echo")
            .withSeed(12345)
            .build();
        
        OpenAiChatModel chatModel1 = new OpenAiChatModel(openAiApi, options1);
        
        // Second request with same seed
        OpenAiChatOptions options2 = OpenAiChatOptions.builder()
            .withModel("echo")
            .withSeed(12345)
            .build();
        
        OpenAiChatModel chatModel2 = new OpenAiChatModel(openAiApi, options2);
        
        Prompt prompt1 = new Prompt(testMessage);
        Prompt prompt2 = new Prompt(testMessage);
        
        ChatResponse response1 = chatModel1.call(prompt1);
        ChatResponse response2 = chatModel2.call(prompt2);
        
        // Echo model should return identical responses
        assertEquals(response1.getResult().getOutput().getContent(),
                    response2.getResult().getOutput().getContent());
        assertEquals(testMessage, response1.getResult().getOutput().getContent());
    }
    
    @Test
    @DisplayName("frequency and presence penalty parameters")
    void frequencyAndPresencePenaltyParameters() {
        OpenAiChatOptions options = OpenAiChatOptions.builder()
            .withModel("echo")
            .withFrequencyPenalty(0.5)
            .withPresencePenalty(0.3)
            .build();
        
        OpenAiChatModel chatModel = new OpenAiChatModel(openAiApi, options);
        
        Prompt prompt = new Prompt("Penalty parameters test");
        ChatResponse response = chatModel.call(prompt);
        
        // Echo model should still work with penalty parameters
        assertEquals("Penalty parameters test", response.getResult().getOutput().getContent());
        assertEquals("echo", response.getMetadata().getModel());
    }
}