import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import static org.junit.jupiter.api.Assertions.*;

import com.openai.client.OpenAIClient;
import com.openai.client.okhttp.OpenAIOkHttpClient;
import com.openai.models.*;
import com.openai.core.http.StreamResponse;

import java.util.List;
import java.util.ArrayList;
import java.util.concurrent.atomic.AtomicBoolean;

@DisplayName("Streaming OpenAI SDK Integration")
public class StreamingTest {
    
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
    @DisplayName("basic streaming completion")
    void basicStreamingCompletion() {
        ChatCompletionCreateParams params = ChatCompletionCreateParams.builder()
            .model("echo")
            .addMessage(ChatCompletionMessageParam.ofChatCompletionUserMessageParam(
                ChatCompletionUserMessageParam.builder()
                    .content(ChatCompletionUserMessageParam.Content.ofTextContent("Hello Stream"))
                    .role(ChatCompletionUserMessageParam.Role.USER)
                    .build()
            ))
            .build();
        
        StreamResponse<ChatCompletionChunk> stream = client.chat().completions().createStreaming(params);
        
        List<ChatCompletionChunk> chunks = new ArrayList<>();
        AtomicBoolean foundContentChunk = new AtomicBoolean(false);
        AtomicBoolean foundFinalChunk = new AtomicBoolean(false);
        
        stream.stream().forEach(chunk -> {
            chunks.add(chunk);
            
            // Check for content chunks
            if (!chunk.choices().isEmpty() && 
                chunk.choices().get(0).delta().content().isPresent()) {
                foundContentChunk.set(true);
            }
            
            // Check for final chunk with finish_reason
            if (!chunk.choices().isEmpty() && 
                chunk.choices().get(0).finishReason().isPresent()) {
                foundFinalChunk.set(true);
                assertEquals(ChatCompletionChunk.Choice.FinishReason.STOP, 
                           chunk.choices().get(0).finishReason().get());
            }
        });
        
        assertFalse(chunks.isEmpty(), "Should receive at least one chunk");
        assertTrue(foundContentChunk.get(), "Should receive at least one content chunk");
        assertTrue(foundFinalChunk.get(), "Should receive final chunk with finish_reason");
        
        // Verify stream structure
        ChatCompletionChunk firstChunk = chunks.get(0);
        assertEquals("echo", firstChunk.model());
        assertEquals(ChatCompletionChunk.Object.CHAT_COMPLETION_CHUNK, firstChunk.object_());
        assertNotNull(firstChunk.id());
        assertNotNull(firstChunk.created());
    }
}