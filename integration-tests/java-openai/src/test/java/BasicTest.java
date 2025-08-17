import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import static org.junit.jupiter.api.Assertions.*;

import com.openai.client.OpenAIClient;
import com.openai.client.okhttp.OpenAIOkHttpClient;
import com.openai.models.*;

import java.util.List;

@DisplayName("Basic OpenAI SDK Integration")
public class BasicTest {
    
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
    @DisplayName("basic completion with echo model")
    void basicCompletionWithEchoModel() {
        ChatCompletionCreateParams params = ChatCompletionCreateParams.builder()
            .model("echo")
            .addMessage(ChatCompletionMessageParam.ofChatCompletionUserMessageParam(
                ChatCompletionUserMessageParam.builder()
                    .content(ChatCompletionUserMessageParam.Content.ofTextContent("Hello World"))
                    .role(ChatCompletionUserMessageParam.Role.USER)
                    .build()
            ))
            .build();
        
        ChatCompletion completion = client.chat().completions().create(params);
        
        assertEquals("Hello World", completion.choices().get(0).message().content().get());
        assertEquals("echo", completion.model());
        assertEquals(ChatCompletion.Object.CHAT_COMPLETION, completion.object_());
        assertTrue(completion.usage().get().totalTokens() > 0);
    }
}