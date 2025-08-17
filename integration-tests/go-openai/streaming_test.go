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

func TestBasicStreamingCompletion(t *testing.T) {
	client := setupClient(t)

	req := openai.ChatCompletionRequest{
		Model: "echo",
		Messages: []openai.ChatCompletionMessage{
			{
				Role:    openai.ChatMessageRoleUser,
				Content: "Hello Stream",
			},
		},
		Stream: true,
	}

	stream, err := client.CreateChatCompletionStream(context.Background(), req)
	require.NoError(t, err)
	defer stream.Close()

	var responses []openai.ChatCompletionStreamResponse
	var content strings.Builder
	foundFinishReason := false

	for {
		response, err := stream.Recv()
		if err == io.EOF {
			break
		}
		require.NoError(t, err)

		responses = append(responses, response)

		// Collect content from delta
		if len(response.Choices) > 0 && response.Choices[0].Delta.Content != "" {
			content.WriteString(response.Choices[0].Delta.Content)
		}

		// Check for finish reason
		if len(response.Choices) > 0 && response.Choices[0].FinishReason != "" {
			foundFinishReason = true
			assert.Equal(t, openai.FinishReasonStop, response.Choices[0].FinishReason)
		}
	}

	assert.NotEmpty(t, responses, "Should receive at least one response")
	assert.Equal(t, "Hello Stream", content.String())
	assert.True(t, foundFinishReason, "Should receive finish reason")

	// Verify stream structure
	firstResponse := responses[0]
	assert.Equal(t, "echo", firstResponse.Model)
	assert.Equal(t, "chat.completion.chunk", firstResponse.Object)
	assert.NotEmpty(t, firstResponse.ID)
	assert.Greater(t, firstResponse.Created, int64(0))
}

func TestStreamingContentReconstruction(t *testing.T) {
	client := setupClient(t)

	req := openai.ChatCompletionRequest{
		Model: "echo",
		Messages: []openai.ChatCompletionMessage{
			{
				Role:    openai.ChatMessageRoleUser,
				Content: "Reconstruct me",
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

		if len(response.Choices) > 0 && response.Choices[0].Delta.Content != "" {
			content.WriteString(response.Choices[0].Delta.Content)
		}
	}

	assert.Equal(t, "Reconstruct me", content.String())
}

func TestStreamingWithMultilineContent(t *testing.T) {
	client := setupClient(t)
	multilineMessage := "Line 1\nLine 2\nLine 3"

	req := openai.ChatCompletionRequest{
		Model: "echo",
		Messages: []openai.ChatCompletionMessage{
			{
				Role:    openai.ChatMessageRoleUser,
				Content: multilineMessage,
			},
		},
		Stream: true,
	}

	stream, err := client.CreateChatCompletionStream(context.Background(), req)
	require.NoError(t, err)
	defer stream.Close()

	var content strings.Builder
	chunkCount := 0

	for {
		response, err := stream.Recv()
		if err == io.EOF {
			break
		}
		require.NoError(t, err)

		chunkCount++
		if len(response.Choices) > 0 && response.Choices[0].Delta.Content != "" {
			content.WriteString(response.Choices[0].Delta.Content)
		}
	}

	assert.Greater(t, chunkCount, 0, "Should receive chunks")
	assert.Equal(t, multilineMessage, content.String())
}

func TestStreamingWithSpecialCharacters(t *testing.T) {
	client := setupClient(t)
	specialMessage := "Hello! 🌟 Special: @#$%"

	req := openai.ChatCompletionRequest{
		Model: "echo",
		Messages: []openai.ChatCompletionMessage{
			{
				Role:    openai.ChatMessageRoleUser,
				Content: specialMessage,
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

		if len(response.Choices) > 0 && response.Choices[0].Delta.Content != "" {
			content.WriteString(response.Choices[0].Delta.Content)
		}
	}

	assert.Equal(t, specialMessage, content.String())
}

func TestStreamingResponseStructure(t *testing.T) {
	client := setupClient(t)

	req := openai.ChatCompletionRequest{
		Model: "echo",
		Messages: []openai.ChatCompletionMessage{
			{
				Role:    openai.ChatMessageRoleUser,
				Content: "Structure validation",
			},
		},
		Stream: true,
	}

	stream, err := client.CreateChatCompletionStream(context.Background(), req)
	require.NoError(t, err)
	defer stream.Close()

	foundValidContent := false

	for {
		response, err := stream.Recv()
		if err == io.EOF {
			break
		}
		require.NoError(t, err)

		// Each response should have basic structure
		assert.NotEmpty(t, response.ID)
		assert.Equal(t, "chat.completion.chunk", response.Object)
		assert.Equal(t, "echo", response.Model)
		assert.NotEmpty(t, response.Choices)

		// Check choice structure
		choice := response.Choices[0]
		assert.Equal(t, 0, choice.Index)

		// If this chunk has content, validate the delta structure
		if choice.Delta.Content != "" {
			foundValidContent = true
			// Role may be empty in streaming deltas after the first chunk
			// assert.Equal(t, openai.ChatMessageRoleAssistant, choice.Delta.Role)
		}
	}

	assert.True(t, foundValidContent, "Should find at least one response with content")
}