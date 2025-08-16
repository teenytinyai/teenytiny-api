package tests

import (
	"bufio"
	"bytes"
	"encoding/json"
	"net/http"
	"os"
	"os/exec"
	"strings"
	"testing"

	"github.com/teenytinyai/teenytiny-api/internal/server"
)

const (
	testAPIKey = "tt-test-key-123"
)

// TestServerIntegration runs integration tests against a real server instance
func TestServerIntegration(t *testing.T) {
	// Create and start test server
	testServer, err := server.NewTestServer(testAPIKey)
	if err != nil {
		t.Fatalf("Failed to create test server: %v", err)
	}
	
	if err := testServer.Start(); err != nil {
		t.Fatalf("Failed to start test server: %v", err)
	}
	
	// Ensure server is stopped when test finishes
	defer func() {
		if err := testServer.Stop(); err != nil {
			t.Logf("Warning: failed to stop test server: %v", err)
		}
	}()
	
	// Create test context with server info
	testCtx := &testContext{
		server: testServer,
		baseURL: testServer.BaseURL(),
		apiKey: testServer.APIKey(),
	}
	
	// Run subtests
	t.Run("HealthCheck", testCtx.testHealthCheck)
	t.Run("Models", testCtx.testModels)
	t.Run("ChatCompletion", testCtx.testChatCompletion)
	t.Run("ChatCompletionStreaming", testCtx.testChatCompletionStreaming)
	t.Run("Authentication", testCtx.testAuthentication)
	t.Run("LLMToolCompatibility", testCtx.testLLMToolCompatibility)
}

// testContext holds test server information
type testContext struct {
	server  *server.TestServer
	baseURL string
	apiKey  string
}

func (ctx *testContext) testHealthCheck(t *testing.T) {
	resp, err := http.Get(ctx.baseURL + "/health")
	if err != nil {
		t.Fatalf("Health check failed: %v", err)
	}
	defer resp.Body.Close()
	
	if resp.StatusCode != http.StatusOK {
		t.Errorf("Expected status 200, got %d", resp.StatusCode)
	}
	
	var result map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		t.Fatalf("Failed to decode health response: %v", err)
	}
	
	if result["status"] != "ok" {
		t.Errorf("Expected status 'ok', got '%v'", result["status"])
	}
}

func (ctx *testContext) testModels(t *testing.T) {
	req, _ := http.NewRequest("GET", ctx.baseURL+"/v1/models", nil)
	req.Header.Set("Authorization", "Bearer "+ctx.apiKey)
	
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		t.Fatalf("Models request failed: %v", err)
	}
	defer resp.Body.Close()
	
	if resp.StatusCode != http.StatusOK {
		t.Errorf("Expected status 200, got %d", resp.StatusCode)
	}
	
	var result map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		t.Fatalf("Failed to decode models response: %v", err)
	}
	
	if result["object"] != "list" {
		t.Errorf("Expected object 'list', got '%v'", result["object"])
	}
	
	data, ok := result["data"].([]interface{})
	if !ok || len(data) == 0 {
		t.Error("Expected non-empty data array")
	}
	
	// Check that echo model exists
	foundEcho := false
	for _, item := range data {
		model := item.(map[string]interface{})
		if model["id"] == "echo" {
			foundEcho = true
			break
		}
	}
	if !foundEcho {
		t.Error("Echo model not found in models list")
	}
}

func (ctx *testContext) testChatCompletion(t *testing.T) {
	requestBody := map[string]interface{}{
		"model": "echo",
		"messages": []map[string]string{
			{"role": "user", "content": "Hello, Echo!"},
		},
	}
	
	jsonData, _ := json.Marshal(requestBody)
	req, _ := http.NewRequest("POST", ctx.baseURL+"/v1/chat/completions", bytes.NewBuffer(jsonData))
	req.Header.Set("Authorization", "Bearer "+ctx.apiKey)
	req.Header.Set("Content-Type", "application/json")
	
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		t.Fatalf("Chat completion request failed: %v", err)
	}
	defer resp.Body.Close()
	
	if resp.StatusCode != http.StatusOK {
		t.Errorf("Expected status 200, got %d", resp.StatusCode)
	}
	
	var result map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		t.Fatalf("Failed to decode chat completion response: %v", err)
	}
	
	// Verify response structure
	if result["object"] != "chat.completion" {
		t.Errorf("Expected object 'chat.completion', got '%v'", result["object"])
	}
	
	choices, ok := result["choices"].([]interface{})
	if !ok || len(choices) == 0 {
		t.Fatal("Expected non-empty choices array")
	}
	
	choice := choices[0].(map[string]interface{})
	message := choice["message"].(map[string]interface{})
	content := message["content"].(string)
	
	// Echo model should return the input message
	if content != "Hello, Echo!" {
		t.Errorf("Expected echo response 'Hello, Echo!', got '%s'", content)
	}
	
	// Check usage information
	usage, ok := result["usage"].(map[string]interface{})
	if !ok {
		t.Fatal("Expected usage information")
	}
	
	if usage["total_tokens"] == nil {
		t.Error("Expected total_tokens in usage")
	}
}

func (ctx *testContext) testChatCompletionStreaming(t *testing.T) {
	requestBody := map[string]interface{}{
		"model": "echo",
		"messages": []map[string]string{
			{"role": "user", "content": "Stream this message"},
		},
		"stream": true,
	}
	
	jsonData, _ := json.Marshal(requestBody)
	req, _ := http.NewRequest("POST", ctx.baseURL+"/v1/chat/completions", bytes.NewBuffer(jsonData))
	req.Header.Set("Authorization", "Bearer "+ctx.apiKey)
	req.Header.Set("Content-Type", "application/json")
	
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		t.Fatalf("Streaming chat completion request failed: %v", err)
	}
	defer resp.Body.Close()
	
	if resp.StatusCode != http.StatusOK {
		t.Errorf("Expected status 200, got %d", resp.StatusCode)
	}
	
	// Check content type for streaming
	contentType := resp.Header.Get("Content-Type")
	if !strings.Contains(contentType, "text/event-stream") {
		t.Errorf("Expected event-stream content type, got %s", contentType)
	}
	
	// Read streaming response
	scanner := bufio.NewScanner(resp.Body)
	var chunks []string
	
	for scanner.Scan() {
		line := scanner.Text()
		if strings.HasPrefix(line, "data: ") {
			data := strings.TrimPrefix(line, "data: ")
			if data == "[DONE]" {
				break
			}
			chunks = append(chunks, data)
		}
	}
	
	if len(chunks) == 0 {
		t.Fatal("Expected streaming chunks, got none")
	}
	
	// Verify at least one chunk contains content
	foundContent := false
	for _, chunk := range chunks {
		var chunkData map[string]interface{}
		if err := json.Unmarshal([]byte(chunk), &chunkData); err != nil {
			continue
		}
		
		choices, ok := chunkData["choices"].([]interface{})
		if !ok || len(choices) == 0 {
			continue
		}
		
		choice := choices[0].(map[string]interface{})
		delta, ok := choice["delta"].(map[string]interface{})
		if !ok {
			continue
		}
		
		if content, ok := delta["content"].(string); ok && content != "" {
			foundContent = true
			break
		}
	}
	
	if !foundContent {
		t.Error("Expected to find content in streaming chunks")
	}
}

func (ctx *testContext) testAuthentication(t *testing.T) {
	// Test without authorization header
	resp, err := http.Post(ctx.baseURL+"/v1/chat/completions", "application/json", nil)
	if err != nil {
		t.Fatalf("Request failed: %v", err)
	}
	defer resp.Body.Close()
	
	if resp.StatusCode != http.StatusUnauthorized {
		t.Errorf("Expected status 401, got %d", resp.StatusCode)
	}
	
	// Test with invalid API key
	req, _ := http.NewRequest("POST", ctx.baseURL+"/v1/chat/completions", nil)
	req.Header.Set("Authorization", "Bearer invalid-key")
	
	client := &http.Client{}
	resp, err = client.Do(req)
	if err != nil {
		t.Fatalf("Request failed: %v", err)
	}
	defer resp.Body.Close()
	
	if resp.StatusCode != http.StatusUnauthorized {
		t.Errorf("Expected status 401, got %d", resp.StatusCode)
	}
}

func (ctx *testContext) testLLMToolCompatibility(t *testing.T) {
	// Test if llm tool is available
	_, err := exec.LookPath("llm")
	if err != nil {
		t.Skip("llm tool not found, skipping compatibility test")
	}
	
	// Try to configure llm with our endpoint
	configCmd := exec.Command("llm", "keys", "set", "teenytiny")
	configCmd.Stdin = strings.NewReader(ctx.apiKey)
	if err := configCmd.Run(); err != nil {
		t.Logf("Warning: Could not configure llm keys: %v", err)
	}
	
	// Set the API base URL for llm (this might not work depending on llm version)
	os.Setenv("TEENYTINY_API_BASE", ctx.baseURL+"/v1")
	
	// Test basic llm command (this is a simplified test)
	// Note: Actual llm integration would require more setup
	t.Log("LLM tool found - manual testing required for full compatibility")
	
	// For now, just verify our API format matches what llm expects
	// by testing the same request format llm would send
	ctx.testChatCompletion(t)
}

// TestCurlExamples tests the examples that would be shown in documentation
func TestCurlExamples(t *testing.T) {
	// Create and start test server
	testServer, err := server.NewTestServer(testAPIKey)
	if err != nil {
		t.Fatalf("Failed to create test server: %v", err)
	}
	
	if err := testServer.Start(); err != nil {
		t.Fatalf("Failed to start test server: %v", err)
	}
	
	// Ensure server is stopped when test finishes
	defer func() {
		if err := testServer.Stop(); err != nil {
			t.Logf("Warning: failed to stop test server: %v", err)
		}
	}()
	
	examples := []struct {
		name string
		cmd  []string
	}{
		{
			name: "basic_chat_completion",
			cmd: []string{
				"curl", "-s", "-X", "POST", testServer.URL("/v1/chat/completions"),
				"-H", "Authorization: Bearer " + testServer.APIKey(),
				"-H", "Content-Type: application/json",
				"-d", `{"model": "echo", "messages": [{"role": "user", "content": "Hello!"}]}`,
			},
		},
		{
			name: "streaming_chat_completion",
			cmd: []string{
				"curl", "-s", "-X", "POST", testServer.URL("/v1/chat/completions"),
				"-H", "Authorization: Bearer " + testServer.APIKey(),
				"-H", "Content-Type: application/json",
				"-d", `{"model": "echo", "messages": [{"role": "user", "content": "Hello!"}], "stream": true}`,
			},
		},
		{
			name: "list_models",
			cmd: []string{
				"curl", "-s", "-X", "GET", testServer.URL("/v1/models"),
				"-H", "Authorization: Bearer " + testServer.APIKey(),
			},
		},
	}
	
	for _, example := range examples {
		t.Run(example.name, func(t *testing.T) {
			cmd := exec.Command(example.cmd[0], example.cmd[1:]...)
			output, err := cmd.Output()
			if err != nil {
				t.Fatalf("Curl command failed: %v", err)
			}
			
			// Basic validation - ensure we get valid JSON
			var result map[string]interface{}
			if err := json.Unmarshal(output, &result); err != nil {
				t.Errorf("Invalid JSON response: %v\nOutput: %s", err, string(output))
			}
			
			t.Logf("Example %s output: %s", example.name, string(output))
		})
	}
}