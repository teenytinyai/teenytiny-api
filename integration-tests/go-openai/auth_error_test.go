package main

import (
	"context"
	"os"
	"testing"

	"github.com/sashabaranov/go-openai"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestMissingApiKey(t *testing.T) {
	baseURL := os.Getenv("TEENYTINY_URL")
	if baseURL == "" {
		baseURL = "http://localhost:8080"
	}

	config := openai.DefaultConfig("")  // Empty API key
	config.BaseURL = baseURL + "/v1"
	client := openai.NewClientWithConfig(config)

	_, err := client.CreateChatCompletion(
		context.Background(),
		openai.ChatCompletionRequest{
			Model: "echo",
			Messages: []openai.ChatCompletionMessage{
				{
					Role:    openai.ChatMessageRoleUser,
					Content: "Test message",
				},
			},
		},
	)

	require.Error(t, err)
	// Check that it's an authentication error (401)
	assert.Contains(t, err.Error(), "401")
}

func TestInvalidApiKey(t *testing.T) {
	baseURL := os.Getenv("TEENYTINY_URL")
	if baseURL == "" {
		baseURL = "http://localhost:8080"
	}

	config := openai.DefaultConfig("invalid-key-12345")
	config.BaseURL = baseURL + "/v1"
	client := openai.NewClientWithConfig(config)

	_, err := client.CreateChatCompletion(
		context.Background(),
		openai.ChatCompletionRequest{
			Model: "echo",
			Messages: []openai.ChatCompletionMessage{
				{
					Role:    openai.ChatMessageRoleUser,
					Content: "Test message",
				},
			},
		},
	)

	require.Error(t, err)
	// Check that it's an authentication error (401)
	assert.Contains(t, err.Error(), "401")
}

func TestEmptyMessagesArray(t *testing.T) {
	client := setupClient(t)

	_, err := client.CreateChatCompletion(
		context.Background(),
		openai.ChatCompletionRequest{
			Model:    "echo",
			Messages: []openai.ChatCompletionMessage{}, // Empty messages
		},
	)

	require.Error(t, err)
	// Check that it's a bad request error (400)
	assert.Contains(t, err.Error(), "400")
}

func TestStreamingWithInvalidApiKey(t *testing.T) {
	baseURL := os.Getenv("TEENYTINY_URL")
	if baseURL == "" {
		baseURL = "http://localhost:8080"
	}

	config := openai.DefaultConfig("invalid-streaming-key")
	config.BaseURL = baseURL + "/v1"
	client := openai.NewClientWithConfig(config)

	_, err := client.CreateChatCompletionStream(
		context.Background(),
		openai.ChatCompletionRequest{
			Model: "echo",
			Messages: []openai.ChatCompletionMessage{
				{
					Role:    openai.ChatMessageRoleUser,
					Content: "Test message",
				},
			},
			Stream: true,
		},
	)

	require.Error(t, err)
	// Check that it's an authentication error (401)
	assert.Contains(t, err.Error(), "401")
}