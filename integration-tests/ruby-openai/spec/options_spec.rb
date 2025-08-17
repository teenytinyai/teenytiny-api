require 'spec_helper'

RSpec.describe 'Options and Configuration Ruby OpenAI Integration' do
  let(:client) { create_test_client }

  describe 'custom temperature parameter' do
    it 'accepts temperature parameter and returns expected response' do
      response = client.chat(
        parameters: {
          model: 'echo',
          temperature: 0.7,
          messages: [
            { role: 'user', content: 'Temperature test' }
          ]
        }
      )

      # Echo model should still return the same content regardless of temperature
      expect(response.dig('choices', 0, 'message', 'content')).to eq('Temperature test')
      expect(response['model']).to eq('echo')
      expect(response.dig('usage', 'total_tokens')).to be > 0
    end
  end

  describe 'custom max_tokens parameter' do
    it 'accepts max_tokens parameter and returns expected response' do
      response = client.chat(
        parameters: {
          model: 'echo',
          max_tokens: 50,
          messages: [
            { role: 'user', content: 'Max tokens test' }
          ]
        }
      )

      expect(response.dig('choices', 0, 'message', 'content')).to eq('Max tokens test')
      # Usage tokens should be within reasonable bounds for the echo model
      expect(response.dig('usage', 'total_tokens')).to be <= 100
    end
  end

  describe 'multiple parameters combined' do
    it 'accepts multiple parameters and returns expected response' do
      response = client.chat(
        parameters: {
          model: 'echo',
          temperature: 0.5,
          max_tokens: 100,
          top_p: 0.9,
          messages: [
            { role: 'user', content: 'Combined parameters' }
          ]
        }
      )

      expect(response.dig('choices', 0, 'message', 'content')).to eq('Combined parameters')
      expect(response['model']).to eq('echo')
      expect(response.dig('usage', 'total_tokens')).to be > 0
    end
  end

  describe 'streaming with parameters' do
    it 'accepts parameters in streaming mode' do
      content_parts = []
      model_checks = []

      client.chat(
        parameters: {
          model: 'echo',
          temperature: 0.8,
          max_tokens: 75,
          messages: [
            { role: 'user', content: 'Streaming with options' }
          ],
          stream: proc do |chunk, _bytesize|
            model_checks << chunk['model']

            if chunk.dig('choices', 0, 'delta', 'content')
              content_parts << chunk.dig('choices', 0, 'delta', 'content')
            end
          end
        }
      )

      expect(content_parts.join).to eq('Streaming with options')
      expect(model_checks.all? { |model| model == 'echo' }).to be true
    end
  end

  describe 'user parameter in request' do
    it 'accepts user parameter and returns expected response' do
      response = client.chat(
        parameters: {
          model: 'echo',
          user: 'test-user-123',
          messages: [
            { role: 'user', content: 'User parameter test' }
          ]
        }
      )

      expect(response.dig('choices', 0, 'message', 'content')).to eq('User parameter test')
      expect(response['model']).to eq('echo')
    end
  end

  describe 'seed parameter for reproducibility' do
    it 'accepts seed parameter and returns consistent results' do
      test_message = 'Seed test message'
      seed = 12345

      # First request with seed
      response1 = client.chat(
        parameters: {
          model: 'echo',
          seed: seed,
          messages: [
            { role: 'user', content: test_message }
          ]
        }
      )

      # Second request with same seed
      response2 = client.chat(
        parameters: {
          model: 'echo',
          seed: seed,
          messages: [
            { role: 'user', content: test_message }
          ]
        }
      )

      # Echo model should return identical responses
      expect(response1.dig('choices', 0, 'message', 'content')).to eq(response2.dig('choices', 0, 'message', 'content'))
      expect(response1.dig('choices', 0, 'message', 'content')).to eq(test_message)
    end
  end

  describe 'frequency and presence penalty parameters' do
    it 'accepts penalty parameters and returns expected response' do
      response = client.chat(
        parameters: {
          model: 'echo',
          frequency_penalty: 0.5,
          presence_penalty: 0.3,
          messages: [
            { role: 'user', content: 'Penalty parameters test' }
          ]
        }
      )

      # Echo model should still work with penalty parameters
      expect(response.dig('choices', 0, 'message', 'content')).to eq('Penalty parameters test')
      expect(response['model']).to eq('echo')
    end
  end

  describe 'stop sequences parameter' do
    it 'accepts stop parameter and returns expected response' do
      response = client.chat(
        parameters: {
          model: 'echo',
          stop: ["\n", "STOP"],
          messages: [
            { role: 'user', content: 'Stop sequences test' }
          ]
        }
      )

      expect(response.dig('choices', 0, 'message', 'content')).to eq('Stop sequences test')
      expect(response['model']).to eq('echo')
    end
  end

  describe 'logit_bias parameter' do
    it 'accepts logit_bias parameter and returns expected response' do
      response = client.chat(
        parameters: {
          model: 'echo',
          logit_bias: { "50256" => -100 },  # Suppress end-of-text token
          messages: [
            { role: 'user', content: 'Logit bias test' }
          ]
        }
      )

      expect(response.dig('choices', 0, 'message', 'content')).to eq('Logit bias test')
      expect(response['model']).to eq('echo')
    end
  end

  describe 'response format parameter' do
    it 'accepts response_format parameter and returns expected response' do
      response = client.chat(
        parameters: {
          model: 'echo',
          response_format: { type: 'text' },
          messages: [
            { role: 'user', content: 'Response format test' }
          ]
        }
      )

      expect(response.dig('choices', 0, 'message', 'content')).to eq('Response format test')
      expect(response['model']).to eq('echo')
    end
  end
end