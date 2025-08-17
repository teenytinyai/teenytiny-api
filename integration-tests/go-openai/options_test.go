package main

import (
	"context"
	"io"
	"strings"
	"testing"

	"github.com/sashabaranov/go-openai"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestCustomTemperatureParameter(t *testing.T) {
	client := setupClient(t)

	resp, err := client.CreateChatCompletion(
		context.Background(),
		openai.ChatCompletionRequest{
			Model:       "echo",
			Temperature: 0.7,
			Messages: []openai.ChatCompletionMessage{
				{
					Role:    openai.ChatMessageRoleUser,
					Content: "Temperature test",
				},
			},
		},
	)

	require.NoError(t, err)
	// Echo model should still return the same content regardless of temperature
	assert.Equal(t, "Temperature test", resp.Choices[0].Message.Content)
	assert.Equal(t, "echo", resp.Model)
}

func TestCustomMaxTokensParameter(t *testing.T) {
	client := setupClient(t)

	resp, err := client.CreateChatCompletion(
		context.Background(),
		openai.ChatCompletionRequest{
			Model:     "echo",
			MaxTokens: 50,
			Messages: []openai.ChatCompletionMessage{
				{
					Role:    openai.ChatMessageRoleUser,
					Content: "Max tokens test",
				},
			},
		},
	)

	require.NoError(t, err)
	assert.Equal(t, "Max tokens test", resp.Choices[0].Message.Content)
	// Usage tokens should be within reasonable bounds for the echo model
	assert.LessOrEqual(t, resp.Usage.TotalTokens, 100)
}

func TestMultipleParametersCombined(t *testing.T) {
	client := setupClient(t)

	resp, err := client.CreateChatCompletion(
		context.Background(),
		openai.ChatCompletionRequest{
			Model:       "echo",
			Temperature: 0.5,
			MaxTokens:   100,
			TopP:        0.9,
			Messages: []openai.ChatCompletionMessage{
				{
					Role:    openai.ChatMessageRoleUser,
					Content: "Combined parameters",
				},
			},
		},
	)

	require.NoError(t, err)
	assert.Equal(t, "Combined parameters", resp.Choices[0].Message.Content)
	assert.Equal(t, "echo", resp.Model)
	assert.Greater(t, resp.Usage.TotalTokens, 0)
}

func TestStreamingWithParameters(t *testing.T) {
	client := setupClient(t)

	req := openai.ChatCompletionRequest{
		Model:       "echo",
		Temperature: 0.8,
		MaxTokens:   75,
		Messages: []openai.ChatCompletionMessage{
			{
				Role:    openai.ChatMessageRoleUser,
				Content: "Streaming with options",
			},
		},
		Stream: true,
	}

	stream, err := client.CreateChatCompletionStream(context.Background(), req)
	require.NoError(t, err)
	defer stream.Close()

	var content strings.Builder

	for {
		response, err := stream.Recv()
		if err == io.EOF {
			break
		}
		require.NoError(t, err)

		assert.Equal(t, "echo", response.Model)

		if len(response.Choices) > 0 && response.Choices[0].Delta.Content != "" {
			content.WriteString(response.Choices[0].Delta.Content)
		}
	}

	assert.Equal(t, "Streaming with options", content.String())
}

func TestUserParameterInRequest(t *testing.T) {
	client := setupClient(t)

	resp, err := client.CreateChatCompletion(
		context.Background(),
		openai.ChatCompletionRequest{
			Model: "echo",
			User:  "test-user-123",
			Messages: []openai.ChatCompletionMessage{
				{
					Role:    openai.ChatMessageRoleUser,
					Content: "User parameter test",
				},
			},
		},
	)

	require.NoError(t, err)
	assert.Equal(t, "User parameter test", resp.Choices[0].Message.Content)
	assert.Equal(t, "echo", resp.Model)
}

func TestSeedParameterForReproducibility(t *testing.T) {
	client := setupClient(t)
	testMessage := "Seed test message"
	seed := 12345

	// First request with seed
	resp1, err := client.CreateChatCompletion(
		context.Background(),
		openai.ChatCompletionRequest{
			Model: "echo",
			Seed:  &seed,
			Messages: []openai.ChatCompletionMessage{
				{
					Role:    openai.ChatMessageRoleUser,
					Content: testMessage,
				},
			},
		},
	)

	require.NoError(t, err)

	// Second request with same seed
	resp2, err := client.CreateChatCompletion(
		context.Background(),
		openai.ChatCompletionRequest{
			Model: "echo",
			Seed:  &seed,
			Messages: []openai.ChatCompletionMessage{
				{
					Role:    openai.ChatMessageRoleUser,
					Content: testMessage,
				},
			},
		},
	)

	require.NoError(t, err)

	// Echo model should return identical responses
	assert.Equal(t, resp1.Choices[0].Message.Content, resp2.Choices[0].Message.Content)
	assert.Equal(t, testMessage, resp1.Choices[0].Message.Content)
}

func TestFrequencyAndPresencePenaltyParameters(t *testing.T) {
	client := setupClient(t)

	resp, err := client.CreateChatCompletion(
		context.Background(),
		openai.ChatCompletionRequest{
			Model:            "echo",
			FrequencyPenalty: 0.5,
			PresencePenalty:  0.3,
			Messages: []openai.ChatCompletionMessage{
				{
					Role:    openai.ChatMessageRoleUser,
					Content: "Penalty parameters test",
				},
			},
		},
	)

	require.NoError(t, err)
	// Echo model should still work with penalty parameters
	assert.Equal(t, "Penalty parameters test", resp.Choices[0].Message.Content)
	assert.Equal(t, "echo", resp.Model)
}