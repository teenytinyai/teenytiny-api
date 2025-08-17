# Go OpenAI SDK Integration Tests

Tests for TeenyTiny AI service compatibility with the unofficial Go OpenAI SDK.

Here's how to use the Go OpenAI SDK with TeenyTiny AI in your own code:

```go
package main

import (
	"context"
	"fmt"
	"log"
	"os"

	"github.com/sashabaranov/go-openai"
)

func main() {
	// Configure Go OpenAI client for TeenyTiny AI
	apiKey := os.Getenv("TEENYTINY_API_KEY")
	config := openai.DefaultConfig(apiKey)
	config.BaseURL = "https://teenytiny.ai/v1"
	client := openai.NewClientWithConfig(config)

	// Basic completion
	resp, err := client.CreateChatCompletion(
		context.Background(),
		openai.ChatCompletionRequest{
			Model: "echo",
			Messages: []openai.ChatCompletionMessage{
				{
					Role:    openai.ChatMessageRoleUser,
					Content: "Hello World!",
				},
			},
		},
	)

	if err != nil {
		log.Fatal(err)
	}

	fmt.Println(resp.Choices[0].Message.Content)
}
```

