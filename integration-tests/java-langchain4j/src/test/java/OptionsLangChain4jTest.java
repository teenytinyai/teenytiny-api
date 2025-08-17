import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import static org.junit.jupiter.api.Assertions.*;

import dev.langchain4j.model.chat.ChatLanguageModel;
import dev.langchain4j.model.openai.OpenAiChatModel;
import dev.langchain4j.model.openai.OpenAiChatModelName;

@DisplayName("Options LangChain4j Integration")
public class OptionsLangChain4jTest {
    
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
    }
    
    @Test
    @DisplayName("custom temperature option")
    void customTemperatureOption() {
        ChatLanguageModel model = OpenAiChatModel.builder()
            .baseUrl(baseUrl + "/v1")
            .apiKey(apiKey)
            .modelName("echo")
            .temperature(0.7)
            .build();
        
        String response = model.generate("Hello with temperature");
        assertEquals("Hello with temperature", response);
    }
    
    @Test
    @DisplayName("custom max tokens option")
    void customMaxTokensOption() {
        ChatLanguageModel model = OpenAiChatModel.builder()
            .baseUrl(baseUrl + "/v1")
            .apiKey(apiKey)
            .modelName("echo")
            .maxTokens(50)
            .build();
        
        String response = model.generate("Hello with max tokens");
        assertEquals("Hello with max tokens", response);
    }
    
    @Test
    @DisplayName("multiple options combined")
    void multipleOptionsCombined() {
        ChatLanguageModel model = OpenAiChatModel.builder()
            .baseUrl(baseUrl + "/v1")
            .apiKey(apiKey)
            .modelName("echo")
            .temperature(0.5)
            .maxTokens(100)
            .build();
        
        String response = model.generate("Hello with multiple options");
        assertEquals("Hello with multiple options", response);
    }
}