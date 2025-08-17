package main

import (
	"context"
	"os"
	"testing"

	"github.com/sashabaranov/go-openai"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func setupClient(t *testing.T) *openai.Client {
	baseURL := os.Getenv("TEENYTINY_URL")
	if baseURL == "" {
		baseURL = "http://localhost:8080"
	}

	apiKey := os.Getenv("TEENYTINY_API_KEY")
	if apiKey == "" {
		apiKey = "testkey"
	}

	config := openai.DefaultConfig(apiKey)
	config.BaseURL = baseURL + "/v1"

	return openai.NewClientWithConfig(config)
}

func TestBasicCompletion(t *testing.T) {
	client := setupClient(t)

	resp, err := client.CreateChatCompletion(
		context.Background(),
		openai.ChatCompletionRequest{
			Model: "echo",
			Messages: []openai.ChatCompletionMessage{
				{
					Role:    openai.ChatMessageRoleUser,
					Content: "Hello World",
				},
			},
		},
	)

	require.NoError(t, err)
	assert.Equal(t, "Hello World", resp.Choices[0].Message.Content)
	assert.Equal(t, "echo", resp.Model)
	assert.Equal(t, "chat.completion", resp.Object)
	assert.Greater(t, resp.Usage.TotalTokens, 0)
}

func TestMultiMessageConversation(t *testing.T) {
	client := setupClient(t)

	resp, err := client.CreateChatCompletion(
		context.Background(),
		openai.ChatCompletionRequest{
			Model: "echo",
			Messages: []openai.ChatCompletionMessage{
				{
					Role:    openai.ChatMessageRoleSystem,
					Content: "You are a helpful assistant.",
				},
				{
					Role:    openai.ChatMessageRoleUser,
					Content: "First message",
				},
				{
					Role:    openai.ChatMessageRoleAssistant,
					Content: "First response",
				},
				{
					Role:    openai.ChatMessageRoleUser,
					Content: "Last message",
				},
			},
		},
	)

	require.NoError(t, err)
	assert.Equal(t, "Last message", resp.Choices[0].Message.Content)
}

func TestSystemPromptWithUserMessage(t *testing.T) {
	client := setupClient(t)

	resp, err := client.CreateChatCompletion(
		context.Background(),
		openai.ChatCompletionRequest{
			Model: "echo",
			Messages: []openai.ChatCompletionMessage{
				{
					Role:    openai.ChatMessageRoleSystem,
					Content: "You are a helpful assistant.",
				},
				{
					Role:    openai.ChatMessageRoleUser,
					Content: "Test message",
				},
			},
		},
	)

	require.NoError(t, err)
	// Echo model should return the user message, ignoring system prompt
	assert.Equal(t, "Test message", resp.Choices[0].Message.Content)
}

func TestSystemOnlyReturnsDefault(t *testing.T) {
	client := setupClient(t)

	resp, err := client.CreateChatCompletion(
		context.Background(),
		openai.ChatCompletionRequest{
			Model: "echo",
			Messages: []openai.ChatCompletionMessage{
				{
					Role:    openai.ChatMessageRoleSystem,
					Content: "You are a helpful assistant.",
				},
			},
		},
	)

	require.NoError(t, err)
	// Should get the default echo model greeting
	assert.Contains(t, resp.Choices[0].Message.Content, "Echo model")
}

func TestResponseStructure(t *testing.T) {
	client := setupClient(t)

	resp, err := client.CreateChatCompletion(
		context.Background(),
		openai.ChatCompletionRequest{
			Model: "echo",
			Messages: []openai.ChatCompletionMessage{
				{
					Role:    openai.ChatMessageRoleUser,
					Content: "Structure test",
				},
			},
		},
	)

	require.NoError(t, err)

	// Check required fields
	assert.NotEmpty(t, resp.ID)
	assert.Equal(t, "chat.completion", resp.Object)
	assert.Greater(t, resp.Created, int64(0))
	assert.Equal(t, "echo", resp.Model)
	assert.NotEmpty(t, resp.Choices)

	// Check choice structure
	choice := resp.Choices[0]
	assert.Equal(t, 0, choice.Index)
	assert.NotEmpty(t, choice.Message)
	assert.Equal(t, openai.FinishReasonStop, choice.FinishReason)

	// Check message structure
	assert.Equal(t, openai.ChatMessageRoleAssistant, choice.Message.Role)
	assert.Equal(t, "Structure test", choice.Message.Content)

	// Check usage structure
	assert.GreaterOrEqual(t, resp.Usage.PromptTokens, 0)
	assert.GreaterOrEqual(t, resp.Usage.CompletionTokens, 0)
	assert.Greater(t, resp.Usage.TotalTokens, 0)
}

func TestEmptyMessageHandling(t *testing.T) {
	client := setupClient(t)

	resp, err := client.CreateChatCompletion(
		context.Background(),
		openai.ChatCompletionRequest{
			Model: "echo",
			Messages: []openai.ChatCompletionMessage{
				{
					Role:    openai.ChatMessageRoleUser,
					Content: "",
				},
			},
		},
	)

	require.NoError(t, err)
	// Empty input should be handled gracefully
	assert.NotNil(t, resp.Choices[0].Message.Content)
}

func TestSpecialCharactersAndUnicode(t *testing.T) {
	client := setupClient(t)
	testMessage := "Hello! 🌟 Special chars: @#$%^&*()_+-={}[]|\\:;\"'<>?,./ 中文"

	resp, err := client.CreateChatCompletion(
		context.Background(),
		openai.ChatCompletionRequest{
			Model: "echo",
			Messages: []openai.ChatCompletionMessage{
				{
					Role:    openai.ChatMessageRoleUser,
					Content: testMessage,
				},
			},
		},
	)

	require.NoError(t, err)
	assert.Equal(t, testMessage, resp.Choices[0].Message.Content)
}

func TestMultilineContent(t *testing.T) {
	client := setupClient(t)
	multilineMessage := "Line 1\nLine 2\nLine 3 with more content\nFinal line"

	resp, err := client.CreateChatCompletion(
		context.Background(),
		openai.ChatCompletionRequest{
			Model: "echo",
			Messages: []openai.ChatCompletionMessage{
				{
					Role:    openai.ChatMessageRoleUser,
					Content: multilineMessage,
				},
			},
		},
	)

	require.NoError(t, err)
	assert.Equal(t, multilineMessage, resp.Choices[0].Message.Content)
}