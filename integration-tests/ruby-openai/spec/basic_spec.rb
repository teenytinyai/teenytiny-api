require 'spec_helper'

RSpec.describe 'Basic Ruby OpenAI Integration' do
  let(:client) { create_test_client }

  describe 'basic completion with echo model' do
    it 'returns the input message' do
      response = client.chat(
        parameters: {
          model: 'echo',
          messages: [
            { role: 'user', content: 'Hello World' }
          ]
        }
      )

      expect(response.dig('choices', 0, 'message', 'content')).to eq('Hello World')
      expect(response['model']).to eq('echo')
      expect(response['object']).to eq('chat.completion')
      expect(response.dig('usage', 'total_tokens')).to be > 0
    end
  end

  describe 'multi-message conversation' do
    it 'returns the last user message' do
      response = client.chat(
        parameters: {
          model: 'echo',
          messages: [
            { role: 'system', content: 'You are a helpful assistant.' },
            { role: 'user', content: 'First message' },
            { role: 'assistant', content: 'First response' },
            { role: 'user', content: 'Last message' }
          ]
        }
      )

      expect(response.dig('choices', 0, 'message', 'content')).to eq('Last message')
    end
  end

  describe 'system prompt with user message' do
    it 'returns the user message, ignoring system prompt' do
      response = client.chat(
        parameters: {
          model: 'echo',
          messages: [
            { role: 'system', content: 'You are a helpful assistant.' },
            { role: 'user', content: 'Test message' }
          ]
        }
      )

      expect(response.dig('choices', 0, 'message', 'content')).to eq('Test message')
    end
  end

  describe 'system only returns default response' do
    it 'returns default echo model greeting' do
      response = client.chat(
        parameters: {
          model: 'echo',
          messages: [
            { role: 'system', content: 'You are a helpful assistant.' }
          ]
        }
      )

      content = response.dig('choices', 0, 'message', 'content')
      expect(content).to include('Echo model')
    end
  end

  describe 'response structure matches OpenAI format' do
    it 'has all required fields' do
      response = client.chat(
        parameters: {
          model: 'echo',
          messages: [{ role: 'user', content: 'Structure test' }]
        }
      )

      # Check required fields
      expect(response['id']).to be_truthy
      expect(response['object']).to eq('chat.completion')
      expect(response['created']).to be_truthy
      expect(response['model']).to eq('echo')
      expect(response['choices']).to be_an(Array)
      expect(response['usage']).to be_truthy

      # Check choice structure
      choice = response['choices'][0]
      expect(choice['index']).to eq(0)
      expect(choice['message']).to be_truthy
      expect(choice['finish_reason']).to eq('stop')

      # Check message structure
      expect(choice['message']['role']).to eq('assistant')
      expect(choice['message']['content']).to eq('Structure test')

      # Check usage structure
      usage = response['usage']
      expect(usage['prompt_tokens']).to be >= 0
      expect(usage['completion_tokens']).to be >= 0
      expect(usage['total_tokens']).to be > 0
    end
  end

  describe 'empty message handling' do
    it 'handles empty input gracefully' do
      response = client.chat(
        parameters: {
          model: 'echo',
          messages: [{ role: 'user', content: '' }]
        }
      )

      expect(response.dig('choices', 0, 'message', 'content')).to be_a(String)
    end
  end

  describe 'special characters and unicode' do
    it 'preserves special characters and unicode' do
      test_message = "Hello! 🌟 Special chars: @#$%^&*()_+-={}[]|\\:;\"'<>?,./ 中文"

      response = client.chat(
        parameters: {
          model: 'echo',
          messages: [{ role: 'user', content: test_message }]
        }
      )

      expect(response.dig('choices', 0, 'message', 'content')).to eq(test_message)
    end
  end

  describe 'multiline content' do
    it 'preserves multiline formatting' do
      multiline_message = "Line 1\nLine 2\nLine 3 with more content\nFinal line"

      response = client.chat(
        parameters: {
          model: 'echo',
          messages: [{ role: 'user', content: multiline_message }]
        }
      )

      expect(response.dig('choices', 0, 'message', 'content')).to eq(multiline_message)
    end
  end
end