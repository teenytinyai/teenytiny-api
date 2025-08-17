require 'spec_helper'

RSpec.describe 'Authentication Error Ruby OpenAI Integration' do
  let(:base_url) { ENV['TEENYTINY_URL'] || 'http://localhost:8080' }

  describe 'missing API key' do
    it 'returns 401 unauthorized error' do
      client = OpenAI::Client.new(
        access_token: '',  # Empty API key
        uri_base: base_url
      )

      expect {
        client.chat(
          parameters: {
            model: 'echo',
            messages: [
              { role: 'user', content: 'Test message' }
            ]
          }
        )
      }.to raise_error(Faraday::UnauthorizedError)
    end
  end

  describe 'invalid API key' do
    it 'returns 401 unauthorized error' do
      client = OpenAI::Client.new(
        access_token: 'invalid-key-12345',
        uri_base: base_url
      )

      expect {
        client.chat(
          parameters: {
            model: 'echo',
            messages: [
              { role: 'user', content: 'Test message' }
            ]
          }
        )
      }.to raise_error(Faraday::UnauthorizedError)
    end
  end

  describe 'missing Bearer prefix API key' do
    it 'returns 401 unauthorized error' do
      client = OpenAI::Client.new(
        access_token: 'no-bearer-prefix-key',
        uri_base: base_url
      )

      expect {
        client.chat(
          parameters: {
            model: 'echo',
            messages: [
              { role: 'user', content: 'Test message' }
            ]
          }
        )
      }.to raise_error(Faraday::UnauthorizedError)
    end
  end

  describe 'empty messages array' do
    it 'returns 400 bad request error' do
      client = OpenAI::Client.new(
        access_token: ENV['TEENYTINY_API_KEY'] || 'testkey',
        uri_base: base_url
      )

      expect {
        client.chat(
          parameters: {
            model: 'echo',
            messages: []  # Empty messages array
          }
        )
      }.to raise_error(Faraday::BadRequestError)
    end
  end

  describe 'streaming with invalid API key' do
    it 'returns 401 unauthorized error' do
      client = OpenAI::Client.new(
        access_token: 'invalid-streaming-key',
        uri_base: base_url
      )

      expect {
        client.chat(
          parameters: {
            model: 'echo',
            messages: [
              { role: 'user', content: 'Test message' }
            ],
            stream: proc do |chunk, _bytesize|
              # This should not be reached due to auth error
            end
          }
        )
      }.to raise_error(Faraday::UnauthorizedError)
    end
  end

  describe 'malformed request structure' do
    it 'returns 400 bad request for missing model' do
      client = OpenAI::Client.new(
        access_token: ENV['TEENYTINY_API_KEY'] || 'testkey',
        uri_base: base_url
      )

      expect {
        client.chat(
          parameters: {
            # model: 'echo',  # Missing required model parameter
            messages: [
              { role: 'user', content: 'Test message' }
            ]
          }
        )
      }.to raise_error(Faraday::BadRequestError)
    end
  end

  describe 'invalid model name' do
    it 'returns 400 bad request for non-existent model' do
      client = OpenAI::Client.new(
        access_token: ENV['TEENYTINY_API_KEY'] || 'testkey',
        uri_base: base_url
      )

      expect {
        client.chat(
          parameters: {
            model: 'nonexistent-model',
            messages: [
              { role: 'user', content: 'Test message' }
            ]
          }
        )
      }.to raise_error(Faraday::BadRequestError)
    end
  end
end