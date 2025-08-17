import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import static org.junit.jupiter.api.Assertions.*;

import dev.langchain4j.model.chat.StreamingChatLanguageModel;
import dev.langchain4j.model.openai.OpenAiStreamingChatModel;
import dev.langchain4j.model.StreamingResponseHandler;
import dev.langchain4j.model.output.Response;
import dev.langchain4j.data.message.AiMessage;

import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

@DisplayName("Streaming LangChain4j Integration")
public class StreamingLangChain4jTest {
    
    private StreamingChatLanguageModel model;
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
        
        model = OpenAiStreamingChatModel.builder()
            .baseUrl(baseUrl + "/v1")
            .apiKey(apiKey)
            .modelName("echo")
            .build();
    }
    
    @Test
    @DisplayName("streaming completion with echo model")
    void streamingCompletionWithEchoModel() throws Exception {
        String testMessage = "Hello Streaming World";
        CompletableFuture<String> future = new CompletableFuture<>();
        StringBuilder content = new StringBuilder();
        
        model.generate(testMessage, new StreamingResponseHandler<AiMessage>() {
            @Override
            public void onNext(String token) {
                content.append(token);
            }
            
            @Override
            public void onComplete(Response<AiMessage> response) {
                future.complete(content.toString());
            }
            
            @Override
            public void onError(Throwable error) {
                future.completeExceptionally(error);
            }
        });
        
        String result = future.get(10, TimeUnit.SECONDS);
        assertEquals(testMessage, result);
    }
}